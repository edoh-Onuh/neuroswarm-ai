/**
 * Solana integration barrel export
 *
 * Import Solana utilities from '@/lib/solana' — never from @solana/web3.js directly.
 */

// Kit-native client, RPC, PDAs, account fetching
export {
  PROGRAM_ID,
  RPC_ENDPOINTS,
  WSS_ENDPOINTS,
  createRpc,
  createRpcSubscriptions,
  deriveSwarmPda,
  deriveAgentPda,
  deriveProposalPda,
  fetchSwarmState,
  type Cluster,
  type SwarmStateData,
} from './client'

// Legacy web3.js adapter (ONLY use when a dependency requires web3.js types)
export {
  addressToPublicKey,
  publicKeyToAddress,
  createLegacyConnection,
  findProgramAddressLegacy,
} from './web3-compat-adapter'
