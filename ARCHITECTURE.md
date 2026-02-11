# Architecture Overview

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Solana Blockchain                            │
│                                                                       │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │          Agent Swarm Program (Rust/Anchor)                   │   │
│  │                                                               │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │   │
│  │  │ SwarmState   │  │   Agent      │  │  Proposal    │      │   │
│  │  ├──────────────┤  ├──────────────┤  ├──────────────┤      │   │
│  │  │ authority    │  │ owner        │  │ proposer     │      │   │
│  │  │ max_agents   │  │ agent_type   │  │ proposal_type│      │   │
│  │  │ active_agents│  │ reputation   │  │ votes_for    │      │   │
│  │  │ min_votes    │  │ is_active    │  │ votes_against│      │   │
│  │  └──────────────┘  └──────────────┘  └──────────────┘      │   │
│  │                                                               │   │
│  │  Instructions:                                                │   │
│  │  • initialize() → Setup swarm                                │   │
│  │  • register_agent() → Register agent                         │   │
│  │  • create_proposal() → Submit proposal                       │   │
│  │  • vote_proposal() → Cast vote                              │   │
│  │  • execute_proposal() → Execute approved proposal           │   │
│  │  • update_reputation() → Update agent score                 │   │
│  │  • record_outcome() → Record execution result               │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘
                              ▲
                              │ Solana RPC
                              │ (read/write transactions)
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    Agent Swarm Framework (Python)                    │
│                                                                       │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                    BaseAgent (Abstract)                       │  │
│  │  • connect to Solana                                          │  │
│  │  • register with swarm                                        │  │
│  │  • create proposals                                           │  │
│  │  • vote on proposals                                          │  │
│  │  • continuous operation loop                                  │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                              ▲                                        │
│                              │ Inherits                               │
│         ┌────────┬────────┬──┴───┬────────┬────────┐               │
│         ▼        ▼        ▼      ▼        ▼        ▼               │
│  ┌──────────┐ ┌──────┐ ┌─────┐ ┌──────┐ ┌────────┐ ┌─────────┐  │
│  │Consensus │ │Analy-│ │Risk │ │Learn-│ │Execu-  │ │ Future  │  │
│  │  Agent   │ │tics  │ │Mgmt │ │ ing  │ │tion    │ │ Agents  │  │
│  │          │ │Agent │ │Agent│ │Agent │ │ Agent  │ │  ...    │  │
│  └──────────┘ └──────┘ └─────┘ └──────┘ └────────┘ └─────────┘  │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘
```

## Agent Coordination Flow

```
1. PROPOSAL CREATION
   
   Analytics Agent
   │
   ├─► Analyzes market data
   ├─► Detects portfolio drift (18%)
   ├─► Creates rebalance proposal
   └─► Submits to Solana program
       │
       └─► Stored on-chain ✓


2. DISTRIBUTED VOTING

   ┌─ Consensus Agent
   │  ├─► Receives proposal
   │  ├─► Checks procedure
   │  ├─► Votes: APPROVE
   │  └─► Reasoning: "Maintains system integrity"
   │
   ├─ Analytics Agent
   │  ├─► Validates data
   │  ├─► Confirms drift calculation
   │  ├─► Votes: APPROVE
   │  └─► Reasoning: "Data supports rebalancing"
   │
   ├─ Risk Management Agent
   │  ├─► Checks risk limits
   │  ├─► Validates allocation
   │  ├─► Votes: APPROVE
   │  └─► Reasoning: "Complies with risk parameters"
   │
   └─ Learning Agent
      ├─► Analyzes past outcomes
      ├─► Predicts success (85% confidence)
      ├─► Votes: APPROVE
      └─► Reasoning: "Historical patterns support success"
      
   All votes recorded on-chain ✓


3. CONSENSUS & EXECUTION

   Solana Program
   │
   ├─► Collects all votes
   ├─► Applies reputation weights
   │   • Consensus: 1200 weight
   │   • Analytics: 1100 weight
   │   • Risk: 1050 weight
   │   • Learning: 980 weight
   │
   ├─► Checks quorum (4/5 voted) ✓
   ├─► Checks approval (100% approved) ✓
   └─► Marks proposal as APPROVED
       │
       └─► Execution Agent executes trade
           └─► Records outcome on-chain ✓


4. LEARNING & ADAPTATION

   Learning Agent
   │
   ├─► Fetches outcome data
   ├─► Analyzes success (portfolio rebalanced ✓)
   ├─► Updates models
   │   • Rebalance confidence: 0.85 → 0.90
   │   • Analytics agent trust: +5%
   │
   └─► Proposes strategy update
       └─► Cycle repeats...
