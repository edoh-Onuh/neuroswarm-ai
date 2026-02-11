# Agent Swarm SDK

Build custom multi-agent coordination systems on Solana using the Agent Swarm Intelligence Protocol.

## Installation

```bash
pip install agent-swarm-sdk
```

## Quick Start

```python
from agent_swarm_sdk import AgentSwarm, Agent, AgentType

# Create a new agent swarm
swarm = AgentSwarm(
    program_id="56Vy8e8V4E6UZnsa6uDRg8HFiPwroz6nRKh7rm9xAfeK",
    rpc_url="https://api.devnet.solana.com"
)

# Initialize swarm on-chain
await swarm.initialize(
    max_agents=10,
    min_votes_required=6,
    proposal_timeout=7200  # 2 hours
)

# Register custom agent
agent = Agent(
    agent_type=AgentType.CUSTOM,
    name="My Custom Agent",
    keypair=my_keypair
)

await swarm.register_agent(agent)

# Create and vote on proposals
proposal = await swarm.create_proposal(
    proposal_type="trade",
    description="Swap 10 SOL for USDC",
    data={"amount": 10_000_000_000}
)

await swarm.vote(proposal.id, "approve", "Looks profitable")
```

## Features

- **Easy Initialization**: Deploy agent swarms with a few lines of code
- **Custom Agent Types**: Define your own agent behaviors
- **Proposal Management**: Create, vote, and execute proposals
- **Byzantine Fault Tolerance**: Built-in consensus mechanisms
- **Type Safety**: Full TypeScript and Python type hints
- **Testing Utilities**: Mock environments for development

## Documentation

Full documentation at: https://docs.agentswarm.io

## License

MIT
