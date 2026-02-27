/**
 * Solana RPC Context — @solana/kit-first RPC provider
 *
 * Provides a Kit Rpc client and cluster configuration to the entire app.
 * Uses environment variables for endpoint configuration.
 */

'use client'

import {
  createContext,
  useContext,
  useMemo,
  type ReactNode,
} from 'react'
import {
  createRpc,
  createRpcSubscriptions,
  type Cluster,
  type SolanaRpc,
  type SolanaRpcSubscriptions,
  RPC_ENDPOINTS,
  WSS_ENDPOINTS,
} from '@/lib/solana/client'

interface SolanaContextValue {
  /** Kit-native RPC client */
  rpc: SolanaRpc
  /** Kit-native RPC subscription client */
  rpcSubscriptions: SolanaRpcSubscriptions
  /** Active cluster */
  cluster: Cluster
  /** HTTP RPC URL */
  rpcUrl: string
  /** WebSocket RPC URL */
  wssUrl: string
}

const SolanaContext = createContext<SolanaContextValue | null>(null)

interface SolanaProviderProps {
  children: ReactNode
  cluster?: Cluster
}

export function SolanaProvider({
  children,
  cluster = 'devnet',
}: SolanaProviderProps) {
  const rpcUrl = process.env.NEXT_PUBLIC_SOLANA_RPC_URL ?? process.env.NEXT_PUBLIC_RPC_URL ?? RPC_ENDPOINTS[cluster]
  const wssUrl = process.env.NEXT_PUBLIC_WSS_URL ?? WSS_ENDPOINTS[cluster]

  const rpc = useMemo(() => createRpc(cluster), [cluster])
  const rpcSubscriptions = useMemo(
    () => createRpcSubscriptions(cluster),
    [cluster],
  )

  const value: SolanaContextValue = useMemo(
    () => ({ rpc, rpcSubscriptions, cluster, rpcUrl, wssUrl }),
    [rpc, rpcSubscriptions, cluster, rpcUrl, wssUrl],
  )

  return (
    <SolanaContext.Provider value={value}>
      {children}
    </SolanaContext.Provider>
  )
}

export function useSolana(): SolanaContextValue {
  const ctx = useContext(SolanaContext)
  if (!ctx) {
    throw new Error('useSolana must be used inside <SolanaProvider>')
  }
  return ctx
}
