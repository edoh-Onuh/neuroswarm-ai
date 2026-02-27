/**
 * Solana Kit Client — framework-kit-first RPC & account access
 *
 * This is the primary Solana integration module. All new code should import
 * from here rather than directly from @solana/web3.js.
 *
 * Uses:
 *   - @solana/kit for RPC, Address, transaction building, codecs
 *   - Wallet Standard for wallet discovery & signing
 *   - web3-compat-adapter.ts ONLY when a legacy library requires web3.js types
 */

import {
  createSolanaRpc,
  createSolanaRpcSubscriptions,
  address,
  getAddressEncoder,
  getAddressDecoder,
  getProgramDerivedAddress,
  type Address,
} from '@solana/kit'

// ─── Constants ──────────────────────────────────────────────────────

export const PROGRAM_ID: Address = address(
  '56Vy8e8V4E6UZnsa6uDRg8HFiPwroz6nRKh7rm9xAfeK'
)

/** Cluster RPC endpoints — use env vars in production */
export const RPC_ENDPOINTS = {
  devnet: 'https://api.devnet.solana.com',
  mainnet: 'https://api.mainnet-beta.solana.com',
  localnet: 'http://127.0.0.1:8899',
} as const

export const WSS_ENDPOINTS = {
  devnet: 'wss://api.devnet.solana.com',
  mainnet: 'wss://api.mainnet-beta.solana.com',
  localnet: 'ws://127.0.0.1:8900',
} as const

export type Cluster = keyof typeof RPC_ENDPOINTS

// ─── RPC Client factory ─────────────────────────────────────────────

/** Return type of createSolanaRpc — fully typed Solana RPC client */
export type SolanaRpc = ReturnType<typeof createSolanaRpc>
/** Return type of createSolanaRpcSubscriptions */
export type SolanaRpcSubscriptions = ReturnType<typeof createSolanaRpcSubscriptions>

export function createRpc(cluster: Cluster = 'devnet'): SolanaRpc {
  const url = process.env.NEXT_PUBLIC_SOLANA_RPC_URL ?? process.env.NEXT_PUBLIC_RPC_URL ?? RPC_ENDPOINTS[cluster]
  return createSolanaRpc(url)
}

export function createRpcSubscriptions(
  cluster: Cluster = 'devnet',
): SolanaRpcSubscriptions {
  const url = process.env.NEXT_PUBLIC_WSS_URL ?? WSS_ENDPOINTS[cluster]
  return createSolanaRpcSubscriptions(url)
}

// ─── PDA derivation (Kit-native) ────────────────────────────────────

const textEncoder = new TextEncoder()

export async function deriveSwarmPda(): Promise<Address> {
  const [pda] = await getProgramDerivedAddress({
    programAddress: PROGRAM_ID,
    seeds: [textEncoder.encode('swarm')],
  })
  return pda
}

export async function deriveAgentPda(ownerAddress: Address): Promise<Address> {
  const addressEncoder = getAddressEncoder()
  const [pda] = await getProgramDerivedAddress({
    programAddress: PROGRAM_ID,
    seeds: [textEncoder.encode('agent'), addressEncoder.encode(ownerAddress)],
  })
  return pda
}

export async function deriveProposalPda(proposalId: bigint): Promise<Address> {
  const buf = new ArrayBuffer(8)
  const view = new DataView(buf)
  view.setBigUint64(0, proposalId, true) // little-endian
  const [pda] = await getProgramDerivedAddress({
    programAddress: PROGRAM_ID,
    seeds: [textEncoder.encode('proposal'), new Uint8Array(buf)],
  })
  return pda
}

// ─── Account fetching ───────────────────────────────────────────────

export interface SwarmStateData {
  authority: Address
  maxAgents: number
  activeAgents: number
  minVotesRequired: number
  proposalTimeout: bigint
  totalProposals: bigint
  executedProposals: bigint
}

/**
 * Fetch and decode the on-chain SwarmState account.
 * Returns null if the account does not exist.
 */
export async function fetchSwarmState(
  rpc: SolanaRpc,
): Promise<SwarmStateData | null> {
  const swarmPda = await deriveSwarmPda()

  const accountInfo = await rpc
    .getAccountInfo(swarmPda, { encoding: 'base64' })
    .send()

  if (!accountInfo.value) return null

  // Decode the Anchor account (skip 8-byte discriminator)
  const raw = accountInfo.value.data
  const bytes = typeof raw === 'string'
    ? Uint8Array.from(atob(raw), (c) => c.charCodeAt(0))
    : Array.isArray(raw)
      ? Uint8Array.from(atob(raw[0] as string), (c) => c.charCodeAt(0))
      : raw as Uint8Array

  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
  const offset = 8 // Anchor discriminator

  const addressDecoder = getAddressDecoder()

  return {
    authority: addressDecoder.decode(bytes.slice(offset, offset + 32)),
    maxAgents: bytes[offset + 32],
    activeAgents: bytes[offset + 33],
    minVotesRequired: bytes[offset + 34],
    proposalTimeout: view.getBigInt64(offset + 35, true),
    totalProposals: view.getBigUint64(offset + 43, true),
    executedProposals: view.getBigUint64(offset + 51, true),
  }
}
