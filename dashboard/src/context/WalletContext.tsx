/**
 * Wallet Standard Provider — Wallet Standard-first wallet connection
 *
 * Uses the Wallet Standard protocol for wallet discovery and connection.
 * This replaces the legacy @solana/wallet-adapter-react pattern.
 *
 * Wallet Standard automatically discovers all compliant wallets installed
 * in the user's browser (Phantom, Solflare, Backpack, etc.) without
 * needing to list them explicitly.
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
import type {
  Wallet,
  WalletAccount,
} from '@wallet-standard/base'
import type { Address } from '@solana/kit'

// ─── Types ──────────────────────────────────────────────────────────

interface WalletContextValue {
  /** All discovered Wallet Standard wallets */
  wallets: readonly Wallet[]
  /** Currently selected wallet (or null) */
  selectedWallet: Wallet | null
  /** Currently connected account (or null) */
  connectedAccount: WalletAccount | null
  /** Connected address as Kit Address (or null) */
  connectedAddress: Address | null
  /** Whether a wallet is connected */
  isConnected: boolean
  /** Whether we are in the process of connecting */
  isConnecting: boolean
  /** Last connection error message (or null) */
  error: string | null
  /** Connect to a specific wallet */
  connect: (wallet: Wallet) => Promise<void>
  /** Disconnect the current wallet */
  disconnect: () => void
}

const WalletContext = createContext<WalletContextValue | null>(null)

// ─── Helpers ────────────────────────────────────────────────────────

/** Check if wallet supports the Solana signTransaction feature */
function isSolanaWallet(wallet: Wallet): boolean {
  return wallet.features !== undefined && (
    'solana:signTransaction' in wallet.features ||
    'solana:signAndSendTransaction' in wallet.features ||
    'standard:connect' in wallet.features
  )
}

// ─── Provider ───────────────────────────────────────────────────────

export function WalletStandardProvider({ children }: { children: ReactNode }) {
  const [wallets, setWallets] = useState<readonly Wallet[]>([])
  const [selectedWallet, setSelectedWallet] = useState<Wallet | null>(null)
  const [connectedAccount, setConnectedAccount] = useState<WalletAccount | null>(null)
  const [isConnecting, setIsConnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const changeUnsubRef = useRef<(() => void) | null>(null)

  // Discover wallets via Wallet Standard
  useEffect(() => {
    const api = getWallets()

    // Set up listener FIRST to avoid missing registrations
    const unsubRegister = api.on('register', (...newWallets) => {
      setWallets((prev) => [
        ...prev,
        ...newWallets.filter(isSolanaWallet),
      ])
    })

    const unsubUnregister = api.on('unregister', (...removedWallets) => {
      const removedNames = new Set(removedWallets.map((w) => w.name))
      setWallets((prev) => prev.filter((w) => !removedNames.has(w.name)))
    })

    // Then get currently registered wallets
    const solanaWallets = api.get().filter(isSolanaWallet)
    setWallets(solanaWallets)

    return () => {
      unsubRegister()
      unsubUnregister()
    }
  }, [])

  // Subscribe to wallet account changes (e.g. user switches account in wallet)
  const subscribeToWalletEvents = useCallback((wallet: Wallet) => {
    // Unsubscribe from previous wallet events
    if (changeUnsubRef.current) {
      changeUnsubRef.current()
      changeUnsubRef.current = null
    }

    const eventsFeature = wallet.features['standard:events'] as
      | { on: (event: string, cb: () => void) => () => void }
      | undefined

    if (eventsFeature?.on) {
      changeUnsubRef.current = eventsFeature.on('change', () => {
        // Wallet may have updated its accounts
        if (wallet.accounts.length > 0) {
          setConnectedAccount(wallet.accounts[0])
        } else {
          // Wallet disconnected externally
          setSelectedWallet(null)
          setConnectedAccount(null)
        }
      })
    }
  }, [])

  const connect = useCallback(async (wallet: Wallet) => {
    setIsConnecting(true)
    setError(null)
    try {
      const feature = wallet.features['standard:connect'] as
        | { connect: (input?: { silent?: boolean }) => Promise<{ accounts: readonly WalletAccount[] }> }
        | undefined

      if (!feature?.connect) {
        throw new Error(`Wallet "${wallet.name}" does not support standard:connect`)
      }

      const result = await feature.connect()

      // Some wallets return accounts in result, others update wallet.accounts
      const accounts = (result?.accounts?.length ? result.accounts : wallet.accounts)

      if (accounts.length > 0) {
        setSelectedWallet(wallet)
        setConnectedAccount(accounts[0])
        subscribeToWalletEvents(wallet)
        console.log('[Wallet] Connected:', wallet.name, accounts[0].address)
      } else {
        throw new Error('No accounts returned — connection may have been rejected')
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Connection failed'
      console.error('[Wallet] Connection failed:', message)
      setError(message)
      setSelectedWallet(null)
      setConnectedAccount(null)
    } finally {
      setIsConnecting(false)
    }
  }, [subscribeToWalletEvents])

  const disconnect = useCallback(() => {
    if (selectedWallet) {
      const feature = selectedWallet.features['standard:disconnect'] as
        | { disconnect: () => Promise<void> }
        | undefined
      if (feature?.disconnect) {
        feature.disconnect().catch(console.error)
      }
    }
    // Clean up event subscription
    if (changeUnsubRef.current) {
      changeUnsubRef.current()
      changeUnsubRef.current = null
    }
    setSelectedWallet(null)
    setConnectedAccount(null)
    setError(null)
    console.log('[Wallet] Disconnected')
  }, [selectedWallet])

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (changeUnsubRef.current) {
        changeUnsubRef.current()
      }
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
      disconnect,
    }),
    [wallets, selectedWallet, connectedAccount, connectedAddress, isConnecting, error, connect, disconnect],
  )

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  )
}

// ─── Hook ───────────────────────────────────────────────────────────

export function useWallet(): WalletContextValue {
  const ctx = useContext(WalletContext)
  if (!ctx) {
    throw new Error('useWallet must be used inside <WalletStandardProvider>')
  }
  return ctx
}
