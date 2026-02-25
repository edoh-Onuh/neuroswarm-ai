/**
 * Wallet Provider — hybrid Wallet Standard + window.phantom fallback
 *
 * Strategy:
 *  1. Primary: Wallet Standard getWallets() — discovers all compliant wallets.
 *  2. Fallback: window.phantom.solana / window.solana — handles timing issues
 *     where Phantom's Wallet Standard registration fires before React hydrates
 *     in Next.js (resulting in getWallets().get() returning []).
 *  3. Retry: re-checks Wallet Standard after 800 ms for late registrations.
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
import type { Address } from '@solana/kit'

// ─── Window types (Phantom legacy API) ───────────────────────────────
declare global {
  interface Window {
    phantom?: {
      solana?: LegacyProvider
    }
    solana?: LegacyProvider
    solflare?: LegacyProvider
  }
}
interface LegacyProvider {
  isPhantom?: boolean
  isSolflare?: boolean
  publicKey?: { toString(): string } | null
  connect(opts?: { onlyIfTrusted?: boolean }): Promise<{ publicKey: { toString(): string } }>
  disconnect(): Promise<void>
  on(event: string, cb: (...args: unknown[]) => void): void
  removeListener(event: string, cb: (...args: unknown[]) => void): void
}

// ─── Synthetic Wallet wrapping a legacy window.* provider ────────────
class LegacyWallet implements Wallet {
  readonly version = '1.0.0' as const
  readonly name: string
  readonly icon: `data:image/${string}` | `https://${string}`
  readonly chains = ['solana:mainnet', 'solana:devnet', 'solana:testnet'] as const
  readonly accounts: WalletAccount[] = []
  readonly features: Record<string, unknown>

  private _provider: LegacyProvider
  private _connectFn: (wallet: LegacyWallet) => Promise<void>
  private _disconnectFn: (wallet: LegacyWallet) => void

  constructor(
    name: string,
    icon: `data:image/${string}` | `https://${string}`,
    provider: LegacyProvider,
    connectFn: (wallet: LegacyWallet) => Promise<void>,
    disconnectFn: (wallet: LegacyWallet) => void,
  ) {
    this.name = name
    this.icon = icon
    this._provider = provider
    this._connectFn = connectFn
    this._disconnectFn = disconnectFn
    this.features = {
      'legacy:connect': {
        connect: () => this._connectFn(this),
      },
      'legacy:disconnect': {
        disconnect: () => this._disconnectFn(this),
      },
    }
  }

  get provider() { return this._provider }
}

// ─── Context types ────────────────────────────────────────────────────

interface WalletContextValue {
  wallets: readonly Wallet[]
  selectedWallet: Wallet | null
  connectedAccount: WalletAccount | null
  connectedAddress: Address | null
  isConnected: boolean
  isConnecting: boolean
  error: string | null
  connect: (wallet: Wallet) => Promise<void>
  cancelConnect: () => void
  disconnect: () => void
}

const WalletContext = createContext<WalletContextValue | null>(null)

// ─── Helpers ──────────────────────────────────────────────────────────

function isSolanaWallet(wallet: Wallet): boolean {
  return (
    'solana:signTransaction' in wallet.features ||
    'solana:signAndSendTransaction' in wallet.features ||
    'standard:connect' in wallet.features
  )
}

const PHANTOM_ICON =
  'https://www.phantom.app/img/phantom-logo.png' as `https://${string}`
const SOLFLARE_ICON =
  'https://solflare.com/assets/logo.svg' as `https://${string}`

// ─── Provider ─────────────────────────────────────────────────────────

export function WalletStandardProvider({ children }: { children: ReactNode }) {
  const [wallets, setWallets] = useState<readonly Wallet[]>([])
  const [selectedWallet, setSelectedWallet] = useState<Wallet | null>(null)
  const [connectedAccount, setConnectedAccount] = useState<WalletAccount | null>(null)
  const [isConnecting, setIsConnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const changeUnsubRef = useRef<(() => void) | null>(null)
  const connectingRef = useRef(false)

  // ── Wallet discovery ──────────────────────────────────────────────
  const buildLegacyWallets = useCallback(
    (
      connectLegacy: (wallet: LegacyWallet) => Promise<void>,
      disconnectLegacy: (wallet: LegacyWallet) => void,
    ): LegacyWallet[] => {
      if (typeof window === 'undefined') return []
      const out: LegacyWallet[] = []
      const phantom = window.phantom?.solana ?? (window.solana?.isPhantom ? window.solana : null)
      if (phantom) {
        out.push(new LegacyWallet('Phantom', PHANTOM_ICON, phantom, connectLegacy, disconnectLegacy))
      }
      if (window.solflare) {
        out.push(new LegacyWallet('Solflare', SOLFLARE_ICON, window.solflare, connectLegacy, disconnectLegacy))
      }
      return out
    },
    [],
  )

  const connectLegacy = useCallback(async (wallet: LegacyWallet) => {
    const provider = wallet.provider
    const result = await Promise.race([
      provider.connect(),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Connection timed out — check your wallet popup')), 30_000),
      ),
    ])
    const address = result.publicKey.toString() as Address
    // Synthesise a WalletAccount
    const account: WalletAccount = {
      address,
      publicKey: new Uint8Array(32), // placeholder; address is the useful field
      chains: ['solana:devnet', 'solana:mainnet'],
      features: ['solana:signAndSendTransaction', 'solana:signTransaction'],
    }
    // Inject into wallet.accounts so the rest of the code can read it
    ;(wallet.accounts as WalletAccount[]).splice(0, wallet.accounts.length, account)
    setSelectedWallet(wallet)
    setConnectedAccount(account)
    // Listen for external disconnects
    const onDisconnect = () => {
      setSelectedWallet(null)
      setConnectedAccount(null)
    }
    provider.on('disconnect', onDisconnect)
    changeUnsubRef.current = () => provider.removeListener('disconnect', onDisconnect)
    console.log('[Wallet] Connected (legacy):', wallet.name, address)
  }, [])

  const disconnectLegacy = useCallback((wallet: LegacyWallet) => {
    wallet.provider.disconnect().catch(console.error)
  }, [])

  useEffect(() => {
    // --- Wallet Standard (primary) ---
    const api = getWallets()

    const dedup = (prev: readonly Wallet[], next: Wallet[]) => {
      const existing = new Set(prev.map((w) => w.name))
      return [...prev, ...next.filter((w) => !existing.has(w.name))]
    }

    const unsubRegister = api.on('register', (...newWallets) => {
      setWallets((prev) => dedup(prev, newWallets.filter(isSolanaWallet)))
    })
    const unsubUnregister = api.on('unregister', (...removed) => {
      const names = new Set(removed.map((w) => w.name))
      setWallets((prev) => prev.filter((w) => !names.has(w.name)))
    })

    const wsWallets = api.get().filter(isSolanaWallet)

    // --- Legacy fallback (window.phantom / window.solana) ---
    const legacyWallets = buildLegacyWallets(connectLegacy, disconnectLegacy)

    // Merge: prefer Wallet Standard entries; only add legacy if no WS entry with same name
    const wsNames = new Set(wsWallets.map((w) => w.name))
    const merged = [
      ...wsWallets,
      ...legacyWallets.filter((w) => !wsNames.has(w.name)),
    ]
    setWallets(merged)

    // Retry once after 800 ms — catches wallets that register slightly after hydration
    const retryTimer = setTimeout(() => {
      setWallets((prev) => {
        const late = api.get().filter(isSolanaWallet)
        const legacy = buildLegacyWallets(connectLegacy, disconnectLegacy)
        const prevNames = new Set(prev.map((w) => w.name))
        const additions = [
          ...late.filter((w) => !prevNames.has(w.name)),
          ...legacy.filter((w) => !prevNames.has(w.name)),
        ]
        return additions.length ? [...prev, ...additions] : prev
      })
    }, 800)

    return () => {
      unsubRegister()
      unsubUnregister()
      clearTimeout(retryTimer)
    }
  }, [buildLegacyWallets, connectLegacy, disconnectLegacy])

  // ── Wallet Standard event subscription ───────────────────────────
  const subscribeToWalletEvents = useCallback((wallet: Wallet) => {
    if (changeUnsubRef.current) {
      changeUnsubRef.current()
      changeUnsubRef.current = null
    }
    const eventsFeature = wallet.features['standard:events'] as
      | { on: (event: string, cb: () => void) => () => void }
      | undefined
    if (eventsFeature?.on) {
      changeUnsubRef.current = eventsFeature.on('change', () => {
        if (wallet.accounts.length > 0) {
          setConnectedAccount(wallet.accounts[0])
        } else {
          setSelectedWallet(null)
          setConnectedAccount(null)
        }
      })
    }
  }, [])

  // ── connect ───────────────────────────────────────────────────────
  const connect = useCallback(async (wallet: Wallet) => {
    setIsConnecting(true)
    connectingRef.current = true
    setError(null)
    try {
      // Legacy wallet (window.phantom / window.solana)?
      if (wallet instanceof LegacyWallet) {
        await connectLegacy(wallet)
        if (!connectingRef.current) return
        return
      }

      // Wallet Standard wallet
      const feature = wallet.features['standard:connect'] as
        | { connect: (input?: { silent?: boolean }) => Promise<{ accounts: readonly WalletAccount[] }> }
        | undefined

      if (!feature?.connect) {
        throw new Error(`Wallet "${wallet.name}" does not support standard:connect`)
      }

      const result = await Promise.race([
        feature.connect(),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Connection timed out — check your wallet popup')), 30_000),
        ),
      ])

      if (!connectingRef.current) return

      const accounts = result?.accounts?.length ? result.accounts : wallet.accounts
      if (accounts.length > 0) {
        setSelectedWallet(wallet)
        setConnectedAccount(accounts[0])
        subscribeToWalletEvents(wallet)
        console.log('[Wallet] Connected (WS):', wallet.name, accounts[0].address)
      } else {
        throw new Error('No accounts returned — connection may have been rejected')
      }
    } catch (err) {
      if (!connectingRef.current) return
      const message = err instanceof Error ? err.message : 'Connection failed'
      console.error('[Wallet] Connection failed:', message)
      setError(message)
      setSelectedWallet(null)
      setConnectedAccount(null)
    } finally {
      connectingRef.current = false
      setIsConnecting(false)
    }
  }, [connectLegacy, subscribeToWalletEvents])

  const cancelConnect = useCallback(() => {
    connectingRef.current = false
    setIsConnecting(false)
    setError(null)
  }, [])

  const disconnect = useCallback(() => {
    if (selectedWallet) {
      if (selectedWallet instanceof LegacyWallet) {
        disconnectLegacy(selectedWallet)
      } else {
        const feature = selectedWallet.features['standard:disconnect'] as
          | { disconnect: () => Promise<void> }
          | undefined
        if (feature?.disconnect) feature.disconnect().catch(console.error)
      }
    }
    if (changeUnsubRef.current) {
      changeUnsubRef.current()
      changeUnsubRef.current = null
    }
    setSelectedWallet(null)
    setConnectedAccount(null)
    setError(null)
  }, [selectedWallet, disconnectLegacy])

  useEffect(() => {
    return () => {
      if (changeUnsubRef.current) changeUnsubRef.current()
    }
  }, [])

  const connectedAddress = useMemo<Address | null>(() => {
    if (!connectedAccount) return null
    return connectedAccount.address as Address
  }, [connectedAccount])

  const value: WalletContextValue = useMemo(
    () => ({
      wallets,
      selectedWallet,
      connectedAccount,
      connectedAddress,
      isConnected: connectedAccount !== null,
      isConnecting,
      error,
      connect,
      cancelConnect,
      disconnect,
    }),
    [wallets, selectedWallet, connectedAccount, connectedAddress, isConnecting, error, connect, cancelConnect, disconnect],
  )

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>
}

// ─── Hook ─────────────────────────────────────────────────────────────

export function useWallet(): WalletContextValue {
  const ctx = useContext(WalletContext)
  if (!ctx) throw new Error('useWallet must be used inside <WalletStandardProvider>')
  return ctx
}
