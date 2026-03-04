# NeuroSwarm AI

> Multi-agent coordination protocol on Solana. Specialized AI agents reach consensus, propose strategies, and execute actions on-chain -- fully autonomous, live-data-driven, and production-hardened.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**Program ID:** `56Vy8e8V4E6UZnsa6uDRg8HFiPwroz6nRKh7rm9xAfeK` (devnet)

---

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [On-Chain Program](#on-chain-program)
- [Agent Framework](#agent-framework)
- [Dashboard](#dashboard)
- [Real-Time Infrastructure](#real-time-infrastructure)
- [Security](#security)
- [SDK and Integrations](#sdk-and-integrations)
- [Installation](#installation)
- [Running](#running)
- [Testing](#testing)
- [Project Structure](#project-structure)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [License](#license)

---

## Overview

NeuroSwarm AI is a multi-agent swarm intelligence protocol built on Solana. It coordinates specialized AI agents through on-chain consensus -- agents register, propose actions, vote with Byzantine fault tolerance, execute approved strategies, and learn from outcomes.

The reference implementation is an autonomous DeFi portfolio manager where agents analyze markets, propose rebalancing strategies, vote on them, execute trades via Solana DEXes, and adapt over time. The dashboard displays 100% live data from on-chain accounts and public market APIs -- zero mock data.

Key properties:

- **Live on-chain data** -- every dashboard panel reads from Solana RPC and public APIs (CoinGecko, Fear & Greed Index, DexScreener)
- **Real-time updates** -- WebSocket subscription on the SwarmState PDA triggers instant UI refresh on any on-chain change
- **Resilient networking** -- circuit breaker, exponential-backoff retry, and token-bucket rate limiting wrap every RPC call
- **Offline-capable** -- IndexedDB cache persists swarm state across page reloads; in-memory fallback for private browsing
- **Byzantine fault tolerant** -- correct operation with up to 1/3 malicious agents
- **Wallet-verified** -- Ed25519 nonce-based signature verification proves wallet ownership before showing portfolio data
- **AI-assisted governance** -- LLM proxy drafts proposal text and analyses risk; works with OpenAI, Groq, Ollama, or any OpenAI-compatible API
- **Quadratic voting** -- governance panel shows both linear and quadratic vote weights side-by-side
- **Autonomous** -- no human intervention after initialization
- **Extensible** -- custom agent types, pluggable strategies, SDK for building new swarms

---

## Architecture

```
+-------------------------------+      +---------------------+      +---------------------+
|   Dashboard (Next.js 14)      |      |  Agent Framework    |      | On-Chain Program    |
|                               | <--> |  (Python)           | <--> | (Anchor / Rust)     |
|   @solana/kit RPC + WSS       |      |  9 specialized      |      | Agent registry      |
|   Wallet Standard             |      |  agents             |      | Proposal system     |
|   Circuit breaker + retry     |      |                     |      | BFT consensus       |
|   IndexedDB offline cache     |      |                     |      | Reputation tracking |
|   Ed25519 nonce auth          |      |                     |      |                     |
|   LLM proposal drafting       |      |                     |      |                     |
|   P&L history (IndexedDB)     |      |                     |      |                     |
+-------------------------------+      +---------------------+      +---------------------+
         |
         | WebSocket (accountNotifications)
         v
    Real-time on-chain updates
```

Three layers:

1. **Program layer** -- Anchor 0.29.0 Rust program deployed on Solana devnet. Manages agent registration, proposal lifecycle, BFT voting, execution, reputation, and outcome recording.
2. **Agent layer** -- Python framework with 9 specialized agents (consensus, analytics, risk, learning, sentiment, arbitrage, custom builder, marketplace, enhanced learning). Each agent runs autonomously and interacts with the on-chain program.
3. **Dashboard layer** -- Next.js 14 application using `@solana/kit` for RPC and WebSocket subscriptions, Wallet Standard for wallet connections, IndexedDB for offline persistence, and a resilient networking stack (circuit breaker + retry + rate limiter). All data is live -- sourced from on-chain accounts, CoinGecko, Fear & Greed Index, and DexScreener.

---

## Tech Stack

| Layer | Technology | Notes |
|-------|-----------|-------|
| On-chain program | Anchor 0.29.0, solana-program 1.18 | Rust, deployed to devnet |
| Agent framework | Python 3.11+ | solana-py, solders, anchorpy, aiohttp |
| Dashboard | Next.js 14, React 18, TypeScript 5 | Tailwind CSS, Recharts |
| Solana SDK (dashboard) | @solana/kit 2.1.0 | Kit-native RPC + WSS, Address, PDA derivation |
| Wallet connection | @wallet-standard/app 1.1.0 | Wallet Standard discovery, Phantom-first |
| Legacy boundary | @solana/web3.js 1.87 | Isolated in `web3-compat-adapter.ts` only |
| RPC resilience | Custom (zero-dep) | Circuit breaker (5 fail / 20s reset), retry (4x exp backoff), rate limiter (30 req/s) |
| Offline cache | IndexedDB + in-memory fallback | 60s TTL, auto-hydration on mount |
| Wallet auth | Ed25519 nonce signatures | SubtleCrypto verification, replay-safe |
| AI drafting | OpenAI / Groq / Ollama | LLM proxy API route, 10 req/min rate limit |
| P&L history | IndexedDB time-series | Sharpe ratio, max drawdown, 1440-snapshot rolling window |
| Client generation | Codama | Typed TS clients from Anchor IDL |
| Rust unit tests | LiteSVM 0.3, Mollusk SVM 0.0.10 | Fast in-process tests |
| Integration tests | Surfpool | Mirrors devnet state locally |
| Governance | Coalition voting (5 methods) | Quadratic + reputation-weighted |
| DEX integration | Jupiter V6 API, CPI stubs for Raydium/Orca | |
| Security headers | CSP, HSTS, X-Frame-Options, Referrer-Policy, Permissions-Policy | |

---

## On-Chain Program

Location: `programs/agent_swarm/`

The Anchor program exposes these instructions:

| Instruction | Description |
|-------------|-------------|
| `initialize` | Create the swarm with max agents, quorum threshold, and proposal timeout |
| `register_agent` | Register a new agent (Consensus, Analytics, Execution, RiskManagement, Learning, Governance, Security, Liquidity, Arbitrage, or Custom) |
| `create_proposal` | Submit a proposal (Rebalance, Trade, RiskLimit, Strategy, Emergency) |
| `vote_proposal` | Cast a vote (Approve, Reject, Abstain) with reasoning |
| `execute_proposal` | Execute an approved proposal |
| `update_reputation` | Update an agent's reputation score |
| `record_outcome` | Record execution results for learning |

Security hardening:

- No floating-point arithmetic on-chain -- integer math for quorum and majority checks
- Bounded voter vector (MAX_VOTERS = 20) with runtime enforcement
- Compile-time program ID constants via `solana_program::pubkey!()` macro
- Consistent program ID across `Anchor.toml` and `declare_id!()`

---

## Agent Framework

Location: `agents/`

Nine specialized agents, all extending `BaseAgent`:

| Agent | File | Role |
|-------|------|------|
| Consensus | `consensus_agent.py` | Coordinates voting, resolves conflicts, enforces BFT |
| Analytics | `analytics_agent.py` | Analyzes on-chain data, DEX metrics, market trends |
| Risk Management | `risk_agent.py` | Monitors risk, enforces position limits, vetoes high-risk proposals |
| Learning | `learning_agent.py` | Reinforcement learning (Q-learning) with strategy adaptation |
| Enhanced Learning | `enhanced_learning_agent.py` | Extended learning with SQLite persistence |
| Sentiment | `sentiment_agent.py` | Multi-source sentiment analysis (Twitter, Reddit, news, on-chain) |
| Arbitrage | `arbitrage_agent.py` | Cross-DEX arbitrage detection across Raydium, Orca, Jupiter, Lifinity, Meteora |
| Custom Builder | `custom_agent_builder.py` | Template-based agent team creation (5 templates) |
| Marketplace | `agent_marketplace.py` | Agent listing, ratings, leaderboards, rent marketplace |

Supporting modules:

- `governance/coalition.py` -- Coalition voting with 5 methods and reputation weighting
- `integrations/jupiter_client.py` -- Jupiter V6 API client for swap routing
- `demos/portfolio_manager.py` -- Full portfolio management demonstration

---

## Dashboard

Location: `dashboard/`

Next.js 14 application with every panel driven by live data:

### Data sources (zero mock data)

| Panel | Live Source |
|-------|-----------|
| Agent Grid | On-chain agent PDAs via `@solana/kit` RPC |
| Proposals / Governance | On-chain proposal PDAs + SwarmState account |
| Portfolio | Wallet SOL balance (RPC) + CoinGecko SOL/USD price |
| Sentiment | CoinGecko market data + Alternative.me Fear & Greed Index |
| Arbitrage | DexScreener token pairs API |
| Marketplace | On-chain agent registry |
| Metrics | On-chain SwarmState (active agents, proposals, executed count) |
| History | IndexedDB time-series (SOL balance + CoinGecko price, 60s polling) |

### Dashboard panels (9 tabs)

| Tab | Component | Key features |
|-----|-----------|-------------|
| Overview | `MetricsPanel` + `AgentGrid` + `AIInsights` | Live on-chain stats, agent cards, AI-generated insights |
| Agents | `AgentGrid` | Search, filter by status, click for agent detail modal |
| Proposals | `ProposalList` + `ProposalModal` | On-chain proposals, quadratic voting bars, AI risk analysis button |
| Portfolio | `PortfolioChart` | Real SOL balance, USD value, token allocation from wallet |
| Governance | `GovernancePanel` | Voting method chart, agent leaderboard, quadratic vs linear comparison, coalition info |
| Sentiment | `SentimentPanel` | Fear & Greed gauge, CoinGecko market dominance, social volume |
| Arbitrage | `ArbitragePanel` | DexScreener live token pairs, spread detection |
| Marketplace | `MarketplacePanel` | Agent listings from on-chain registry |
| History | `HistoryPanel` | P&L area chart (1h/24h/7d/all), Sharpe ratio, max drawdown |

### Key infrastructure files

| File | Purpose |
|------|---------|
| `src/lib/solana/client.ts` | Kit RPC factory, PDA derivation, account fetching (all calls wrapped with `resilientCall`) |
| `src/lib/rpc-resilience.ts` | `withRetry()`, `CircuitBreaker`, `RateLimiter`, `resilientCall()` |
| `src/lib/cache.ts` | IndexedDB offline cache with in-memory fallback (60s TTL) |
| `src/lib/nonce-auth.ts` | Ed25519 wallet signature verification (SubtleCrypto), nonce replay protection |
| `src/lib/history.ts` | P&L time-series snapshots in IndexedDB, Sharpe ratio + max drawdown calculation |
| `src/app/api/ai-draft/route.ts` | LLM proxy for proposal drafting + risk analysis (10 req/min rate limit) |
| `src/hooks/useSwarmAccounts.ts` | Central data hook: RPC fetch + IndexedDB cache hydration + WebSocket subscription |
| `src/context/SolanaContext.tsx` | Kit RPC + WSS provider for React tree |
| `src/context/WalletContext.tsx` | Wallet Standard provider with Phantom-first connection strategy |
| `src/components/CommandPalette.tsx` | Ctrl+K command palette with natural language intent matching |

---

## Real-Time Infrastructure

### WebSocket subscription

The `useSwarmAccounts` hook subscribes to `accountNotifications` on the SwarmState PDA via `@solana/kit` RPC subscriptions. Any on-chain change (new proposal, vote, agent registration) triggers an immediate data refresh -- no waiting for the 30s polling interval.

```
SwarmState PDA changes --> WSS accountNotifications --> refresh() --> UI update
```

Falls back gracefully to 30s polling if the WebSocket connection fails.

### Circuit breaker

Every RPC call passes through a shared `CircuitBreaker` instance:

- **Closed** (normal): requests flow through
- **Open** (after 5 consecutive failures): requests fail fast for 20 seconds
- **Half-open** (after reset timeout): one test request determines recovery

### Rate limiter

A token-bucket rate limiter (30 tokens/second) prevents RPC endpoint abuse, especially important with public/free-tier RPC providers.

### IndexedDB cache

On mount, `useSwarmAccounts` hydrates state from IndexedDB before making any RPC call -- eliminating the blank-screen flash on page reload. Cache entries expire after 60 seconds and are refreshed from the network.

### P&L history

`HistoryPanel` polls the wallet's SOL balance and CoinGecko price every 60 seconds, writing snapshots to a separate IndexedDB database (`neuroswarm-history`). The rolling window holds up to 1,440 snapshots (24 hours at 1/min) per address. Statistics computed: current value, period change, Sharpe ratio (annualised proxy), and maximum drawdown.

---

## Security

### On-chain

- **No floats on-chain** -- quorum and majority calculations use integer arithmetic
- **Bounded data structures** -- voter vector capped at MAX_VOTERS (20) with runtime check
- **Compile-time constants** -- program IDs use `solana_program::pubkey!()` (no runtime unwrap)
- **Byzantine fault tolerance** -- correct operation with up to 1/3 faulty agents
- **Consensus-gated execution** -- proposals require quorum approval before execution
- **Risk limits** -- hard-coded position size and drawdown constraints

### Dashboard

- **Content Security Policy** -- restricts script, connect, and frame sources (`next.config.js`)
- **HSTS** -- 1 year, includes subdomains
- **X-Frame-Options: DENY** -- prevents clickjacking
- **X-Content-Type-Options: nosniff** -- prevents MIME sniffing
- **Referrer-Policy: strict-origin-when-cross-origin** -- limits referrer leakage
- **Permissions-Policy** -- disables camera, microphone, geolocation, FLoC
- **No X-Powered-By header** -- reduces fingerprinting surface
- **Ed25519 nonce auth** -- wallet ownership verified via SubtleCrypto; nonce deleted after first use (replay protection)
- **API rate limiting** -- LLM proxy endpoint limited to 10 req/min per IP
- **Circuit breaker** -- prevents cascading failures from RPC outages
- **Isolated legacy code** -- all `@solana/web3.js` usage confined to a single adapter file
- **Keypair hygiene** -- `.gitignore` blocks `keys/`, `*-keypair.json`, `id.json`; env vars for paths

---

## SDK and Integrations

- **Python SDK** (`sdk/python/agent_swarm_sdk/`) -- build custom agent swarms programmatically
- **SDK examples** (`sdk/examples/custom_trading_swarm.py`) -- reference implementation
- **Codama config** (`codama.config.mjs`) -- generates typed TypeScript clients from the Anchor IDL into `sdk/typescript/generated/`
- **Surfpool config** (`surfpool.toml`) -- integration test runner mirroring devnet state

---

## Installation

### Prerequisites

- Solana CLI (stable)
- Rust and Cargo (via rustup)
- Anchor CLI 0.29.0 (via avm)
- Python 3.11+
- Node.js 18+ and npm

### Setup

```bash
# Clone the repository
git clone https://github.com/edoh-Onuh/neuroswarm-ai.git
cd neuroswarm-ai

# Install Python dependencies
pip install -r requirements.txt

# Build the Solana program
anchor build

# Install dashboard dependencies
cd dashboard
npm install
cd ..

# Install root test dependencies (for Anchor TS tests)
npm install
```

### Environment Configuration

```bash
# Dashboard environment
cp dashboard/.env.example dashboard/.env.local
```

Edit `dashboard/.env.local`:

```env
# Required -- Solana RPC endpoint
NEXT_PUBLIC_SOLANA_RPC_URL=https://rpc.ankr.com/solana

# Optional -- WebSocket endpoint (defaults to wss://rpc.ankr.com/solana/ws)
NEXT_PUBLIC_WSS_URL=wss://rpc.ankr.com/solana/ws

# Optional -- LLM provider for AI proposal drafting
OPENAI_API_KEY=sk-...          # or GROQ_API_KEY
LLM_BASE_URL=https://api.openai.com/v1   # or https://api.groq.com/openai/v1
LLM_MODEL=gpt-4o-mini                     # or llama-3.3-70b-versatile
```

```bash
# Solana CLI configuration
solana config set --url devnet
```

---

## Running

### Agent Swarm

```bash
# Start all agents
python run_swarm.py

# Or start individual agents
python agents/consensus_agent.py
python agents/analytics_agent.py
python agents/risk_agent.py
python agents/learning_agent.py
python agents/sentiment_agent.py
```

### Dashboard

```bash
cd dashboard
npm run dev
# Open http://localhost:3000
```

Use `Ctrl+K` to open the command palette. Type natural language commands like "show portfolio", "arbitrage", "reload", or "history".

### Portfolio Manager Demo

```bash
# Full demo (requires RPC connection)
python demos/portfolio_manager.py

# Offline demo (simulated data)
python demos/portfolio_manager_offline.py
```

---

## Testing

### Rust Unit Tests (LiteSVM / Mollusk)

```bash
cd programs/agent_swarm
cargo test
```

Tests are in `programs/agent_swarm/tests/litesvm_tests.rs` using LiteSVM for fast in-process SVM testing and Mollusk for instruction-level testing.

### Anchor Integration Tests

```bash
anchor test
```

Runs `tests/anchor_tests.ts` via ts-mocha against a local validator.

### Surfpool Integration Tests

```bash
# Requires surfpool installed
surfpool test
```

Uses `surfpool.toml` configuration to mirror devnet state and test against a local fork.

### Python Tests

```bash
pytest tests/
```

### Codama Client Generation

```bash
# Generate typed TypeScript clients from the IDL
npx codama run codama.config.mjs
```

Output goes to `sdk/typescript/generated/`.

---

## Project Structure

```
neuroswarm-ai/
  programs/agent_swarm/           # Anchor program (Rust)
    src/
      lib.rs                      # Program entrypoint and instruction dispatch
      state.rs                    # Account state (SwarmState, Agent, Proposal)
      instructions/               # Instruction handlers
      errors.rs                   # Custom error types
      constants.rs                # Protocol constants
      cpi.rs                      # Cross-program invocation stubs
    tests/
      litesvm_tests.rs            # LiteSVM + Mollusk unit tests
  agents/                         # Python agent framework
    base_agent.py                 # Base class for all agents
    consensus_agent.py            # BFT consensus coordinator
    analytics_agent.py            # Market data analysis
    risk_agent.py                 # Risk management
    learning_agent.py             # Reinforcement learning
    enhanced_learning_agent.py    # Extended learning with persistence
    sentiment_agent.py            # Sentiment analysis
    arbitrage_agent.py            # Cross-DEX arbitrage detection
    custom_agent_builder.py       # Template-based team builder
    agent_marketplace.py          # Agent rental marketplace
  dashboard/                      # Next.js 14 web dashboard
    src/
      app/
        page.tsx                  # Main dashboard (9 tabs)
        api/ai-draft/route.ts     # LLM proxy for proposal drafting
      components/
        AgentGrid.tsx             # Agent cards with search + filter
        ProposalList.tsx          # Proposal table
        ProposalModal.tsx         # Proposal detail + quadratic voting + AI analysis
        PortfolioChart.tsx        # Live SOL balance + USD value
        GovernancePanel.tsx       # Voting methods + leaderboard + quadratic comparison
        SentimentPanel.tsx        # Fear & Greed + CoinGecko market data
        ArbitragePanel.tsx        # DexScreener live pairs
        MarketplacePanel.tsx      # Agent marketplace
        HistoryPanel.tsx          # P&L history chart with Sharpe + drawdown
        CommandPalette.tsx        # Ctrl+K with natural language intent matching
        MetricsPanel.tsx          # Overview stats
        AIInsights.tsx            # AI-generated insights
        NotificationCenter.tsx    # Toast notifications
        ExportPanel.tsx           # Data export
      hooks/
        useSwarmAccounts.ts       # Central data hook: RPC + cache + WebSocket
      lib/
        solana/client.ts          # Kit RPC, PDA derivation, resilient account fetching
        rpc-resilience.ts         # Circuit breaker + retry + rate limiter
        cache.ts                  # IndexedDB offline cache
        nonce-auth.ts             # Ed25519 wallet verification
        history.ts                # P&L time-series storage
      context/
        SolanaContext.tsx         # Kit RPC + WSS provider
        WalletContext.tsx         # Wallet Standard provider
        DashboardContext.tsx      # App state + RPC health checks
    next.config.js                # Security headers (CSP, HSTS, etc.)
  governance/                     # Coalition voting system
  integrations/                   # DEX clients (Jupiter)
  sdk/                            # Python SDK + Codama TS generation
  demos/                          # Portfolio manager demos
  scripts/                        # Initialization and deployment scripts
  tests/                          # Integration tests
  target/deploy/                  # Built program artifacts
  Anchor.toml                     # Anchor framework config
```

---

## Roadmap

### Phase 1: Core Protocol -- Complete

- Multi-agent coordination framework
- On-chain consensus mechanism with Byzantine fault tolerance
- Agent registration and reputation tracking
- Program deployed to Solana devnet
- 5 core specialized agents (Consensus, Analytics, Execution, Risk, Learning)
- Simulation environment

### Phase 2: Expansion -- Complete

- DeFi portfolio management demo
- Custom agent types (Governance, Security, Liquidity, Arbitrage, Custom)
- Cross-program invocation framework
- Agent marketplace backend
- Enhanced learning with Q-learning and SQLite persistence
- Jupiter DEX integration (V6 API)

### Phase 3: Ecosystem -- Complete

- Python SDK for custom agent swarms
- Coalition governance (5 voting methods, reputation system)
- Sentiment analysis agent
- Arbitrage detection agent
- Custom agent builder with 5 templates

### Phase 4: Best Practices Alignment -- Complete

- Dashboard migrated to @solana/kit (framework-kit-first)
- Wallet Standard connection (replaces legacy wallet adapters)
- web3-compat adapter boundary pattern
- On-chain security fixes (no floats, bounded vectors, compile-time pubkeys)
- LiteSVM + Mollusk test setup
- Codama typed client generation configured
- Surfpool integration test runner configured

### Phase 5: Live Data + Production Hardening -- Complete

- All dashboard panels migrated to live on-chain + API data (zero mock data)
- WebSocket real-time subscription on SwarmState PDA
- Circuit breaker + exponential-backoff retry + token-bucket rate limiter
- IndexedDB offline cache with auto-hydration
- Ed25519 nonce-based wallet verification (SubtleCrypto)
- P&L history panel with Sharpe ratio and max drawdown
- AI proposal drafting and risk analysis (LLM proxy)
- Quadratic voting display (linear vs quadratic comparison)
- Natural language command palette (Ctrl+K)
- Content Security Policy + full security header suite
- Live portfolio value from wallet SOL balance + CoinGecko
- Live sentiment from Fear & Greed Index + CoinGecko market data
- Live arbitrage from DexScreener API

### Phase 6: Planned

- Mainnet deployment with security audit
- Full CPI integration with Orca and Raydium
- Compute budget optimization for mainnet transactions
- Token-2022 (Token Extensions) support
- Mobile app (React Native scaffold exists in `mobile/`)
- Enterprise features

---

## Contributing

```bash
# Fork and clone
git clone https://github.com/<your-username>/neuroswarm-ai.git

# Create a feature branch
git checkout -b feature/your-feature

# Make changes, then commit and push
git commit -m "Add your feature"
git push origin feature/your-feature

# Open a pull request
```

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

---

## License

MIT -- see [LICENSE](LICENSE).

---

## Links

- **Repository**: [github.com/edoh-Onuh/neuroswarm-ai](https://github.com/edoh-Onuh/neuroswarm-ai)
- **X**: [@Adanubrown](https://X.com/Adanubrown)
