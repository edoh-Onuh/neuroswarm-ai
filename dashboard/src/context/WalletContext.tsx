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

    // Build an icon map from Wallet Standard registry — WS wallets carry the
    // extension's own base64 icon which is more reliable than external URLs.
    const api = getWallets()
    const wsIconMap = new Map<string, string>()
    for (const w of api.get()) {
      if (typeof w.icon === 'string' && w.icon) wsIconMap.set(w.name, w.icon)
    }

    // Fallback icons (used only if WS has no icon for this wallet)
    const PHANTOM_ICON_FALLBACK =
      'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0OCIgaGVpZ2h0PSI0OCIgdmlld0JveD0iMCAwIDQ4IDQ4Ij48cmVjdCB3aWR0aD0iNDgiIGhlaWdodD0iNDgiIHJ4PSIxMCIgZmlsbD0iIzU0MERGRiIvPjxwYXRoIGZpbGw9IndoaXRlIiBkPSJNMzcuNSAxNUgxMC41QzkuNyAxNSA5IDE1LjcgOSAxNi41djE1YzAgLjggLjcgMS41IDEuNSAxLjVoMjdjLjggMCAxLjUtLjcgMS41LTEuNXYtMTVjMC0uOC0uNy0xLjUtMS41LTEuNXptLTEzLjUgMTJjLTMuMyAwLTYtMi43LTYtNnMyLjctNiA2LTYgNiAyLjcgNiA2LTIuNyA2LTYgNnoiLz48L3N2Zz4='
    const SOLFLARE_ICON_FALLBACK =
      'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0OCIgaGVpZ2h0PSI0OCI+PHJlY3Qgd2lkdGg9IjQ4IiBoZWlnaHQ9IjQ4IiByeD0iMTAiIGZpbGw9IiNGRkMxMDAiLz48L3N2Zz4='

    const addInjected = (name: string, fallbackIcon: string, provider: InjectedProvider) => {
      if (!seen.has(name)) {
        seen.add(name)
        // Prefer WS icon (base64 from extension) over external URL
        out.push({ name, icon: wsIconMap.get(name) ?? fallbackIcon, kind: 'injected', provider })
      }
    }

    // 1. Phantom — always prefer injected provider
    const phantom =
      window.phantom?.solana ??
      (window.solana?.isPhantom ? window.solana : null)
    if (phantom) {
      addInjected('Phantom', PHANTOM_ICON_FALLBACK, phantom)
    }

    // 2. Solflare injected
    if (window.solflare) {
      addInjected('Solflare', SOLFLARE_ICON_FALLBACK, window.solflare)
    }

    // 3. Other Wallet Standard wallets (Backpack, etc.) — skip Phantom / Solflare (already added)
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
        // Refresh WS icon map in case Phantom registered after initial render
        const latestIconMap = new Map<string, string>()
        for (const w of api.get()) {
          if (typeof w.icon === 'string' && w.icon) latestIconMap.set(w.name, w.icon)
        }
        const phantom2 =
          window.phantom?.solana ??
          (window.solana?.isPhantom ? window.solana : null)
        if (phantom2 && !prevNames.has('Phantom')) {
          toAdd.push({
            name: 'Phantom',
            icon: latestIconMap.get('Phantom') ?? PHANTOM_ICON_FALLBACK,
            kind: 'injected',
            provider: phantom2,
          })
        }
        if (window.solflare && !prevNames.has('Solflare')) {
          toAdd.push({
            name: 'Solflare',
            icon: latestIconMap.get('Solflare') ?? SOLFLARE_ICON_FALLBACK,
            kind: 'injected',
            provider: window.solflare,
          })
        }
        // Also update icons for existing entries that had no WS icon yet
        const updated = prev.map((w) =>
          latestIconMap.has(w.name) && !w.icon.startsWith('data:image/png;base64,P')
            ? { ...w, icon: latestIconMap.get(w.name)! }
            : w
        )
        return toAdd.length ? [...updated, ...toAdd] : updated
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

        // Helper: attach disconnect / accountChanged listeners and store cleanup
        const attachListeners = () => {
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
        }

        // Step 1: Already connected? Use existing publicKey (no popup needed)
        if (provider.publicKey) {
          const address = provider.publicKey.toString()
          setConnectedAddress(address)
          setSelectedWallet(wallet)
          attachListeners()
          console.log('[Wallet] Connected (already unlocked):', wallet.name, address)
          return
        }

        // Step 2: Connect with retry.
        // Phantom's MV3 service worker can go dormant. The first connect()
        // attempt may fail with "Receiving end does not exist" because the
        // content script's message can't reach the sleeping SW. Chrome will
        // auto-restart the SW after that failed message, so a second attempt
        // after a short delay succeeds.
        const MAX_RETRIES = 2
        let lastErr: unknown = null
        let connectResult: { publicKey: { toString(): string } } | null = null

        for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
          if (!connectingRef.current) return
          try {
            connectResult = await Promise.race([
              provider.connect(),
              new Promise<never>((_, reject) =>
                setTimeout(
                  () => reject(new Error('Wallet popup timed out — make sure Phantom is open and try again')),
                  attempt === 0 ? 15_000 : 60_000, // shorter first timeout for quick retry
                ),
              ),
            ])
            lastErr = null
            break // success
          } catch (e) {
            lastErr = e
            const msg = e instanceof Error ? e.message : String(e)
            const isSwError =
              msg.includes('Receiving end does not exist') ||
              msg.includes('disconnected port') ||
              msg.includes('timed out')
            if (!isSwError || attempt === MAX_RETRIES - 1) throw e
            console.warn(`[Wallet] Attempt ${attempt + 1} failed (SW dormant?), retrying in 1s…`, msg)
            // Give the SW time to fully restart before retrying
            await new Promise((r) => setTimeout(r, 1_000))
          }
        }
        if (lastErr) throw lastErr
        if (!connectingRef.current) return

        const address = connectResult?.publicKey?.toString?.()
        if (!address) throw new Error('No public key returned — wallet may be locked')

        setConnectedAddress(address)
        setSelectedWallet(wallet)
        attachListeners()
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
      const code = (err as { code?: number })?.code
      const message =
        code === 4001
          ? 'Connection rejected — please approve in your wallet'
          : code === -32002
          ? 'Wallet request already pending — open your extension to approve'
          : err instanceof Error
          ? err.message
          : 'Connection failed'
      console.error('[Wallet] Connect error:', message, err)
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
