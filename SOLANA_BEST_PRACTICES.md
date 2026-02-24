# Solana Foundation Best Practices — Compliance Guide

> NeuroSwarm AI alignment with the **Solana Foundation AI Agent Coding Best Practices** (Jan 2026).

---

## Stack Alignment Summary

| Best Practice Requirement | NeuroSwarm AI Status | Details |
|--------------------------|---------------------|---------|
| **UI: framework-kit first** | **Compliant** | Dashboard uses `@solana/kit` + Kit-native RPC via `SolanaContext` |
| **Wallet: Wallet Standard** | **Compliant** | `WalletStandardProvider` discovers wallets via `@wallet-standard/app` |
| **SDK: @solana/kit first** | **Compliant** | Kit `Address`, `Rpc`, `getProgramDerivedAddress` used throughout |
| **Legacy: web3.js at boundaries** | **Compliant** | `web3-compat-adapter.ts` isolates all web3.js interop |
| **Programs: Anchor** | **Compliant** | Anchor 0.29.0 with proper IDL generation |
| **Testing: LiteSVM/Mollusk** | **Compliant** | LiteSVM + Mollusk in `programs/agent_swarm/tests/` |
| **Testing: Surfpool** | **Compliant** | `surfpool.toml` configured for integration tests |
| **Codama client generation** | **Configured** | `codama.config.mjs` generates typed TS clients from IDL |
| **Cluster/RPC config** | **Compliant** | Env-var driven, no hardcoded endpoints in app code |
| **Security: no floats on-chain** | **Fixed** | Integer math for quorum/majority checks |
| **Security: bounds checks** | **Fixed** | Voter vector bounded at 20 with runtime check |
| **Security: no runtime unwrap** | **Fixed** | `solana_program::pubkey!()` compile-time constants |

---

## Architecture by Layer

### 1. UI/Wallet/Hook Layer (Dashboard)

**Location:** `dashboard/`

**Stack:**
- `@solana/kit` — Kit-native RPC client, Address type, PDA derivation
- `@solana/react` — React hooks for Kit (if using react-hooks)
- `@wallet-standard/app` — Wallet Standard discovery
- `@solana/web3.js` — ONLY in `dashboard/src/lib/solana/web3-compat-adapter.ts`

**Key files:**
- `dashboard/src/lib/solana/client.ts` — Kit RPC factory, PDA derivation, account fetching
- `dashboard/src/lib/solana/web3-compat-adapter.ts` — Legacy web3.js boundary adapter
- `dashboard/src/context/SolanaContext.tsx` — Kit Rpc provider for React tree
- `dashboard/src/context/WalletContext.tsx` — Wallet Standard provider & `useWallet()` hook
- `dashboard/src/components/WalletButton.tsx` — Wallet Standard connect/disconnect UI

**Rules:**
- NEVER import `@solana/web3.js` directly in components or pages
- All Solana types flow through Kit (`Address`, not `PublicKey`)
- RPC endpoints come from `NEXT_PUBLIC_RPC_URL` env var

### 2. Client SDK/Scripts Layer (Python)

**Location:** `agents/`, `scripts/`, `sdk/`, `integrations/`

**Stack:**
- `solana` (Python) + `solders` + `anchorpy` for on-chain interaction
- `aiohttp` for Jupiter API calls

**Best practice alignment:**
- Keypairs loaded from env-var paths (not hardcoded)
- RPC endpoints configurable via env vars
- AnchorPy uses IDL for type-safe instruction building
- Manual instruction builders (`simple_init.py`, `register_agents.py`) use computed discriminators

### 3. Program Layer (Rust/Anchor)

**Location:** `programs/agent_swarm/`

**Stack:**
- Anchor 0.29.0 (default per best practices — fast iteration, IDL generation)
- `solana-program` for `pubkey!()` macro

**Security hardening applied:**
- **No floating-point arithmetic** — integer math for quorum checks
- **Bounded voter vector** — `MAX_VOTERS = 20` enforced at runtime
- **Compile-time pubkeys** — `solana_program::pubkey!()` instead of `Pubkey::from_str().unwrap()`
- **Consistent program ID** — `Anchor.toml` and `declare_id!()` synchronized

### 4. Testing Layer

**Location:** `programs/agent_swarm/tests/`, `tests/`

| Test Type | Tool | Purpose | Config |
|-----------|------|---------|--------|
| Rust unit tests | **LiteSVM** | Fast in-process SVM | `programs/agent_swarm/tests/litesvm_tests.rs` |
| Instruction fuzzing | **Mollusk** | Per-instruction validation | Same file |
| Integration tests | **Surfpool** | Realistic cluster state | `surfpool.toml` |
| Anchor TS tests | `anchor test` | End-to-end flow tests | `tests/anchor_tests.ts` |
| Python agent tests | `pytest` | Agent logic + Jupiter client | `tests/test_integrations.py` |

### 5. Client Generation

**Tool:** Codama

**Config:** `codama.config.mjs`

**Workflow:**
```bash
# 1. Build program and generate IDL
anchor build

# 2. Generate typed TypeScript client
npx @codama/cli generate --config codama.config.mjs

# Output: sdk/typescript/generated/
```

---

## Commands Reference

```bash
# ─── Program ────────────────────────────────
anchor build                          # Build program + generate IDL
anchor deploy                         # Deploy to configured cluster
anchor keys sync                      # Sync program ID across Anchor.toml & lib.rs

# ─── Testing ────────────────────────────────
cargo test -p agent_swarm             # Run LiteSVM/Mollusk Rust tests
anchor test                           # Run Anchor TS integration tests
surfpool start --config surfpool.toml # Start Surfpool for integration tests
pytest tests/                         # Run Python agent tests

# ─── Client Generation ─────────────────────
npx @codama/cli generate --config codama.config.mjs

# ─── Dashboard ──────────────────────────────
cd dashboard && npm install && npm run dev
```

---

## Risk Notes

### Signing/Fees
- Python agents use file-based keypairs — ensure `keys/` directory has restricted permissions
- Jupiter swap slippage defaults to 50bps — consider adding a configurable max cap
- Fee payer is always the agent keypair owner — no fee delegation

### CPIs/Token Transfers
- `cpi.rs` DEX swap functions are framework stubs (log-only) — do NOT use in production without implementation
- SPL Token `transfer_tokens()` CPI is functional but only for SPL Token (not Token-2022)
- Marketplace instructions are defined but not wired into `#[program]` — dead code

### Compute Budget
- No explicit compute budget / priority fee instructions are added to transactions
- For mainnet, add `ComputeBudgetProgram.setComputeUnitLimit()` and `setComputeUnitPrice()`

### Account Owners
- SwarmState authority is the initializer's pubkey — ensure this is a secure multisig in production
- Agent PDAs are per-owner — one agent per wallet address
