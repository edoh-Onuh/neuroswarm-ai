"""
Governance Coalition Framework
Enables agent coalitions to make collective decisions with advanced voting mechanisms
"""
import asyncio
from dataclasses import dataclass
from typing import Dict, List, Optional, Set
from enum import Enum
from solders.keypair import Keypair
from solders.pubkey import Pubkey


class VotingMethod(Enum):
    """Different voting methods for coalition governance"""
    SIMPLE_MAJORITY = "simple_majority"  # > 50%
    SUPERMAJORITY = "supermajority"      # >= 66.67%
    UNANIMOUS = "unanimous"               # 100%
    QUADRATIC = "quadratic"               # Quadratic voting
    REPUTATION_WEIGHTED = "reputation_weighted"  # Weight by reputation


@dataclass
class GovernanceProposal:
    """Governance proposal for coalition decisions"""
    id: int
    title: str
    description: str
    proposer: str
    proposal_type: str
    voting_method: VotingMethod
    votes_for: Dict[str, float]  # agent_id -> vote_weight
    votes_against: Dict[str, float]
    votes_abstain: Dict[str, float]
    required_threshold: float
    deadline: int
    executed: bool


class GovernanceCoalition:
    """
    Agent coalition with governance capabilities
    
    Manages collective decision-making among agent groups with
    advanced voting mechanisms and reputation systems.
    """
    
    def __init__(
        self,
        name: str,
        members: List[str],
        voting_method: VotingMethod = VotingMethod.REPUTATION_WEIGHTED
    ):
        self.name = name
        self.members: Set[str] = set(members)
        self.voting_method = voting_method
        self.proposals: Dict[int, GovernanceProposal] = {}
        self.reputation: Dict[str, float] = {m: 100.0 for m in members}
        
    def add_member(self, agent_id: str, initial_reputation: float = 100.0):
        """Add new member to coalition"""
        if agent_id not in self.members:
            self.members.add(agent_id)
            self.reputation[agent_id] = initial_reputation
            print(f"👥 Added {agent_id} to coalition '{self.name}'")
    
    def remove_member(self, agent_id: str):
        """Remove member from coalition"""
        if agent_id in self.members:
            self.members.remove(agent_id)
            del self.reputation[agent_id]
            print(f"👋 Removed {agent_id} from coalition '{self.name}'")
    
    def create_proposal(
        self,
        proposer: str,
        title: str,
        description: str,
        proposal_type: str,
        voting_method: Optional[VotingMethod] = None,
        required_threshold: float = 0.667,
        deadline: int = 86400
    ) -> GovernanceProposal:
        """Create a governance proposal"""
        if proposer not in self.members:
            raise ValueError(f"Proposer {proposer} not in coalition")
        
        proposal_id = len(self.proposals)
        proposal = GovernanceProposal(
            id=proposal_id,
            title=title,
            description=description,
            proposer=proposer,
            proposal_type=proposal_type,
            voting_method=voting_method or self.voting_method,
            votes_for={},
            votes_against={},
            votes_abstain={},
            required_threshold=required_threshold,
            deadline=deadline,
            executed=False
        )
        
        self.proposals[proposal_id] = proposal
        print(f"\n📋 Proposal #{proposal_id} created: {title}")
        print(f"   Type: {proposal_type}")
        print(f"   Voting: {proposal.voting_method.value}")
        print(f"   Threshold: {required_threshold:.1%}")
        
        return proposal
    
    def vote(
        self,
        proposal_id: int,
        voter: str,
        vote: str,
        vote_weight: Optional[float] = None
    ):
        """Cast vote on proposal"""
        if proposal_id not in self.proposals:
            raise ValueError(f"Proposal {proposal_id} not found")
        
        if voter not in self.members:
            raise ValueError(f"Voter {voter} not in coalition")
        
        proposal = self.proposals[proposal_id]
        
        # Calculate vote weight based on voting method
        if vote_weight is None:
            vote_weight = self._calculate_vote_weight(voter, proposal.voting_method)
        
        # Record vote
        if vote.lower() == "approve":
            proposal.votes_for[voter] = vote_weight
        elif vote.lower() == "reject":
            proposal.votes_against[voter] = vote_weight
        else:
            proposal.votes_abstain[voter] = vote_weight
        
        print(f"   🗳️  {voter}: {vote.upper()} (weight: {vote_weight:.2f})")
    
    def _calculate_vote_weight(self, voter: str, method: VotingMethod) -> float:
        """Calculate vote weight based on voting method"""
        if method == VotingMethod.SIMPLE_MAJORITY:
            return 1.0
        elif method == VotingMethod.SUPERMAJORITY:
            return 1.0
        elif method == VotingMethod.UNANIMOUS:
            return 1.0
        elif method == VotingMethod.REPUTATION_WEIGHTED:
            # Weight by normalized reputation
            total_reputation = sum(self.reputation.values())
            return self.reputation[voter] / total_reputation * len(self.members)
        elif method == VotingMethod.QUADRATIC:
            # Quadratic voting (simplified)
            return self.reputation[voter] ** 0.5
        return 1.0
    
    def tally_votes(self, proposal_id: int) -> Dict[str, float]:
        """Tally votes and determine outcome"""
        if proposal_id not in self.proposals:
            raise ValueError(f"Proposal {proposal_id} not found")
        
        proposal = self.proposals[proposal_id]
        
        total_for = sum(proposal.votes_for.values())
        total_against = sum(proposal.votes_against.values())
        total_votes = total_for + total_against
        
        if total_votes == 0:
            approval_rate = 0.0
        else:
            approval_rate = total_for / total_votes
        
        passed = approval_rate >= proposal.required_threshold
        
        return {
            "proposal_id": proposal_id,
            "total_for": total_for,
            "total_against": total_against,
            "approval_rate": approval_rate,
            "required_threshold": proposal.required_threshold,
            "passed": passed,
            "voting_method": proposal.voting_method.value
        }
    
    def execute_proposal(self, proposal_id: int) -> bool:
        """Execute approved proposal"""
        tally = self.tally_votes(proposal_id)
        
        if not tally["passed"]:
            print(f"❌ Proposal #{proposal_id} did not pass")
            return False
        
        proposal = self.proposals[proposal_id]
        if proposal.executed:
            print(f"⚠️  Proposal #{proposal_id} already executed")
            return False
        
        proposal.executed = True
        print(f"✅ Executing proposal #{proposal_id}: {proposal.title}")
        
        # Update reputation based on voting alignment
        self._update_reputation(proposal_id, tally["passed"])
        
        return True
    
    def _update_reputation(self, proposal_id: int, outcome: bool):
        """Update member reputation based on voting outcomes"""
        proposal = self.proposals[proposal_id]
        
        for voter in self.members:
            if voter in proposal.votes_for and outcome:
                # Voted for winning side
                self.reputation[voter] += 1.0
            elif voter in proposal.votes_against and not outcome:
                # Voted for winning side
                self.reputation[voter] += 1.0
            elif voter in proposal.votes_for and not outcome:
                # Voted for losing side
                self.reputation[voter] -= 0.5
            elif voter in proposal.votes_against and outcome:
                # Voted for losing side
                self.reputation[voter] -= 0.5
    
    def get_coalition_stats(self) -> Dict:
        """Get coalition statistics"""
        return {
            "name": self.name,
            "total_members": len(self.members),
            "total_proposals": len(self.proposals),
            "voting_method": self.voting_method.value,
            "members": list(self.members),
            "average_reputation": sum(self.reputation.values()) / len(self.reputation) if self.reputation else 0,
            "proposals_executed": sum(1 for p in self.proposals.values() if p.executed)
        }
    
    def generate_report(self) -> str:
        """Generate governance report"""
        stats = self.get_coalition_stats()
        
        lines = [
            "=" * 70,
            f"🏛️  GOVERNANCE COALITION: {self.name}",
            "=" * 70,
            f"\n📊 Statistics:",
            f"   Total Members: {stats['total_members']}",
            f"   Total Proposals: {stats['total_proposals']}",
            f"   Executed: {stats['proposals_executed']}",
            f"   Voting Method: {stats['voting_method']}",
            f"   Avg Reputation: {stats['average_reputation']:.1f}",
            f"\n👥 Members & Reputation:",
        ]
        
        for member in sorted(self.reputation.keys(), key=lambda x: self.reputation[x], reverse=True):
            lines.append(f"   {member[:8]}... : {self.reputation[member]:.1f}")
        
        if self.proposals:
            lines.append(f"\n📋 Recent Proposals:")
            for prop_id in list(self.proposals.keys())[-5:]:  # Last 5
                proposal = self.proposals[prop_id]
                status = "✅ EXECUTED" if proposal.executed else "⏳ PENDING"
                lines.append(f"   #{prop_id}: {proposal.title} ({status})")
        
        lines.extend([
            "\n" + "=" * 70,
        ])
        
        return "\n".join(lines)


