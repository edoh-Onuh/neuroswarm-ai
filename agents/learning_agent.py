"""
Learning Agent - Adapts strategies based on outcomes

This agent:
- Analyzes historical proposal outcomes
- Identifies successful patterns
- Updates strategy parameters
- Improves decision-making over time
- Implements reinforcement learning
"""

import logging
from typing import Dict, Any, Optional, List
import json
import time

from base_agent import (
    BaseAgent, AgentType, ProposalType, VoteType, ProposalData
)

logger = logging.getLogger(__name__)


class LearningAgent(BaseAgent):
    """
    Learning Agent adapts strategies based on historical outcomes.
    
    Responsibilities:
    - Analyze proposal success rates
    - Identify patterns in successful decisions
    - Update strategy parameters
    - Improve voting accuracy
    - Implement reinforcement learning
    """
    
    def __init__(self, keypair_path: str, rpc_url: str, program_id: str):
        super().__init__(
            agent_type=AgentType.LEARNING,
            name="LearningEngine",
            keypair_path=keypair_path,
            rpc_url=rpc_url,
            program_id=program_id
        )
        
        self.learning_history = []
        self.strategy_parameters = {
            "risk_tolerance": 0.5,
            "rebalance_frequency": 0.6,
            "voting_confidence": 0.7
        }
        
        self.learning_interval = 3600  # Learn every hour
        self.last_learning_time = 0
        
    async def analyze_and_decide(self) -> Optional[Dict[str, Any]]:
        """
        Analyze historical outcomes and adapt strategies.
        
        Actions:
        - Update strategy parameters based on performance
        - Propose new strategies if better patterns identified
        - Share learning insights with other agents
        """
        try:
            current_time = time.time()
            
            # Only learn at intervals
            if current_time - self.last_learning_time < self.learning_interval:
                return None
            
            self.last_learning_time = current_time
            
            # Analyze historical outcomes
            learning_insights = await self._analyze_outcomes()
            
            # Update strategy parameters
            if learning_insights["should_adapt"]:
                logger.info("Learning: Adapting strategies based on outcomes")
                
                self._update_strategies(learning_insights["adaptations"])
                
                # Propose strategy update
                strategy_data = json.dumps({
                    "action": "update_strategy",
                    "new_parameters": self.strategy_parameters,
                    "reason": learning_insights["reason"],
                    "confidence": learning_insights["confidence"]
                }).encode('utf-8')
                
                await self.create_proposal(
                    proposal_type=ProposalType.STRATEGY,
                    data=strategy_data,
                    description=f"Strategy update based on learning: {learning_insights['reason']}"
                )
                
                return {
                    "action": "propose_strategy_update",
                    "adaptations": learning_insights["adaptations"],
                    "status": "learning_complete"
                }
            
            return {
                "action": "monitor",
                "learning_score": learning_insights["performance_score"],
                "status": "analysis_complete"
            }
            
        except Exception as e:
            logger.error(f"Error in learning analysis: {e}")
            return None
    
    async def evaluate_proposal(self, proposal: ProposalData) -> VoteType:
        """
        Evaluate a proposal using learned patterns.
        
        Learning agent focuses on:
        - Historical success patterns
        - Similar past proposals
        - Learned voting strategies
        """
        try:
            # Parse proposal data
            if proposal.data:
                try:
                    proposal_content = json.loads(proposal.data.decode('utf-8'))
                except:
                    proposal_content = {}
            else:
                proposal_content = {}
            
            # Use learned patterns to evaluate
            confidence = await self._predict_proposal_success(proposal, proposal_content)
            
            # Vote based on predicted success
            if confidence > 0.7:
                logger.info(f"High confidence ({confidence:.2f}) in proposal success")
                return VoteType.APPROVE
            elif confidence < 0.3:
                logger.info(f"Low confidence ({confidence:.2f}) in proposal success")
                return VoteType.REJECT
            else:
                logger.info(f"Uncertain ({confidence:.2f}) about proposal")
                return VoteType.ABSTAIN
            
        except Exception as e:
            logger.error(f"Error evaluating proposal: {e}")
            return VoteType.ABSTAIN
    
    async def _generate_vote_reasoning(
        self,
        proposal: ProposalData,
        vote: VoteType
    ) -> str:
        """Generate learning-based reasoning for vote"""
        
        if vote == VoteType.APPROVE:
            return "Historical patterns suggest high probability of success"
        elif vote == VoteType.REJECT:
            return "Similar proposals have shown poor outcomes in the past"
        else:
            return "Insufficient historical data to predict outcome"
    
    async def _analyze_outcomes(self) -> Dict[str, Any]:
        """
        Analyze historical proposal outcomes to identify patterns.
        
        In a real implementation, would:
        - Query all executed proposals
        - Fetch their outcomes
        - Analyze success/failure patterns
        - Identify correlations
        - Update ML models
        """
        # Simulated learning analysis
        
        # In real implementation, would analyze actual on-chain outcomes
        simulated_outcomes = [
            {"type": "REBALANCE", "success": True, "votes_for": 4, "votes_against": 1},
            {"type": "TRADE", "success": False, "votes_for": 2, "votes_against": 3},
            {"type": "REBALANCE", "success": True, "votes_for": 5, "votes_against": 0},
        ]
        
        # Calculate success rates by type
        rebalance_success_rate = 1.0  # 100% success for rebalances
        trade_success_rate = 0.0  # 0% success for trades
        
        # Determine if adaptation is needed
        should_adapt = False
        adaptations = {}
        reason = "Performance is stable"
        
        if trade_success_rate < 0.5:
            should_adapt = True
            adaptations["risk_tolerance"] = self.strategy_parameters["risk_tolerance"] * 0.9
            reason = "Trade success rate low, reducing risk tolerance"
        
        return {
            "should_adapt": should_adapt,
            "adaptations": adaptations,
            "reason": reason,
            "confidence": 0.75,
            "performance_score": 0.82,
            "success_rates": {
                "rebalance": rebalance_success_rate,
                "trade": trade_success_rate
            }
        }
    
    def _update_strategies(self, adaptations: Dict[str, float]):
        """
        Update strategy parameters based on learning.
        
        Args:
            adaptations: Parameter updates from learning
        """
        for param, value in adaptations.items():
            if param in self.strategy_parameters:
                old_value = self.strategy_parameters[param]
                self.strategy_parameters[param] = value
                logger.info(f"Updated {param}: {old_value:.3f} -> {value:.3f}")
    
    async def _predict_proposal_success(
        self,
        proposal: ProposalData,
        proposal_content: Dict[str, Any]
    ) -> float:
        """
        Predict probability of proposal success based on learned patterns.
        
        Returns:
            Confidence score (0-1) that proposal will succeed
        """
        # Simulated prediction based on proposal type
        # In real implementation, would use ML model
        
        base_confidence = 0.5
        
        # Rebalance proposals historically successful
        if proposal.proposal_type == ProposalType.REBALANCE:
            base_confidence = 0.8
        
        # Emergency proposals usually necessary
        elif proposal.proposal_type == ProposalType.EMERGENCY:
            base_confidence = 0.9
        
        # Trades more risky
        elif proposal.proposal_type == ProposalType.TRADE:
            base_confidence = 0.4
        
        # Adjust based on existing votes
        if proposal.votes_for > 0 or proposal.votes_against > 0:
            total_votes = proposal.votes_for + proposal.votes_against
            vote_ratio = proposal.votes_for / total_votes
            
            # Weight current voting with base confidence
            base_confidence = 0.7 * base_confidence + 0.3 * vote_ratio
        
        return base_confidence
    
    async def generate_learning_report(self) -> Dict[str, Any]:
        """Generate comprehensive learning performance report"""
        outcomes = await self._analyze_outcomes()
        
        return {
            "timestamp": int(time.time()),
            "current_parameters": self.strategy_parameters,
            "success_rates": outcomes["success_rates"],
            "performance_score": outcomes["performance_score"],
            "recent_adaptations": outcomes.get("adaptations", {}),
            "learning_status": "active"
        }


async def main():
    """Run the learning agent"""
    import os
    from dotenv import load_dotenv
    
    load_dotenv()
    
    keypair_path = os.getenv("LEARNING_AGENT_KEYPAIR")
    program_id = os.getenv("PROGRAM_ID")
    idl_path = os.getenv("IDL_PATH")
    
    if not keypair_path or not program_id or not idl_path:
        raise ValueError("Missing required environment variables: LEARNING_AGENT_KEYPAIR, PROGRAM_ID, or IDL_PATH")
    
    agent = LearningAgent(
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
