# 🚀 NeuroSwarm AI - Advanced Features

This document details all the advanced features added to NeuroSwarm AI.

## Table of Contents
- [Sentiment Analysis Agent](#sentiment-analysis-agent)
- [Arbitrage Agent](#arbitrage-agent)
- [Custom Agent Builder](#custom-agent-builder)
- [Agent Marketplace](#agent-marketplace)
- [Mobile App](#mobile-app)

---

## 📊 Sentiment Analysis Agent

### Overview
The Sentiment Analysis Agent monitors market sentiment across multiple data sources to inform trading decisions.

### Data Sources
- **Twitter**: Analyzes tweets, mentions, and trending topics
- **Reddit**: Monitors subreddits like r/CryptoCurrency, r/solana, r/SolanaNFTs
- **News**: Aggregates and analyzes crypto news from major outlets
- **On-Chain Data**: Tracks whale movements, holder changes, transaction volumes

### Features
- **Composite Sentiment Score**: Weighted average from all sources (0-1 scale)
- **Sentiment Classification**: Bullish, Bearish, or Neutral
- **Confidence Level**: Data quality and availability score
- **Auto-Proposals**: Creates proposals when strong sentiment detected

### Usage
```python
from agents.sentiment_agent import SentimentAnalysisAgent

agent = SentimentAnalysisAgent(wallet_keypair, program_id)

# Get sentiment for a token
sentiment = await agent.get_composite_sentiment('SOL')
print(f"Sentiment: {sentiment['sentiment']}")
print(f"Score: {sentiment['composite_score']:.2f}")
print(f"Confidence: {sentiment['confidence']:.2%}")

# Auto-propose based on sentiment
proposal = await agent.should_propose_action('SOL')
if proposal:
    print(f"Proposed: {proposal['action']} - {proposal['reason']}")
```

### Configuration
- `sentiment_threshold`: Minimum score to trigger action (default: 0.6)
- `sentiment_sources`: Toggle sources on/off
- `check_interval`: How often to check sentiment (default: 5 minutes)

---

## 💰 Arbitrage Agent

### Overview
The Arbitrage Agent identifies and executes arbitrage opportunities across Solana DEXes.

### Supported DEXes
- Raydium
- Orca
- Jupiter
- Lifinity
- Meteora

### Features
- **Real-Time Price Monitoring**: Fetches prices from all DEXes simultaneously
- **Profit Calculation**: Accounts for fees, slippage, and gas costs
- **Risk Management**: Calculates optimal trade size based on liquidity
- **Simulation**: Tests arbitrage before execution
- **Auto-Execution**: Executes profitable opportunities automatically

### Usage
```python
from agents.arbitrage_agent import ArbitrageAgent

agent = ArbitrageAgent(wallet_keypair, program_id)

# Find arbitrage opportunities
opportunities = await agent.scan_markets()

for opp in opportunities:
    print(f"{opp['token_pair']}")
    print(f"  Buy: {opp['buy_dex']} @ {opp['buy_price']}")
    print(f"  Sell: {opp['sell_dex']} @ {opp['sell_price']}")
    print(f"  Profit: {opp['profit_percentage']:.2f}%")
    
    # Simulate execution
    trade_size = await agent.calculate_optimal_trade_size(opp)
    simulation = await agent.simulate_arbitrage(opp, trade_size)
    
    if simulation['profitable']:
        await agent.execute_arbitrage(opp, trade_size)
```

### Configuration
- `min_profit_bps`: Minimum profit in basis points (default: 50 = 0.5%)
- `max_slippage_bps`: Maximum acceptable slippage (default: 100 = 1%)
- `dexes`: List of DEXes to monitor
- `scan_interval`: How often to scan markets (default: 10 seconds)

---

## 🎮 Custom Agent Builder

### Overview
Create and configure custom agent teams with specific capabilities and risk profiles.

### Agent Capabilities
- **Market Analysis**: Technical and fundamental analysis
- **Sentiment Analysis**: Social media and news monitoring
- **Risk Management**: Portfolio protection and position sizing
- **Arbitrage**: Cross-DEX arbitrage opportunities
- **Lending**: DeFi lending protocols (Solend, Port, etc.)
- **Liquidity Provision**: LP token management
- **NFT Trading**: NFT market monitoring and trading
- **Governance**: DAO voting and proposals
- **Execution**: Trade execution and order routing
- **Learning**: Strategy optimization via ML

### Predefined Templates

#### 1. Conservative Trader
- **Risk Tolerance**: 0.3 (Low)
- **Capabilities**: Market Analysis, Risk Management
- **Constraints**: No leverage, no memecoins
- **Max Position**: 10% of portfolio

#### 2. Aggressive Trader
- **Risk Tolerance**: 0.8 (High)
- **Capabilities**: Market Analysis, Arbitrage
- **Constraints**: Max 2x leverage
- **Max Position**: 30% of portfolio

#### 3. Sentiment Specialist
- **Risk Tolerance**: 0.5 (Medium)
- **Capabilities**: Sentiment Analysis, Market Analysis
- **Focus**: Twitter, Reddit, news sentiment
- **Sentiment Threshold**: 0.7

#### 4. Arbitrage Hunter
- **Risk Tolerance**: 0.4 (Low-Medium)
- **Capabilities**: Arbitrage, Execution
- **Min Profit**: 50 bps (0.5%)
- **DEXes**: Raydium, Orca, Jupiter

#### 5. DeFi Strategist
- **Risk Tolerance**: 0.6 (Medium-High)
- **Capabilities**: Lending, Liquidity Provision, Market Analysis
- **Strategies**: Lending, staking, LP
- **Min APR**: 5%

### Usage
```python
from agents.custom_agent_builder import CustomAgentBuilder, AgentCapability

builder = CustomAgentBuilder()

# Create a balanced team
team = builder.create_balanced_team(5)

# Create custom agent
custom_agent = builder.create_custom_agent(
    name="NFT Flipper",
    capabilities=[AgentCapability.NFT_TRADING, AgentCapability.MARKET_ANALYSIS],
    risk_tolerance=0.7,
    voting_weight=0.2,
    specialization={'nft_collections': ['degods', 'okay_bears']},
    constraints={'max_nft_price': 100}
)

team.append(custom_agent)

# Validate team
validation = builder.validate_team(team)
if validation['valid']:
    config = builder.export_team_config(team)
    print(f"Team created: {config['validation']['team_size']} agents")
else:
    print(f"Missing capabilities: {validation['missing_capabilities']}")
```

### Team Validation
Essential capabilities required:
- Market Analysis
- Risk Management
- Execution

The validator checks:
- Total voting weight sums correctly
- Essential capabilities present
- Average risk tolerance is balanced

---

## 🏆 Agent Marketplace

### Overview
Platform where agents compete for performance, users can rent agents, and agents earn reputation.

### Agent Ratings
- **Legendary** (Top 1%): Elite performers with proven track record
- **Elite** (Top 5%): Consistently profitable agents
- **Expert** (Top 10%): Reliable agents with good performance
- **Proficient** (Top 25%): Solid performance
- **Developing** (Bottom 75%): New or unproven agents

### Performance Metrics
- **Total Proposals**: Number of proposals created
- **Success Rate**: Percentage of successful proposals
- **Total Profit**: Cumulative profit generated
- **Average ROI**: Mean return on investment
- **Risk-Adjusted Return**: Sharpe ratio or similar metric
- **Consistency Score**: Volatility and reliability (0-100)
- **Reputation**: Overall score (starts at 1000)

### Features

#### List Your Agent
```python
from agents.agent_marketplace import AgentMarketplace

marketplace = AgentMarketplace()

agent_id = marketplace.list_agent(
    agent_id="my_agent_001",
    owner_pubkey="owner_wallet_address",
    name="Elite Day Trader",
    description="High-frequency trading specialist with 85% win rate",
    capabilities=["market_analysis", "arbitrage", "execution"],
    rental_price=5.0,  # 5 SOL per day
    rental_terms={
        'min_rental_period': 1,
        'max_rental_period': 30,
        'cancellation_policy': 'flexible',
        'performance_guarantee': True
    }
)
```

#### Search for Agents
```python
# Search by capabilities
agents = marketplace.search_agents(
    capabilities=["arbitrage"],
    min_rating=AgentRating.EXPERT,
    max_price=10.0,
    min_reputation=1500
)

for agent in agents:
    print(f"{agent.name}: {agent.performance.rating.value}")
    print(f"  Price: {agent.performance.rental_price} SOL/day")
    print(f"  Reputation: {agent.performance.reputation}")
    print(f"  Win Rate: {agent.performance.successful_proposals / agent.performance.total_proposals * 100:.1f}%")
```

#### Rent an Agent
```python
rental = marketplace.rent_agent(
    agent_id="elite_agent_123",
    renter_pubkey="my_wallet_address",
    rental_period=7,  # 7 days
    payment_amount=35.0  # 7 days * 5 SOL/day
)

print(f"Rental active from {rental['start_date']} to {rental['end_date']}")
```

#### Leaderboard
```python
top_agents = marketplace.get_leaderboard(limit=10)

print("Top 10 Agents:")
for i, agent in enumerate(top_agents, 1):
    print(f"{i}. {agent.agent_name}")
    print(f"   Rating: {agent.rating.value}")
    print(f"   Reputation: {agent.reputation}")
    print(f"   ROI: {agent.average_roi:.2%}")
```

#### Reviews
```python
# Add a review
marketplace.add_review(
    agent_id="elite_agent_123",
    reviewer_pubkey="my_wallet_address",
    rating=5,  # 1-5 stars
    comment="Excellent performance! Generated 15% profit in one week."
)

# View agent stats with reviews
stats = marketplace.get_agent_stats("elite_agent_123")
print(f"Average Rating: {stats['reviews']['average_rating']:.1f}/5")
print(f"Total Reviews: {stats['reviews']['count']}")
```

### Revenue Model
- **Rental Income**: Earn SOL when others rent your agent
- **Performance Bonuses**: Extra rewards for top-rated agents
- **Marketplace Fee**: 5% platform fee on rentals
- **Reputation Rewards**: Monthly airdrops to high-reputation agents

---

## 📱 Mobile App

### Overview
React Native mobile app for iOS and Android with full swarm monitoring capabilities.

### Features

#### Real-Time Dashboard
- Portfolio value and 24h change
- Active agent count
- Pending proposals
- Win rate and total trades
- Performance charts (7-day, 30-day, all-time)

#### Agent Management
- View all agents and their status
- Start/stop agents remotely
- View individual agent performance
- Configure agent settings

#### Proposals & Voting
- View all pending proposals
- Detailed proposal information
- One-tap approve/reject voting
- Voting deadline countdown
- Proposal history and outcomes

#### Push Notifications
Receive instant alerts for:
- New proposals requiring vote
- Trade executions
- Agent status changes (online/offline)
- Profit milestones reached
- Risk alerts (drawdown, position limits)

#### Portfolio Tracking
- Real-time holdings
- Token prices and 24h changes
- Transaction history
- Profit/loss breakdown
- Asset allocation pie chart

#### Security
- Biometric authentication (Face ID, Touch ID, Fingerprint)
- Secure wallet storage using Keychain
- Transaction confirmation prompts
- Auto-lock after inactivity

#### Offline Mode
- View cached data when offline
- Sync automatically when connection restored
- Queue actions for later execution

### Tech Stack
- **Framework**: React Native 0.74
- **State Management**: Redux Toolkit with RTK Query
- **Navigation**: React Navigation 6
- **Wallet**: Solana Mobile SDK
- **UI**: React Native Paper
- **Charts**: Victory Native
- **Push Notifications**: Firebase Cloud Messaging
- **Auth**: React Native Biometrics

### Installation

```bash
cd mobile

# Install dependencies
npm install

# iOS
cd ios && pod install && cd ..
npm run ios

# Android
npm run android
```

### App Store Links
- **iOS**: Coming soon to App Store
- **Android**: Coming soon to Google Play

### Screenshots
(Screenshots will be added after app store submission)

---

## 🔧 Integration Guide

### Adding Sentiment Agent to Existing Swarm

```python
from agents.sentiment_agent import SentimentAnalysisAgent
from agents.consensus import ConsensusCoordinator

# Initialize agents
sentiment_agent = SentimentAnalysisAgent(wallet, program_id)
coordinator = ConsensusCoordinator(wallet, program_id)

# Register sentiment agent
await coordinator.register_agent(sentiment_agent)

# Run sentiment agent
await sentiment_agent.run()
```

### Adding Arbitrage Agent

```python
from agents.arbitrage_agent import ArbitrageAgent

arbitrage_agent = ArbitrageAgent(wallet, program_id)
await coordinator.register_agent(arbitrage_agent)
await arbitrage_agent.run()
```

### Using Custom Agent Builder

```python
from agents.custom_agent_builder import CustomAgentBuilder

builder = CustomAgentBuilder()

# Create team from templates
team = builder.create_balanced_team(5)

# Or clone and customize
custom = builder.clone_template(
    'aggressive_trader',
    'My Aggressive Trader',
    risk_tolerance=0.9,
    voting_weight=0.25
)

team.append(custom)

# Export configuration
config = builder.export_team_config(team)
# Save config for deployment
```

---

## 📖 Documentation

For more information, see:
- [Main README](../README.md)
- [Layman's Guide](../LAYMAN_GUIDE.md)
- [Dashboard README](../dashboard/README.md)
- [Mobile App README](../mobile/README.md)

## 🤝 Contact

- **Developer**: Adanu Brown
- **GitHub**: [@edoh-Onuh](https://github.com/edoh-Onuh/)
- **Twitter**: [@Adanubrown](https://twitter.com/Adanubrown)
- **Email**: adanu1947@gmail.com

## 📄 License

MIT License - see [LICENSE](../LICENSE) for details
