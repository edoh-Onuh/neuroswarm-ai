/**
 * WalletContext — Phantom-first wallet connection
 *
 * Connection priority:
 *   1. window.phantom.solana  — Phantom injected (most reliable)
 *   2. window.solflare        — Solflare injected
 *   3. Wallet Standard        — any other compliant wallet (Backpack, etc.)
 *
 * Why not Wallet Standard for Phantom? Phantom's WS implementation sometimes
 * returns empty accounts[] on connect() and delivers the real accounts via a
 * subsequent 'change' event. Using the injected provider directly sidesteps
 * the race and always works on the first try.
 */

'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { getWallets } from '@wallet-standard/app'
import type { Wallet, WalletAccount } from '@wallet-standard/base'

// ─── Window / injected provider types ────────────────────────────────
interface InjectedProvider {
  isPhantom?: boolean
  isSolflare?: boolean
  publicKey?: { toString(): string } | null
  connect(opts?: { onlyIfTrusted?: boolean }): Promise<{ publicKey: { toString(): string } }>
  disconnect(): Promise<void>
  on(event: string, cb: (...args: unknown[]) => void): void
  removeListener(event: string, cb: (...args: unknown[]) => void): void
}

declare global {
  interface Window {
    phantom?: { solana?: InjectedProvider }
    solana?: InjectedProvider & { isPhantom?: boolean }
    solflare?: InjectedProvider
  }
}

// ─── Wallet descriptor ────────────────────────────────────────────────
// Simpler than implementing the full Wallet Standard interface.
interface WalletEntry {
  name: string
  icon: string
  kind: 'injected' | 'standard'
  provider?: InjectedProvider      // set when kind === 'injected'
  wsWallet?: Wallet                // set when kind === 'standard'
}

// ─── Context value ────────────────────────────────────────────────────
interface WalletContextValue {
  wallets: WalletEntry[]
  selectedWallet: WalletEntry | null
  connectedAddress: string | null
  isConnected: boolean
  isConnecting: boolean
  error: string | null
  connect: (wallet: WalletEntry) => Promise<void>
  cancelConnect: () => void
  disconnect: () => void
}

const WalletContext = createContext<WalletContextValue | null>(null)

