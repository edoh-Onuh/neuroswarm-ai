# NeuroSwarm AI

> Multi-agent coordination protocol on Solana. Specialized AI agents reach consensus, propose strategies, and execute actions on-chain -- without human intervention.

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
- [SDK and Integrations](#sdk-and-integrations)
- [Installation](#installation)
- [Running](#running)
- [Testing](#testing)
- [Security](#security)
- [Project Structure](#project-structure)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [License](#license)

---

## Overview

NeuroSwarm AI is a multi-agent swarm intelligence protocol built on Solana. It coordinates specialized AI agents through on-chain consensus -- agents register, propose actions, vote with Byzantine fault tolerance, execute approved strategies, and learn from outcomes.

The reference implementation is an autonomous DeFi portfolio manager where agents analyze markets, propose rebalancing strategies, vote on them, execute trades via Solana DEXes, and adapt over time.

Key properties:

- **On-chain coordination** -- all proposals, votes, and executions are recorded on Solana
- **Byzantine fault tolerant** -- correct operation with up to 1/3 malicious agents
- **Autonomous** -- no human intervention after initialization
- **Transparent** -- full audit trail of every agent decision
- **Extensible** -- custom agent types, pluggable strategies, SDK for building new swarms

---

## Architecture

```
+---------------------+      +---------------------+      +---------------------+
|   Dashboard (Next)  | <--> |  Agent Framework    | <--> | On-Chain Program    |
|   @solana/kit       |      |  (Python)           |      | (Anchor / Rust)     |
|   Wallet Standard   |      |  9 specialized      |      | Agent registry      |
|   Kit-native RPC    |      |  agents             |      | Proposal system     |
+---------------------+      +---------------------+      | Consensus voting    |
                                                           | Reputation tracking |
                                                           +---------------------+
```

Three layers:

1. **Program layer** -- Anchor 0.29.0 Rust program deployed on Solana devnet. Manages agent registration, proposal lifecycle, BFT voting, execution, reputation, and outcome recording.
2. **Agent layer** -- Python framework with 9 specialized agents (consensus, analytics, risk, learning, sentiment, arbitrage, custom builder, marketplace, enhanced learning). Each agent runs autonomously and interacts with the on-chain program.
3. **Dashboard layer** -- Next.js 14 web application using `@solana/kit` for RPC, Wallet Standard for wallet connections, and a web3-compat adapter boundary for any legacy `@solana/web3.js` interop.

---

## Tech Stack

| Layer | Technology | Notes |
|-------|-----------|-------|
| On-chain program | Anchor 0.29.0, solana-program 1.18 | Rust, deployed to devnet |
| Agent framework | Python 3.11+ | solana-py, solders, anchorpy, aiohttp |
| Dashboard | Next.js 14, React 18, TypeScript 5 | Tailwind CSS |
| Solana SDK (dashboard) | @solana/kit 2.1.0 | Kit-native RPC, Address, PDA derivation |
| Wallet connection | @wallet-standard/app 1.1.0 | Wallet Standard discovery, no legacy adapters |
| Legacy boundary | @solana/web3.js 1.87 | Isolated in `web3-compat-adapter.ts` only |
| Client generation | Codama | Typed TS clients from Anchor IDL |
| Rust unit tests | LiteSVM 0.3, Mollusk SVM 0.0.10 | Fast in-process tests |
| Integration tests | Surfpool | Mirrors devnet state locally |
| Governance | Coalition voting (5 methods) | Reputation-weighted |
| DEX integration | Jupiter V6 API, CPI stubs for Raydium/Orca | |

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

Next.js 14 application aligned with Solana Foundation best practices (Jan 2026 playbook):

- **@solana/kit** for all RPC interaction (no direct web3.js in components)
- **Wallet Standard** via `@wallet-standard/app` for wallet discovery and connection
- **Kit-native types** (`Address`, `Rpc`, `getProgramDerivedAddress`) throughout
- **web3-compat-adapter.ts** as the single boundary file for any legacy web3.js interop
- **Environment-driven config** -- RPC endpoints from `NEXT_PUBLIC_RPC_URL` (see `dashboard/.env.example`)

Key files:

| File | Purpose |
|------|---------|
| `src/lib/solana/client.ts` | Kit RPC factory, PDA derivation, account fetching |
| `src/lib/solana/web3-compat-adapter.ts` | Legacy web3.js boundary adapter |
| `src/context/SolanaContext.tsx` | Kit RPC provider for React tree |
| `src/context/WalletContext.tsx` | Wallet Standard provider and `useWallet()` hook |
| `src/components/WalletButton.tsx` | Connect/disconnect wallet UI |
| `src/context/DashboardContext.tsx` | Dashboard state with real RPC health checks |

Dashboard panels: agent grid, metrics, portfolio chart, arbitrage, sentiment, governance, marketplace, AI insights, notifications, command palette, export.

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
# Edit dashboard/.env.local with your RPC endpoint

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

## Security

- **No floats on-chain** -- quorum and majority calculations use integer arithmetic
- **Bounded data structures** -- voter vector capped at MAX_VOTERS (20) with runtime check
- **Compile-time constants** -- program IDs use `solana_program::pubkey!()` (no runtime unwrap)
- **Byzantine fault tolerance** -- correct operation with up to 1/3 faulty agents
- **Consensus-gated execution** -- proposals require quorum approval before execution
- **Risk limits** -- hard-coded position size and drawdown constraints
- **Keypair hygiene** -- `.gitignore` blocks `keys/`, `*-keypair.json`, `id.json`; env vars for paths
- **Isolated legacy code** -- all `@solana/web3.js` usage confined to a single adapter file

See [SOLANA_BEST_PRACTICES.md](SOLANA_BEST_PRACTICES.md) for the full compliance guide.

---

## Project Structure

```
neuroswarm-ai/
  programs/agent_swarm/        # Anchor program (Rust)
    src/
      lib.rs                   # Program entrypoint and instruction dispatch
      state.rs                 # Account state (SwarmState, Agent, Proposal)
      instructions/            # Instruction handlers
      errors.rs                # Custom error types
      constants.rs             # Protocol constants
      cpi.rs                   # Cross-program invocation stubs
    tests/
      litesvm_tests.rs         # LiteSVM + Mollusk unit tests
  agents/                      # Python agent framework
    base_agent.py              # Base class for all agents
    consensus_agent.py         # BFT consensus coordinator
    analytics_agent.py         # Market data analysis
    risk_agent.py              # Risk management
    learning_agent.py          # Reinforcement learning
    enhanced_learning_agent.py # Extended learning with persistence
    sentiment_agent.py         # Sentiment analysis
    arbitrage_agent.py         # Cross-DEX arbitrage detection
    custom_agent_builder.py    # Template-based team builder
    agent_marketplace.py       # Agent rental marketplace
  dashboard/                   # Next.js 14 web dashboard
    src/
      app/                     # Next.js app router
      components/              # UI components
      context/                 # React context providers
      lib/solana/              # Kit RPC client, PDA utils, web3 adapter
  governance/                  # Coalition voting system
  integrations/                # DEX clients (Jupiter)
  sdk/                         # Python SDK + Codama TS generation
  demos/                       # Portfolio manager demos
  scripts/                     # Initialization and deployment scripts
  tests/                       # Anchor integration tests
  target/deploy/               # Built program artifacts
  Anchor.toml                  # Anchor framework config
  codama.config.mjs            # Codama typed client generation
  surfpool.toml                # Surfpool integration test config
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

### Phase 5: Planned

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
