"""
SDK Example: Building a Custom Trading Agent Swarm
"""
import asyncio
from agent_swarm_sdk import AgentSwarm, Agent, AgentType
from solders.keypair import Keypair


async def main():
    """Example: Create a custom trading agent swarm"""
    
    print("=" * 70)
    print("🤖 Agent Swarm SDK - Custom Trading Swarm Example")
    print("=" * 70)
    
    # Initialize swarm
    swarm = AgentSwarm(
        program_id="56Vy8e8V4E6UZnsa6uDRg8HFiPwroz6nRKh7rm9xAfeK",
        rpc_url="https://api.devnet.solana.com",
        authority=Keypair()  # In production, load from secure storage
    )
    
    # Initialize on-chain swarm state
    print("\n📦 Initializing swarm...")
    await swarm.initialize(
        max_agents=7,
        min_votes_required=4,
        proposal_timeout=3600
    )
    
    # Create custom agents
    print("\n👥 Registering agents...")
    
    agents = [
        Agent(
            agent_type=AgentType.ANALYTICS,
            name="Market Analyzer",
            keypair=Keypair()
        ),
        Agent(
            agent_type=AgentType.EXECUTION,
            name="Trade Executor",
            keypair=Keypair()
        ),
        Agent(
            agent_type=AgentType.RISK_MANAGEMENT,
            name="Risk Monitor",
            keypair=Keypair()
        ),
        Agent(
            agent_type=AgentType.CUSTOM,
            name="Arbitrage Hunter",
            keypair=Keypair()
        ),
    ]
    
    for agent in agents:
        await swarm.register_agent(agent)
        print(f"   ✅ Registered: {agent.name}")
    
    # Create trading proposal
    print("\n📋 Creating trading proposal...")
    proposal = await swarm.create_proposal(
        agent=agents[0],  # Market Analyzer creates proposal
        proposal_type="trade",
        description="Buy 100 SOL at $150",
        data={
            "action": "buy",
            "token": "SOL",
            "amount": 100,
            "price_limit": 150
        }
    )
    
    # Agents vote on proposal
    print("\n🗳️  Agents voting...")
    await swarm.vote(agents[0], proposal.id, "approve", "Strong buy signal")
    await swarm.vote(agents[1], proposal.id, "approve", "Can execute")
    await swarm.vote(agents[2], proposal.id, "reject", "Position size too large")
    await swarm.vote(agents[3], proposal.id, "approve", "Good arb opportunity")
    
    # Check proposal status
    print(f"\n📊 Proposal Status:")
    print(f"   Votes: {proposal.votes}")
    print(f"   Status: {proposal.get_status()}")
    
    # List all agents
    print(f"\n👥 Active Agents: {len(await swarm.list_agents())}")
    for agent in await swarm.list_agents():
        print(f"   - {agent.name} ({agent.agent_type})")
    
    print("\n✅ Example complete!")
    
    await swarm.close()


if __name__ == "__main__":
    asyncio.run(main())