// ─── Provider ─────────────────────────────────────────────────────────
export function WalletStandardProvider({ children }: { children: ReactNode }) {
  const [wallets, setWallets] = useState<WalletEntry[]>([])
  const [selectedWallet, setSelectedWallet] = useState<WalletEntry | null>(null)
  const [connectedAddress, setConnectedAddress] = useState<string | null>(null)
  const [isConnecting, setIsConnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const connectingRef = useRef(false)
  const unsubRef = useRef<(() => void) | null>(null)

  // ── Wallet discovery ──────────────────────────────────────────────
  useEffect(() => {
    if (typeof window === 'undefined') return

    const seen = new Set<string>()
    const out: WalletEntry[] = []

    const addInjected = (name: string, icon: string, provider: InjectedProvider) => {
      if (!seen.has(name)) {
        seen.add(name)
        out.push({ name, icon, kind: 'injected', provider })
      }
    }

    // 1. Phantom — always prefer injected provider
    const phantom =
      window.phantom?.solana ??
      (window.solana?.isPhantom ? window.solana : null)
    if (phantom) {
      addInjected('Phantom', 'https://www.phantom.app/img/phantom-logo.png', phantom)
    }

    // 2. Solflare injected
    if (window.solflare) {
      addInjected('Solflare', 'https://solflare.com/assets/logo.svg', window.solflare)
    }

    // 3. Other Wallet Standard wallets (Backpack, etc.) — skip Phantom / Solflare (already added)
    const api = getWallets()
    const wsAll = api.get().filter(
      (w) =>
        !seen.has(w.name) &&
        ('standard:connect' in w.features ||
          'solana:signTransaction' in w.features ||
          'solana:signAndSendTransaction' in w.features),
    )
    for (const w of wsAll) {
      seen.add(w.name)
      out.push({
        name: w.name,
        icon: typeof w.icon === 'string' ? w.icon : '',
        kind: 'standard',
        wsWallet: w,
      })
    }

    setWallets(out)

    // Listen for newly-registered WS wallets (e.g. user installs extension mid-session)
    const unsubReg = api.on('register', (...newWallets) => {
      setWallets((prev) => {
        const existing = new Set(prev.map((w) => w.name))
        const toAdd = newWallets
          .filter(
            (w) =>
              !existing.has(w.name) &&
              ('standard:connect' in w.features ||
                'solana:signTransaction' in w.features ||
                'solana:signAndSendTransaction' in w.features),
          )
          .map((w): WalletEntry => ({
            name: w.name,
            icon: typeof w.icon === 'string' ? w.icon : '',
            kind: 'standard',
            wsWallet: w,
          }))
        return toAdd.length ? [...prev, ...toAdd] : prev
      })
    })

    // Retry once at 600 ms — catches injected wallets that load slightly after hydration
    const retryId = setTimeout(() => {
      setWallets((prev) => {
        const prevNames = new Set(prev.map((w) => w.name))
        const toAdd: WalletEntry[] = []
        const phantom2 =
          window.phantom?.solana ??
          (window.solana?.isPhantom ? window.solana : null)
        if (phantom2 && !prevNames.has('Phantom')) {
          toAdd.push({
            name: 'Phantom',
            icon: 'https://www.phantom.app/img/phantom-logo.png',
            kind: 'injected',
            provider: phantom2,
          })
        }
        if (window.solflare && !prevNames.has('Solflare')) {
          toAdd.push({
            name: 'Solflare',
            icon: 'https://solflare.com/assets/logo.svg',
            kind: 'injected',
            provider: window.solflare,
          })
        }
        return toAdd.length ? [...prev, ...toAdd] : prev
      })
    }, 600)

    return () => {
      unsubReg()
      clearTimeout(retryId)
    }
  }, [])

  // ── connect ───────────────────────────────────────────────────────
  const connect = useCallback(async (wallet: WalletEntry) => {
    setIsConnecting(true)
    connectingRef.current = true
    setError(null)

    // Clean up previous wallet listeners
    if (unsubRef.current) {
      unsubRef.current()
      unsubRef.current = null
    }

    try {
      if (wallet.kind === 'injected' && wallet.provider) {
        // ── Injected: window.phantom.solana.connect() ──────────────
        const provider = wallet.provider
        const result = await Promise.race([
          provider.connect(),
          new Promise<never>((_, reject) =>
            setTimeout(
              () => reject(new Error('Wallet popup timed out — try again')),
              30_000,
            ),
          ),
        ])
        if (!connectingRef.current) return

        const address = result.publicKey.toString()
        setConnectedAddress(address)
        setSelectedWallet(wallet)

        // Handle external disconnects & account switches
        const onDisconnect = () => {
          setSelectedWallet(null)
          setConnectedAddress(null)
        }
        const onAccountChange = (...args: unknown[]) => {
          const pk = args[0] as { toString(): string } | null
          if (pk) setConnectedAddress(pk.toString())
          else onDisconnect()
        }
        provider.on('disconnect', onDisconnect)
        provider.on('accountChanged', onAccountChange)
        unsubRef.current = () => {
          provider.removeListener('disconnect', onDisconnect)
          provider.removeListener('accountChanged', onAccountChange)
        }
        console.log('[Wallet] Connected (injected):', wallet.name, address)

      } else if (wallet.kind === 'standard' && wallet.wsWallet) {
        // ── Wallet Standard ────────────────────────────────────────
        const wsWallet = wallet.wsWallet
        const feature = wsWallet.features['standard:connect'] as
          | { connect(input?: { silent?: boolean }): Promise<{ accounts: readonly WalletAccount[] }> }
          | undefined

        if (!feature?.connect) {
          throw new Error(`"${wallet.name}" does not support standard:connect`)
        }

        const result = await Promise.race([
          feature.connect(),
          new Promise<never>((_, reject) =>
            setTimeout(
              () => reject(new Error('Wallet popup timed out — try again')),
              30_000,
            ),
          ),
        ])
        if (!connectingRef.current) return

        const accounts = result?.accounts?.length ? result.accounts : wsWallet.accounts
        if (!accounts.length) {
          throw new Error('No accounts returned — approval may have been rejected')
        }

        const address = accounts[0].address
        setConnectedAddress(address)
        setSelectedWallet(wallet)

        // Subscribe to account changes
        const eventsFeature = wsWallet.features['standard:events'] as
          | { on(event: string, cb: () => void): () => void }
          | undefined
        if (eventsFeature?.on) {
          unsubRef.current = eventsFeature.on('change', () => {
            if (wsWallet.accounts.length > 0) {
              setConnectedAddress(wsWallet.accounts[0].address)
            } else {
              setSelectedWallet(null)
              setConnectedAddress(null)
            }
          })
        }
        console.log('[Wallet] Connected (WS):', wallet.name, address)

      } else {
        throw new Error('Unsupported wallet type')
      }
    } catch (err) {
      if (!connectingRef.current) return // user cancelled
      const message = err instanceof Error ? err.message : 'Connection failed'
      console.error('[Wallet] Connect error:', message)
      setError(message)
      setSelectedWallet(null)
      setConnectedAddress(null)
      throw new Error(message) // re-throw so callers can keep UI open on failure
    } finally {
      connectingRef.current = false
      setIsConnecting(false)
    }
  }, [])

  const cancelConnect = useCallback(() => {
    connectingRef.current = false
    setIsConnecting(false)
    setError(null)
  }, [])

  const disconnect = useCallback(() => {
    if (unsubRef.current) {
      unsubRef.current()
      unsubRef.current = null
    }
    if (selectedWallet?.kind === 'injected' && selectedWallet.provider) {
      selectedWallet.provider.disconnect().catch(console.error)
    } else if (selectedWallet?.kind === 'standard' && selectedWallet.wsWallet) {
      const feature = selectedWallet.wsWallet.features['standard:disconnect'] as
        | { disconnect(): Promise<void> }
        | undefined
      if (feature?.disconnect) feature.disconnect().catch(console.error)
    }
    setSelectedWallet(null)
    setConnectedAddress(null)
    setError(null)
    console.log('[Wallet] Disconnected')
  }, [selectedWallet])

  // Clean up on unmount
  useEffect(() => () => { if (unsubRef.current) unsubRef.current() }, [])

  const value = useMemo<WalletContextValue>(
    () => ({
      wallets,
      selectedWallet,
      connectedAddress,
      isConnected: connectedAddress !== null,
      isConnecting,
      error,
      connect,
      cancelConnect,
      disconnect,
    }),
    [wallets, selectedWallet, connectedAddress, isConnecting, error, connect, cancelConnect, disconnect],
  )

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>
}

// ─── Hook ─────────────────────────────────────────────────────────────
export function useWallet() {
  const ctx = useContext(WalletContext)
  if (!ctx) throw new Error('useWallet must be used inside <WalletStandardProvider>')
  return ctx
}