```

## State Machine

```
Agent Registration Flow:
┌──────────┐
│ Generate │
│ Keypair  │
└────┬─────┘
     │
     ▼
┌──────────┐      ┌─────────────┐
│  Airdrop │─────▶│   Register  │
│   SOL    │      │    Agent    │
└──────────┘      └──────┬──────┘
                         │
                         ▼
                  ┌──────────────┐
                  │ Agent Active │◀──┐
                  └──────┬───────┘   │
                         │           │
                         │  Continuous
                         │     Loop
                         ▼           │
                  ┌──────────────┐  │
                  │   Monitor &  │  │
                  │   Decide     │──┘
                  └──────────────┘


Proposal Lifecycle:
┌─────────────┐
│   Created   │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   Voting    │◀─── Agents vote
└──────┬──────┘
       │
       ├─── Quorum not reached ───▶ EXPIRED
       │
       ├─── Rejected ──────────────▶ REJECTED
       │
       └─── Approved
            │
            ▼
       ┌─────────────┐
       │  Approved   │
       └──────┬──────┘
              │
              ▼
       ┌─────────────┐
       │  Executed   │
       └──────┬──────┘
              │
              ▼
       ┌─────────────┐
       │   Outcome   │
       │  Recorded   │
       └─────────────┘
```

## Data Flow

```
┌─────────────────────────────────────────────────┐
│         External Data Sources                    │
│  • Market prices (Jupiter, Orca)                │
│  • On-chain data (Solana RPC)                   │
│  • DeFi metrics (liquidity, volumes)            │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│         Analytics Agent                          │
│  • Fetches data                                  │
│  • Processes metrics                             │
│  • Identifies opportunities                      │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│         Proposal Creation                        │
│  • Proposal data serialized                      │
│  • Submitted to Solana program                   │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│         On-Chain Storage                         │
│  • Proposal stored in PDA                        │
│  • Immutable record created                      │
└────────────────┬────────────────────────────────┘
                 │
                 ├──────────────┐
                 │              │
                 ▼              ▼
┌──────────────────┐  ┌──────────────────┐
│  All Agents      │  │  All Agents      │
│  Notified        │  │  Fetch Proposal  │
└────────┬─────────┘  └────────┬─────────┘
         │                     │
         └──────────┬──────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────┐
│         Evaluation & Voting                      │
│  • Each agent analyzes independently             │
│  • Applies own decision criteria                 │
│  • Casts vote with reasoning                     │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│         On-Chain Consensus                       │
│  • Votes aggregated                              │
│  • Weights applied (reputation-based)            │
│  • Quorum checked                                │
│  • Result determined                             │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│         Execution (if approved)                  │
│  • Execution agent performs action               │
│  • Transaction submitted to Solana               │
│  • Outcome recorded on-chain                     │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│         Learning & Adaptation                    │
│  • Learning agent analyzes outcome               │
│  • Models updated                                │
│  • Future decisions improved                     │
└─────────────────────────────────────────────────┘
```

## Security Model

```
┌─────────────────────────────────────────────────┐
│         Byzantine Fault Tolerance                │
│                                                   │
│  Honest Agents (4)     Malicious Agent (1)       │
│  ┌──┐ ┌──┐ ┌──┐ ┌──┐       ┌──┐                │
│  │✓ │ │✓ │ │✓ │ │✓ │       │✗ │                │
│  └┬─┘ └┬─┘ └┬─┘ └┬─┘       └┬─┘                │
│   │    │    │    │           │                   │
│   └────┴────┴────┴───────────┘                   │
│              │                                    │
│              ▼                                    │
│     ┌─────────────────┐                          │
│     │ Weighted Voting │                          │
│     │  • 4 honest     │                          │
│     │  • 1 malicious  │                          │
│     │  ═══════════════│                          │
│     │  Honest > 66.7% │ ✓                        │
│     └─────────────────┘                          │
│                                                   │
│  System remains secure with up to 1/3            │
│  malicious agents (Byzantine threshold)          │
└─────────────────────────────────────────────────┘
```

## Reputation System

```
Initial State:
┌─────────────────────────────────────┐
│ All agents start with reputation    │
│ of 1000                              │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│ Agent creates successful proposal   │
│ Reputation: 1000 → 1050 (+50)       │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│ Higher reputation = more vote weight│
│ Vote weight = 1000 + (rep × 10)     │
│ 1050 rep = 11,500 vote weight       │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│ Bad proposals decrease reputation   │
│ Reputation: 1050 → 1020 (-30)       │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│ Reputation bounded [0, 10000]       │
│ System self-regulates quality       │
└─────────────────────────────────────┘
```

---

*This architecture enables true autonomous multi-agent coordination on Solana.*
