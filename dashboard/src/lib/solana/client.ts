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

/** Cluster RPC endpoints — use env vars in production.
 * NOTE: api.mainnet-beta.solana.com blocks browser fetch (403).
 * Fallback to Ankr's free public endpoint which allows CORS. */
export const RPC_ENDPOINTS = {
  devnet: 'https://api.devnet.solana.com',
  mainnet: 'https://rpc.ankr.com/solana',
  localnet: 'http://127.0.0.1:8899',
} as const

export const WSS_ENDPOINTS = {
  devnet: 'wss://api.devnet.solana.com',
  mainnet: 'wss://rpc.ankr.com/solana/ws',
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

/** Utility to decode base64 account data returned by the RPC */
function decodeAccountBytes(raw: unknown): Uint8Array {
  if (typeof raw === 'string')
    return Uint8Array.from(atob(raw), (c) => c.charCodeAt(0))
  if (Array.isArray(raw))
    return Uint8Array.from(atob(raw[0] as string), (c) => c.charCodeAt(0))
  return raw as Uint8Array
}

// ─── Agent account ──────────────────────────────────────────────────

export interface AgentData {
  owner: Address
  /** 0=Consensus 1=Analytics 2=Execution 3=RiskManagement 4=Learning */
  agentType: number
  name: string
  reputation: number
  proposalsCreated: number
  votesCast: number
  successfulProposals: number
  registeredAt: number
  lastActive: number
  isActive: boolean
}

/** Fetch and decode a single on-chain Agent account by owner public-key. */
export async function fetchAgentAccount(
  rpc: SolanaRpc,
  ownerAddress: Address,
): Promise<AgentData | null> {
  const agentPda = await deriveAgentPda(ownerAddress)
  const accountInfo = await rpc.getAccountInfo(agentPda, { encoding: 'base64' }).send()
  if (!accountInfo.value) return null

  const bytes = decodeAccountBytes(accountInfo.value.data)
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
  const addressDecoder = getAddressDecoder()
  let offset = 8 // discriminator

  const owner = addressDecoder.decode(bytes.slice(offset, offset + 32)); offset += 32
  const agentType = bytes[offset]; offset += 1
  const nameLen = view.getUint32(offset, true); offset += 4
  const name = new TextDecoder().decode(bytes.slice(offset, offset + nameLen)); offset += nameLen
  const reputation = view.getUint16(offset, true); offset += 2
  const proposalsCreated = view.getUint32(offset, true); offset += 4
  const votesCast = view.getUint32(offset, true); offset += 4
  const successfulProposals = view.getUint32(offset, true); offset += 4
  const registeredAt = Number(view.getBigInt64(offset, true)); offset += 8
  const lastActive = Number(view.getBigInt64(offset, true)); offset += 8
  const isActive = bytes[offset] !== 0

  return { owner, agentType, name, reputation, proposalsCreated, votesCast, successfulProposals, registeredAt, lastActive, isActive }
}

// ─── Proposal account ───────────────────────────────────────────────

export interface ProposalAccountData {
  proposer: Address
  /** 0=Rebalance 1=Trade 2=RiskLimit 3=Strategy 4=Emergency */
  proposalType: number
  description: string
  createdAt: number
  expiresAt: number
  executed: boolean
  executedAt: number
  votesFor: number
  votesAgainst: number
  votesAbstain: number
  totalVoters: number
}

/** Fetch and decode a single on-chain Proposal account by its integer ID. */
export async function fetchProposalAccount(
  rpc: SolanaRpc,
  proposalId: bigint,
): Promise<ProposalAccountData | null> {
  const proposalPda = await deriveProposalPda(proposalId)
  const accountInfo = await rpc.getAccountInfo(proposalPda, { encoding: 'base64' }).send()
  if (!accountInfo.value) return null

  const bytes = decodeAccountBytes(accountInfo.value.data)
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
  const addressDecoder = getAddressDecoder()
  let offset = 8 // discriminator

  const proposer = addressDecoder.decode(bytes.slice(offset, offset + 32)); offset += 32
  const proposalType = bytes[offset]; offset += 1
  // data: Vec<u8>
  const dataLen = view.getUint32(offset, true); offset += 4 + dataLen
  // description: String
  const descLen = view.getUint32(offset, true); offset += 4
  const description = new TextDecoder().decode(bytes.slice(offset, offset + descLen)); offset += descLen
  const createdAt = Number(view.getBigInt64(offset, true)); offset += 8
  const expiresAt = Number(view.getBigInt64(offset, true)); offset += 8
  const executed = bytes[offset] !== 0; offset += 1
  const executedAt = Number(view.getBigInt64(offset, true)); offset += 8
  const votesFor = view.getUint32(offset, true); offset += 4
  const votesAgainst = view.getUint32(offset, true); offset += 4
  const votesAbstain = view.getUint32(offset, true); offset += 4
  offset += 8 + 8 // skip weighted votes
  const totalVoters = bytes[offset]

  return { proposer, proposalType, description, createdAt, expiresAt, executed, executedAt, votesFor, votesAgainst, votesAbstain, totalVoters }
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
  const bytes = decodeAccountBytes(accountInfo.value.data)

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
