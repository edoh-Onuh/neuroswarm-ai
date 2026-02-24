/**
 * web3-compat Adapter Boundary
 * 
 * All legacy @solana/web3.js interop is isolated here.
 * NO web3.js types should leak beyond this module.
 * Consumers import Kit-native types (Address, Rpc, etc.) from @solana/kit.
 * 
 * This module converts between:
 *   - Kit Address <-> web3.js PublicKey
 *   - Kit Rpc <-> web3.js Connection
 *   - Kit TransactionMessage <-> web3.js Transaction
 * 
 * @see https://solana.com/docs  (framework-kit migration guide)
 */

import { PublicKey, Connection } from '@solana/web3.js'
import type { Address } from '@solana/kit'

// ─── Address conversions ────────────────────────────────────────────

/** Convert a Kit Address string to a legacy web3.js PublicKey */
export function addressToPublicKey(address: Address): PublicKey {
  return new PublicKey(address as string)
}

/** Convert a legacy web3.js PublicKey to a Kit Address string */
export function publicKeyToAddress(pubkey: PublicKey): Address {
  return pubkey.toBase58() as Address
}

// ─── Connection factory ─────────────────────────────────────────────

/** 
 * Create a legacy web3.js Connection for libraries that require it.
 * Prefer @solana/kit createSolanaRpc() for all new code.
 */
export function createLegacyConnection(
  rpcUrl: string,
  commitment: 'processed' | 'confirmed' | 'finalized' = 'confirmed',
): Connection {
  return new Connection(rpcUrl, commitment)
}

// ─── PDA derivation (legacy fallback) ───────────────────────────────

/**
 * Derive a PDA using legacy web3.js (for when Kit's getProgramDerivedAddress
 * is not available in your context). Returns Kit Address.
 */
export function findProgramAddressLegacy(
  seeds: (Uint8Array | Buffer)[],
  programId: Address,
): { address: Address; bump: number } {
  const pk = new PublicKey(programId as string)
  const [pda, bump] = PublicKey.findProgramAddressSync(seeds, pk)
  return {
    address: pda.toBase58() as Address,
    bump,
  }
}
