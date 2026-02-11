"""
Analytics Agent - Analyzes on-chain data and market conditions

This agent:
- Monitors Solana DeFi protocols (Jupiter, Orca, Raydium)
- Analyzes market trends and liquidity
- Generates insights for portfolio management
- Proposes rebalancing strategies based on data
"""

import logging
from typing import Dict, Any, Optional, List
import json
import time

from base_agent import (
    BaseAgent, AgentType, ProposalType, VoteType, ProposalData
)

logger = logging.getLogger(__name__)


class AnalyticsAgent(BaseAgent):
    """
    Analytics Agent analyzes on-chain data and market conditions.
    
    Responsibilities:
    - Monitor DEX liquidity and volumes
    - Track token prices and trends
    - Analyze portfolio performance
    - Generate market insights
    - Propose data-driven rebalancing strategies
    """
    
    def __init__(self, keypair_path: str, rpc_url: str, program_id: str):
        super().__init__(
            agent_type=AgentType.ANALYTICS,
            name="AnalyticsEngine",
            keypair_path=keypair_path,
            rpc_url=rpc_url,
            program_id=program_id
        )
        
        self.market_data_cache = {}
        self.analysis_interval = 300  # Analyze every 5 minutes
        self.last_analysis_time = 0
        
        # Thresholds for triggering proposals
        self.rebalance_threshold = 0.15  # 15% deviation triggers rebalance
        self.volatility_threshold = 0.25  # 25% volatility is high
        
    async def analyze_and_decide(self) -> Optional[Dict[str, Any]]:
        """
        Analyze market conditions and decide on actions.
        
        Actions:
        - Propose rebalancing if portfolio drifts from targets
        - Alert on high volatility conditions
        - Suggest new investment opportunities
        """
        try:
            current_time = time.time()
            
            # Only analyze at intervals
            if current_time - self.last_analysis_time < self.analysis_interval:
                return None
            
            self.last_analysis_time = current_time
            
            # Fetch market data
            market_data = await self._fetch_market_data()
            
            # Analyze portfolio (simulated for now)
            portfolio_analysis = await self._analyze_portfolio(market_data)
            
            # Check if rebalancing is needed
            if portfolio_analysis["needs_rebalance"]:
                logger.info("Analytics: Portfolio drift detected, proposing rebalance")
                
                # Create rebalance proposal
                rebalance_data = json.dumps({
                    "action": "rebalance",
                    "current_allocation": portfolio_analysis["current"],
                    "target_allocation": portfolio_analysis["target"],
                    "reason": "Portfolio drift exceeded threshold"
                }).encode('utf-8')
                
                await self.create_proposal(
                    proposal_type=ProposalType.REBALANCE,
                    data=rebalance_data,
                    description=f"Rebalance portfolio: drift = {portfolio_analysis['drift']:.2%}"
                )
                
                return {
                    "action": "propose_rebalance",
                    "drift": portfolio_analysis["drift"],
                    "status": "analysis_complete"
                }
            
            return {
                "action": "monitor",
                "market_conditions": "stable",
                "status": "analysis_complete"
            }
            
        except Exception as e:
            logger.error(f"Error in analytics: {e}")
            return None
    
    async def evaluate_proposal(self, proposal: ProposalData) -> VoteType:
        """
        Evaluate a proposal from an analytics perspective.
        
        Analytics agent focuses on:
        - Data-driven decision making
        - Market conditions alignment
        - Risk/reward analysis
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
            
            # Rebalance proposals: check if backed by data
            if proposal.proposal_type == ProposalType.REBALANCE:
                if "current_allocation" in proposal_content:
                    logger.info("Rebalance proposal has valid data structure")
                    
                    # Verify the rebalance makes sense
                    market_conditions = await self._fetch_market_data()
                    
                    # In real implementation, would validate against current market
                    return VoteType.APPROVE
                else:
                    logger.warning("Rebalance proposal lacks allocation data")
                    return VoteType.REJECT
            
            # Trade proposals: analyze market conditions
            elif proposal.proposal_type == ProposalType.TRADE:
                # Check if market conditions support the trade
                market_data = await self._fetch_market_data()
                
                # Simplified: approve trades during stable conditions
                if market_data.get("volatility", 0) < self.volatility_threshold:
                    return VoteType.APPROVE
                else:
                    logger.warning("Market volatility too high for new trades")
                    return VoteType.REJECT
            
            # Strategy changes: need strong justification
            elif proposal.proposal_type == ProposalType.STRATEGY:
                if len(proposal.description) > 50:  # Has detailed explanation
                    return VoteType.APPROVE
                else:
                    return VoteType.ABSTAIN
            
            # Default: approve if reasonable
            return VoteType.APPROVE
            
        except Exception as e:
            logger.error(f"Error evaluating proposal: {e}")
            return VoteType.ABSTAIN
    
    async def _generate_vote_reasoning(
        self,
        proposal: ProposalData,
        vote: VoteType
    ) -> str:
        """Generate data-driven reasoning for vote"""
        
        if vote == VoteType.APPROVE:
            return f"Data analysis supports this {proposal.proposal_type.name} action"
        elif vote == VoteType.REJECT:
            return f"Market data suggests {proposal.proposal_type.name} is suboptimal"
        else:
            return "Insufficient data to validate proposal"
    
    async def _fetch_market_data(self) -> Dict[str, Any]:
        """
        Fetch real-time market data from Solana DeFi protocols.
        
        In a real implementation, would:
        - Query Jupiter for token prices
        - Check Orca pools for liquidity
        - Monitor Raydium volumes
        - Track on-chain metrics
        """
        # Simulated market data for demonstration
        return {
            "SOL_price": 100.0,  # USD
            "liquidity_depth": 1000000,  # USD
            "24h_volume": 5000000,  # USD
            "volatility": 0.15,  # 15%
            "trend": "stable",
            "timestamp": int(time.time())
        }
    
    async def _analyze_portfolio(
        self,
        market_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Analyze current portfolio vs targets.
        
        Returns:
            Analysis results including drift and rebalance needs
        """
        # Simulated portfolio analysis
        # In real implementation, would query actual token balances
        
        current_allocation = {
            "SOL": 0.65,  # 65% in SOL
            "USDC": 0.35  # 35% in USDC
        }
        
        target_allocation = {
            "SOL": 0.60,  # Target 60% SOL
            "USDC": 0.40  # Target 40% USDC
        }
        
        # Calculate drift
        drift = abs(current_allocation["SOL"] - target_allocation["SOL"])
        
        needs_rebalance = drift > self.rebalance_threshold
        
        return {
            "current": current_allocation,
            "target": target_allocation,
            "drift": drift,
            "needs_rebalance": needs_rebalance,
            "timestamp": int(time.time())
        }
    
    async def generate_market_report(self) -> Dict[str, Any]:
        """Generate comprehensive market analysis report"""
        market_data = await self._fetch_market_data()
        
        return {
            "timestamp": int(time.time()),
            "market_conditions": {
                "sol_price": market_data["SOL_price"],
                "volatility": market_data["volatility"],
                "trend": market_data["trend"]
            },
            "recommendations": [
                "Market conditions are stable, suitable for rebalancing",
                "Liquidity depth is healthy"
            ]
        }


async def main():
    """Run the analytics agent"""
    import os
    from dotenv import load_dotenv
    
    load_dotenv()
    
    keypair_path = os.getenv("ANALYTICS_AGENT_KEYPAIR")
    program_id = os.getenv("PROGRAM_ID")
    idl_path = os.getenv("IDL_PATH")
    
    if not keypair_path or not program_id or not idl_path:
        raise ValueError("Missing required environment variables: ANALYTICS_AGENT_KEYPAIR, PROGRAM_ID, or IDL_PATH")
    
    agent = AnalyticsAgent(
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
