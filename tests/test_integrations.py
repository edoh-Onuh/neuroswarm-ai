"""Integration test for all new features"""
import asyncio
import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from integrations.jupiter_client import JupiterClient
from demos.portfolio_manager import DeFiPortfolioManager
from agents.enhanced_learning_agent import EnhancedLearningAgent
from governance.coalition import GovernanceCoalition, VotingMethod
from sdk.python.agent_swarm_sdk import AgentSwarm, AgentType


async def test_jupiter_integration():
    """Test Jupiter DEX integration"""
    print("\n=== Testing Jupiter Integration ===")
    
    from solders.keypair import Keypair
    from solana.rpc.async_api import AsyncClient
    from integrations.jupiter_client import TOKENS
    
    wallet = Keypair()
    rpc_client = AsyncClient("https://api.devnet.solana.com")
    
    client = JupiterClient(rpc_client, wallet)
    
    # Test quote
    quote = await client.get_quote(
        input_mint=TOKENS["SOL"],
        output_mint=TOKENS["USDC"],
        amount=1_000_000_000  # 1 SOL
    )
    
    if quote:
        print(f"[OK] Quote successful: 1 SOL = {quote['outAmount']} USDC")
        print(f"   Price impact: {quote.get('priceImpactPct', 'N/A')}%")
    else:
        print("[FAIL] Quote failed")


async def test_portfolio_manager():
    """Test DeFi portfolio manager"""
    print("\n=== Testing Portfolio Manager ===")
    
    # Use the offline version for testing
    from demos.portfolio_manager_offline import OfflinePortfolioManager
    
    manager = OfflinePortfolioManager(
        wallet_address="11111111111111111111111111111111"
    )
    
    # Test analysis
    analysis = manager.analyze_portfolio()
    print(f"[OK] Portfolio analysis complete")
    print(f"   Total value: ${analysis['total_value']:.2f}")
    print(f"   Tokens: {len(analysis['holdings'])}")
    print(f"   Needs rebalance: {analysis['needs_rebalance']}")


def test_learning_agent():
    """Test enhanced learning agent"""
    print("\n=== Testing Learning Agent ===")
    
    from solders.keypair import Keypair
    from solana.rpc.async_api import AsyncClient
    
    wallet = Keypair()
    rpc_client = AsyncClient("https://api.devnet.solana.com")
    
    agent = EnhancedLearningAgent(wallet, rpc_client)
    
    # Predict vote using actual method signature
    vote, confidence = agent.predict_vote(
        proposal_type="rebalance",
        market_condition="bullish",
        risk_level="low"
    )
    print(f"[OK] Prediction: {vote} (confidence: {confidence:.2f})")
    
    # Record outcome
    agent.record_outcome(
        proposal_id=1,
        proposal_type="rebalance",
        agent_vote=vote,
        final_result="approved",
        success=True,
        market_condition="bullish",
        risk_level="low"
    )
    print(f"[OK] Outcome recorded")
    
    # Get stats
    stats = agent.get_performance_stats()
    print(f"   Total votes: {stats['total_votes']}")
    print(f"   Success rate: {stats['success_rate']:.1%}")


def test_governance_coalition():
    """Test governance framework"""
    print("\n=== Testing Governance Coalition ===")
    
    coalition = GovernanceCoalition(
        name="Test Coalition",
        members=[],
        voting_method=VotingMethod.REPUTATION_WEIGHTED
    )
    
    # Add members
    coalition.add_member("agent1", 100.0)
    coalition.add_member("agent2", 150.0)
    coalition.add_member("agent3", 80.0)
    
    # Create proposal
    proposal = coalition.create_proposal(
        proposer="agent1",
        title="Test Proposal",
        description="Testing governance",
        proposal_type="parameter_change",
        voting_method=VotingMethod.REPUTATION_WEIGHTED
    )
    print(f"[OK] Proposal created: {proposal.id}")
    
    # Vote
    coalition.vote(proposal.id, "agent1", "approve")
    coalition.vote(proposal.id, "agent2", "approve")
    coalition.vote(proposal.id, "agent3", "reject")
    
    # Tally
    result = coalition.tally_votes(proposal.id)
    print(f"[OK] Voting complete: {'PASSED' if result['passed'] else 'FAILED'}")
    print(f"   For: {result['total_for']:.2f}")
    print(f"   Against: {result['total_against']:.2f}")
    print(f"   Approval: {result['approval_rate']:.1%}")
    
    # Stats
    stats = coalition.get_statistics()
    print(f"[OK] Coalition stats:")
    print(f"   Members: {stats['total_members']}")
    print(f"   Proposals: {stats['total_proposals']}")


async def test_sdk():
    """Test Python SDK"""
    print("\n=== Testing Python SDK ===")
    
    swarm = AgentSwarm(
        program_id="56Vy8e8V4E6UZnsa6uDRg8HFiPwroz6nRKh7rm9xAfeK",
        rpc_url="https://api.devnet.solana.com"
    )
    
    # Get state
    state = await swarm.get_swarm_state()
    print(f"[OK] Swarm state retrieved")
    
    if isinstance(state, dict):
        print(f"   State data: {list(state.keys())}")
    else:
        print(f"   Agents: {state.agent_count if hasattr(state, 'agent_count') else 'N/A'}")
        print(f"   Proposals: {state.proposal_count if hasattr(state, 'proposal_count') else 'N/A'}")


async def main():
    """Run all integration tests"""
    print("Running Integration Tests")
    print("=" * 50)
    
    try:
        await test_jupiter_integration()
    except Exception as e:
        print(f"❌ Jupiter test failed: {e}")
    
    try:
        await test_portfolio_manager()
    except Exception as e:
        print(f"❌ Portfolio manager test failed: {e}")
    
    try:
        test_learning_agent()
    except Exception as e:
        print(f"❌ Learning agent test failed: {e}")
    
    try:
        test_governance_coalition()
    except Exception as e:
        print(f"❌ Governance test failed: {e}")
    
    try:
        await test_sdk()
    except Exception as e:
        print(f"❌ SDK test failed: {e}")
    
    print("\n" + "=" * 50)
    print("Integration tests complete!")


if __name__ == "__main__":
    asyncio.run(main())
