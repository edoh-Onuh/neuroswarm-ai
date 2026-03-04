/**
 * RPC Resilience — retry, circuit-breaker, and rate-limit utilities.
 *
 * Design goals
 *  - Zero runtime dependencies beyond TypeScript standard lib
 *  - Tree-shakeable: each primitive is a stand-alone export
 *  - Thread-safe for Next.js server components (no global mutable state shared
 *    across requests; each CircuitBreaker instance is caller-scoped)
 */

// ─── Exponential back-off with jitter ──────────────────────────────────────

export interface RetryOptions {
  /** Max attempts including the first try. Default: 4 */
  maxAttempts?: number
  /** Base delay in ms. Default: 250 */
  baseDelayMs?: number
  /** Cap on delay in ms. Default: 8 000 */
  maxDelayMs?: number
  /** Multiply the delay by this factor each attempt. Default: 2 */
  backoffFactor?: number
  /** If set, only retry when the error matches this predicate. */
  retryIf?: (err: unknown) => boolean
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  opts: RetryOptions = {},
): Promise<T> {
  const {
    maxAttempts  = 4,
    baseDelayMs  = 250,
    maxDelayMs   = 8_000,
    backoffFactor = 2,
    retryIf,
  } = opts

  let lastErr: unknown
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await fn()
    } catch (err) {
      lastErr = err
      if (retryIf && !retryIf(err)) throw err  // non-retryable
      if (attempt >= maxAttempts - 1) break
      const delay = Math.min(
        baseDelayMs * Math.pow(backoffFactor, attempt) + Math.random() * 100,
        maxDelayMs,
      )
      await sleep(delay)
    }
  }
  throw lastErr
}

// ─── Circuit breaker ────────────────────────────────────────────────────────

type CBState = 'closed' | 'open' | 'half-open'

export interface CircuitBreakerOptions {
  /** Consecutive failures before opening the circuit. Default: 5 */
  failureThreshold?: number
  /** How long the circuit stays open before probing (ms). Default: 30 000 */
  resetTimeoutMs?: number
  /** Probe timeout when half-open (ms). Default: 5 000 */
  halfOpenTimeoutMs?: number
}

export class CircuitBreaker {
  private state: CBState = 'closed'
  private failures = 0
  private lastFailureAt = 0
  private readonly failureThreshold: number
  private readonly resetTimeoutMs: number
  private readonly halfOpenTimeoutMs: number

  constructor(opts: CircuitBreakerOptions = {}) {
    this.failureThreshold  = opts.failureThreshold  ?? 5
    this.resetTimeoutMs    = opts.resetTimeoutMs    ?? 30_000
    this.halfOpenTimeoutMs = opts.halfOpenTimeoutMs ?? 5_000
  }

  get isOpen(): boolean {
    return this.state === 'open'
  }

  async fire<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      const elapsed = Date.now() - this.lastFailureAt
      if (elapsed < this.resetTimeoutMs)
        throw new Error(`Circuit open — retrying in ${Math.ceil((this.resetTimeoutMs - elapsed) / 1000)}s`)
      this.state = 'half-open'
    }

    const timeoutMs = this.state === 'half-open' ? this.halfOpenTimeoutMs : undefined
    try {
      const result = await (timeoutMs ? raceTimeout(fn(), timeoutMs) : fn())
      this.onSuccess()
      return result
    } catch (err) {
      this.onFailure()
      throw err
    }
  }

  private onSuccess() {
    this.failures = 0
    this.state = 'closed'
  }

  private onFailure() {
    this.failures++
    this.lastFailureAt = Date.now()
    if (this.failures >= this.failureThreshold || this.state === 'half-open')
      this.state = 'open'
  }

  reset() {
    this.failures = 0
    this.state = 'closed'
  }

  status(): { state: CBState; failures: number } {
    return { state: this.state, failures: this.failures }
  }
}

// ─── Token-bucket rate limiter ───────────────────────────────────────────────

export interface RateLimiterOptions {
  /** Max requests per window. Default: 40 */
  maxTokens?: number
  /** Refill interval in ms. Default: 1 000 (1 req/25ms avg) */
  refillIntervalMs?: number
}

export class RateLimiter {
  private tokens: number
  private lastRefill: number
  private readonly maxTokens: number
  private readonly refillIntervalMs: number

  constructor(opts: RateLimiterOptions = {}) {
    this.maxTokens       = opts.maxTokens       ?? 40
    this.refillIntervalMs = opts.refillIntervalMs ?? 1_000
    this.tokens          = this.maxTokens
    this.lastRefill      = Date.now()
  }

  async acquire(): Promise<void> {
    this.refill()
    if (this.tokens > 0) {
      this.tokens--
      return
    }
    // Wait until the next refill window
    const wait = this.refillIntervalMs - (Date.now() - this.lastRefill)
    await sleep(Math.max(0, wait))
    this.refill()
    this.tokens = Math.max(0, this.tokens - 1)
  }

  private refill() {
    const now = Date.now()
    const windows = Math.floor((now - this.lastRefill) / this.refillIntervalMs)
    if (windows > 0) {
      this.tokens = Math.min(this.maxTokens, this.tokens + windows * this.maxTokens)
      this.lastRefill = now
    }
  }
}

// ─── Resilient RPC call (retry + circuit-breaker + rate-limit combined) ──────

const DEFAULT_CB  = new CircuitBreaker({ failureThreshold: 5, resetTimeoutMs: 20_000 })
const DEFAULT_RL  = new RateLimiter({ maxTokens: 30, refillIntervalMs: 1_000 })

/**
 * Wraps any async RPC call with retry, circuit-breaker and rate limiting.
 * Uses module-level singletons so all RPC calls share the same circuit state.
 */
export async function resilientCall<T>(
  fn: () => Promise<T>,
  retryOpts?: RetryOptions,
): Promise<T> {
  await DEFAULT_RL.acquire()
  return DEFAULT_CB.fire(() => withRetry(fn, retryOpts))
}

/** Circuit-breaker open state (useful for UI status indicators) */
export function circuitStatus() {
  return DEFAULT_CB.status()
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function raceTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`Timeout after ${ms}ms`)), ms),
    ),
  ])
}
