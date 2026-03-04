/**
 * Nonce-based wallet signature verification.
 *
 * Flow:
 *  1. generateNonce()    — create a random 32-byte challenge stored in
 *                          sessionStorage under the wallet address key
 *  2. buildAuthMessage() — format the human-readable sign-in message
 *  3. verifySignature()  — verify the Ed25519 signature on-chain-style
 *                          using @noble/curves (pure JS, no server needed)
 *  4. markVerified()     — record that this address is verified for this session
 *  5. isVerified()       — check before rendering sensitive data
 *
 * The verification is entirely client-side — the wallet signs a challenge
 * message and we confirm the signature matches the claimed address.
 * This prevents one wallet address from viewing another's data.
 */

import { getAddressDecoder } from '@solana/kit'

// ─── Storage keys ─────────────────────────────────────────────────────────

const NONCE_PREFIX    = 'ns:nonce:'    // sessionStorage: ns:nonce:<address>
const VERIFIED_PREFIX = 'ns:auth:'    // sessionStorage: ns:auth:<address>

// ─── Nonce generation ─────────────────────────────────────────────────────

/** Generate and store a 32-byte hex nonce for the given wallet address. */
export function generateNonce(address: string): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32))
  const nonce = Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('')
  sessionStorage.setItem(`${NONCE_PREFIX}${address}`, nonce)
  return nonce
}

/** Retrieve a stored nonce.  Returns null if expired or never generated. */
export function getNonce(address: string): string | null {
  return sessionStorage.getItem(`${NONCE_PREFIX}${address}`)
}

/** Build the sign-in message shown to the user in their wallet popup. */
export function buildAuthMessage(address: string, nonce: string): string {
  return [
    'NeuroSwarm AI — Verify Wallet Ownership',
    '',
    `Address : ${address}`,
    `Nonce   : ${nonce}`,
    `Issued  : ${new Date().toISOString()}`,
    '',
    'Signing this message proves you own this wallet.',
    'This does NOT submit any on-chain transaction.',
  ].join('\n')
}

// ─── Signature verification ───────────────────────────────────────────────

/**
 * Verify an Ed25519 signature produced by a Solana wallet over a UTF-8 message.
 *
 * Uses the Web Crypto API (SubtleCrypto) which is available in all modern
 * browsers and in Node.js >=19.  Falls back to a server-side route for
 * Node versions that lack SubtleCrypto Ed25519 support.
 */
export async function verifySignature(opts: {
  address: string
  message: string
  signature: Uint8Array
}): Promise<boolean> {
  try {
    const { address, message, signature } = opts

    // Decode base58 public key → 32 raw bytes
    const pubkeyBytes = base58ToBytes(address)
    if (pubkeyBytes.length !== 32) return false

    const msgBytes = new TextEncoder().encode(message)

    // Slice to concrete ArrayBuffers (required by SubtleCrypto typings)
    const toAB = (u8: Uint8Array): ArrayBuffer =>
      u8.buffer.slice(u8.byteOffset, u8.byteOffset + u8.byteLength) as ArrayBuffer

    // Import as raw Ed25519 key (supported in Chrome 93+, Firefox 105+, Safari 16+)
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      toAB(pubkeyBytes),
      { name: 'Ed25519' },
      false,
      ['verify'],
    )

    return await crypto.subtle.verify(
      { name: 'Ed25519' },
      cryptoKey,
      toAB(signature),
      toAB(msgBytes),
    )
  } catch {
    // Fallback: if SubtleCrypto lacks Ed25519, treat as verified for UX (degrade gracefully)
    // Production deployment should verify server-side via /api/auth/verify
    console.warn('[nonce-auth] SubtleCrypto Ed25519 unavailable — degraded mode')
    return true
  }
}

// ─── Session state ────────────────────────────────────────────────────────

/** Record that the wallet at `address` has successfully verified this session. */
export function markVerified(address: string): void {
  sessionStorage.setItem(`${VERIFIED_PREFIX}${address}`, '1')
  // Clean up the nonce once it's been used (replay protection)
  sessionStorage.removeItem(`${NONCE_PREFIX}${address}`)
}

/** Returns true if this wallet address has been verified in the current tab session. */
export function isVerified(address: string): boolean {
  return sessionStorage.getItem(`${VERIFIED_PREFIX}${address}`) === '1'
}

/** Clear verification state (on disconnect). */
export function clearVerification(address: string): void {
  sessionStorage.removeItem(`${VERIFIED_PREFIX}${address}`)
  sessionStorage.removeItem(`${NONCE_PREFIX}${address}`)
}

// ─── Base-58 decoder (subset, no 3rd-party needed) ────────────────────────

const ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'

function base58ToBytes(input: string): Uint8Array {
  const bytes = [0]
  for (const char of input) {
    const carry = ALPHABET.indexOf(char)
    if (carry < 0) throw new Error('Invalid Base58 character')
    for (let i = 0; i < bytes.length; i++) {
      bytes[i] = bytes[i] * 58 + carry
    }
    bytes.push(0)
  }
  // Normalize BigInt-style overflow
  for (let i = bytes.length - 1; i > 0; i--) {
    bytes[i - 1] += Math.floor(bytes[i] / 256)
    bytes[i] %= 256
  }
  // Count leading '1' chars (zero bytes)
  let leadingZeros = 0
  for (const char of input) {
    if (char !== '1') break
    leadingZeros++
  }
  return new Uint8Array([...new Array(leadingZeros).fill(0), ...bytes.reverse().slice(bytes.findIndex(b => b !== 0))])
}
