"""
Consensus Agent - Coordinates decision-making across the swarm

This agent:
- Monitors voting patterns and proposal outcomes
- Ensures Byzantine fault tolerance in decisions
- Coordinates conflict resolution between agents
- Initiates emergency actions if needed
"""

import logging
from typing import Dict, Any, Optional
import json
import time

from base_agent import (
    BaseAgent, AgentType, ProposalType, VoteType, ProposalData
)

logger = logging.getLogger(__name__)


class ConsensusAgent(BaseAgent):
    """
    Consensus Agent coordinates decision-making across the swarm.
    
    Responsibilities:
    - Monitor proposal voting progress
    - Detect and resolve voting conflicts
    - Ensure quorum is reached
    - Coordinate emergency actions
    - Maintain Byzantine fault tolerance
    """
    
    def __init__(self, keypair_path: str, rpc_url: str, program_id: str):
        super().__init__(
            agent_type=AgentType.CONSENSUS,
            name="ConsensusCoordinator",
            keypair_path=keypair_path,
            rpc_url=rpc_url,
            program_id=program_id
        )
        
        self.voting_history = []
        self.conflict_threshold = 0.4  # Flag if votes are within 40% split
        
    async def analyze_and_decide(self) -> Optional[Dict[str, Any]]:
        """
        Analyze swarm coordination and decide on actions.
        
        Actions:
        - Create emergency proposals if consensus is broken
        - Coordinate with other agents for complex decisions
        - Monitor for Byzantine behavior
        """
        try:
            # Get active proposals
            active_proposals = await self.get_active_proposals()
            
            for proposal_pda in active_proposals:
                proposal = await self.get_proposal(proposal_pda)
                
                if not proposal:
                    continue
                
                # Check if voting is stalled or conflicted
                total_votes = (
                    proposal.votes_for + 
                    proposal.votes_against + 
                    proposal.votes_abstain
                )
                
                if total_votes > 0:
                    # Calculate vote distribution
                    for_ratio = proposal.votes_for / total_votes
                    against_ratio = proposal.votes_against / total_votes
                    
                    # Detect conflict (close vote)
                    if abs(for_ratio - against_ratio) < self.conflict_threshold:
                        logger.warning(
                            f"Detected voting conflict on proposal: {proposal.description}"
                        )
                        logger.info(
                            f"Votes: {proposal.votes_for} for, "
                            f"{proposal.votes_against} against"
                        )
                        
                        # In a real system, might create a new proposal to resolve
                        # or gather more data from analytics agent
            
            return {
                "action": "monitor",
                "active_proposals": len(active_proposals),
                "status": "coordinating"
            }
            
        except Exception as e:
            logger.error(f"Error in consensus analysis: {e}")
            return None
    
    async def evaluate_proposal(self, proposal: ProposalData) -> VoteType:
        """
        Evaluate a proposal from a consensus perspective.
        
        Consensus agent focuses on:
        - Whether the proposal follows proper procedure
        - If it maintains system integrity
        - Byzantine fault tolerance considerations
        """
        try:
            # Emergency proposals get high priority
            if proposal.proposal_type == ProposalType.EMERGENCY:
                logger.info("Emergency proposal detected, approving by default")
                return VoteType.APPROVE
            
            # Check if proposal has proper structure
            if not proposal.description or len(proposal.description) < 10:
                logger.warning("Proposal has insufficient description")
                return VoteType.REJECT
            
            # Check weighted voting patterns
            if proposal.weighted_votes_for > 0 or proposal.weighted_votes_against > 0:
                # If there's already strong consensus, align with it
                if proposal.weighted_votes_for > proposal.weighted_votes_against * 2:
                    return VoteType.APPROVE
                elif proposal.weighted_votes_against > proposal.weighted_votes_for * 2:
                    return VoteType.REJECT
            
            # Default: approve well-formed proposals to maintain progress
            return VoteType.APPROVE
            
        except Exception as e:
            logger.error(f"Error evaluating proposal: {e}")
            return VoteType.ABSTAIN
    
    async def _generate_vote_reasoning(
        self,
        proposal: ProposalData,
        vote: VoteType
    ) -> str:
        """Generate reasoning for vote from consensus perspective"""
        
        if vote == VoteType.APPROVE:
            if proposal.proposal_type == ProposalType.EMERGENCY:
                return "Emergency action approved for system protection"
            else:
                return "Proposal maintains system integrity and follows proper procedure"
        
        elif vote == VoteType.REJECT:
            return "Proposal lacks sufficient detail or violates consensus rules"
        
        else:
            return "Insufficient information to make informed decision"
    
    async def detect_byzantine_behavior(self) -> bool:
        """
        Detect potential Byzantine (malicious) agent behavior.
        
        Looks for patterns like:
        - Agents consistently voting against successful proposals
        - Agents creating spam proposals
        - Suspicious voting patterns
        
        Returns:
            True if Byzantine behavior detected
        """
        # In a real implementation, would analyze voting history
        # and agent behavior patterns
        return False
    
    async def coordinate_emergency_action(self, reason: str):
        """
        Create an emergency proposal for immediate action.
        
        Args:
            reason: Why emergency action is needed
        """
        try:
            emergency_data = json.dumps({
                "action": "emergency_stop",
                "reason": reason,
                "timestamp": int(time.time())
            }).encode('utf-8')
            
            await self.create_proposal(
                proposal_type=ProposalType.EMERGENCY,
                data=emergency_data,
                description=f"EMERGENCY: {reason}"
            )
            
            logger.critical(f"Emergency proposal created: {reason}")
            
        except Exception as e:
            logger.error(f"Failed to create emergency proposal: {e}")


async def main():
    """Run the consensus agent"""
    import os
    from dotenv import load_dotenv
    
    load_dotenv()
    
    keypair_path = os.getenv("CONSENSUS_AGENT_KEYPAIR")
    program_id = os.getenv("PROGRAM_ID")
    idl_path = os.getenv("IDL_PATH")
    
    if not keypair_path or not program_id or not idl_path:
        raise ValueError("Missing required environment variables: CONSENSUS_AGENT_KEYPAIR, PROGRAM_ID, or IDL_PATH")
    
    agent = ConsensusAgent(
        keypair_path=keypair_path,
        rpc_url=os.getenv("RPC_URL", "https://api.devnet.solana.com"),
        program_id=program_id
    )
    
    # Initialize and register
    await agent.initialize(idl_path)
    
    try:
        await agent.register()
    except Exception as e:
        logger.info(f"Agent already registered: {e}")
    
    # Start autonomous operation
    await agent.run()


if __name__ == "__main__":
    import asyncio
    asyncio.run(main())