async def demo_governance():
    """Demonstrate governance coalition"""
    print("\n" + "=" * 70)
    print("🏛️  AGENT COALITION GOVERNANCE DEMO")
    print("=" * 70)
    
    # Create coalition
    members = ["Agent-A", "Agent-B", "Agent-C", "Agent-D", "Agent-E"]
    coalition = GovernanceCoalition(
        name="DeFi Strategy Council",
        members=members,
        voting_method=VotingMethod.REPUTATION_WEIGHTED
    )
    
    # Create proposal
    proposal = coalition.create_proposal(
        proposer="Agent-A",
        title="Increase position size limits",
        description="Raise max position from 100 SOL to 200 SOL",
        proposal_type="parameter_change",
        voting_method=VotingMethod.SUPERMAJORITY,
        required_threshold=0.667
    )
    
    # Members vote
    print(f"\n🗳️  Voting:")
    coalition.vote(proposal.id, "Agent-A", "approve")
    coalition.vote(proposal.id, "Agent-B", "approve")
    coalition.vote(proposal.id, "Agent-C", "reject")
    coalition.vote(proposal.id, "Agent-D", "approve")
    coalition.vote(proposal.id, "Agent-E", "approve")
    
    # Tally and execute
    print(f"\n📊 Results:")
    tally = coalition.tally_votes(proposal.id)
    print(f"   For: {tally['total_for']:.2f}")
    print(f"   Against: {tally['total_against']:.2f}")
    print(f"   Approval: {tally['approval_rate']:.1%}")
    print(f"   Status: {'✅ PASSED' if tally['passed'] else '❌ FAILED'}")
    
    if tally["passed"]:
        coalition.execute_proposal(proposal.id)
    
    # Generate report
    print(f"\n{coalition.generate_report()}")


if __name__ == "__main__":
    asyncio.run(demo_governance())
