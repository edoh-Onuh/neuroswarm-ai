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

  // Discover wallets via Wallet Standard
  useEffect(() => {
    const { get, on } = getWallets()

    // Filter for Solana-compatible wallets
    const solanaWallets = get().filter(isSolanaWallet)
    setWallets(solanaWallets)

    // Listen for new wallets being registered
    const unsubRegister = on('register', (...newWallets) => {
      setWallets((prev) => [
        ...prev,
        ...newWallets.filter(isSolanaWallet),
      ])
    })

    const unsubUnregister = on('unregister', (...removedWallets) => {
      const removedNames = new Set(removedWallets.map((w) => w.name))
      setWallets((prev) => prev.filter((w) => !removedNames.has(w.name)))
    })

    return () => {
      unsubRegister()
      unsubUnregister()
    }
  }, [])

  const connect = useCallback(async (wallet: Wallet) => {
    setIsConnecting(true)
    try {
      const connectFeature = wallet.features['standard:connect'] as any
      if (!connectFeature) {
        throw new Error(`Wallet "${wallet.name}" does not support standard:connect`)
      }

      const result = await connectFeature.connect()
      const accounts = result.accounts ?? wallet.accounts

      if (accounts.length > 0) {
        setSelectedWallet(wallet)
        setConnectedAccount(accounts[0])
      }
    } catch (err) {
      console.error('Wallet connection failed:', err)
      setSelectedWallet(null)
      setConnectedAccount(null)
    } finally {
      setIsConnecting(false)
    }
  }, [])

  const disconnect = useCallback(() => {
    if (selectedWallet) {
      const disconnectFeature = selectedWallet.features['standard:disconnect'] as any
      if (disconnectFeature) {
        disconnectFeature.disconnect().catch(console.error)
      }
    }
    setSelectedWallet(null)
    setConnectedAccount(null)
  }, [selectedWallet])

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
      connect,
      disconnect,
    }),
    [wallets, selectedWallet, connectedAccount, connectedAddress, isConnecting, connect, disconnect],
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
