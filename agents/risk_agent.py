"""
Risk Management Agent - Monitors and enforces risk parameters

This agent:
- Monitors portfolio risk metrics
- Enforces position limits and stop-losses
- Can veto high-risk proposals
- Creates emergency proposals when risk limits breached
- Ensures capital preservation
"""

import logging
from typing import Dict, Any, List, Optional
import json
import time

import aiohttp
from aiohttp import ClientTimeout

from base_agent import (
    BaseAgent, AgentType, ProposalType, VoteType, ProposalData
)

_HTTP_TIMEOUT = ClientTimeout(total=15)
_JUPITER_PRICE = "https://api.jup.ag/price/v2"
_SOL_MINT = "So11111111111111111111111111111111111111112"
_USDC_MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"
_LAMPORTS_PER_SOL = 1_000_000_000

logger = logging.getLogger(__name__)


class RiskManagementAgent(BaseAgent):
    """
    Risk Management Agent monitors and enforces risk parameters.
    
    Responsibilities:
    - Monitor portfolio risk metrics
    - Enforce maximum drawdown limits
    - Veto high-risk proposals
    - Create emergency stop proposals
    - Maintain capital preservation
    """
    
    def __init__(self, keypair_path: str, rpc_url: str, program_id: str):
        super().__init__(
            agent_type=AgentType.RISK_MANAGEMENT,
            name="RiskGuardian",
            keypair_path=keypair_path,
            rpc_url=rpc_url,
            program_id=program_id
        )
        
        # Risk parameters
        self.max_drawdown = 0.20  # Maximum 20% drawdown
        self.max_position_size = 0.30  # Max 30% in single position
        self.max_leverage = 1.0  # No leverage allowed
        self.min_liquidity_ratio = 0.20  # Keep 20% in stablecoins
        
        # Risk monitoring
        self.risk_check_interval = 60  # Check every minute
        self.last_risk_check = 0
        self.emergency_stop_triggered = False

        # Tracking for drawdown calculation
        self._peak_portfolio_value: float = 0.0
        self._portfolio_history: List[float] = []
        self._session: Optional[aiohttp.ClientSession] = None
        
    async def analyze_and_decide(self) -> Optional[Dict[str, Any]]:
        """
        Analyze risk metrics and decide on actions.
        
        Actions:
        - Create emergency proposals if risk limits breached
        - Propose risk limit updates based on conditions
        - Alert on approaching risk thresholds
        """
        try:
            current_time = time.time()
            
            # Check risk at intervals
            if current_time - self.last_risk_check < self.risk_check_interval:
                return None
            
            self.last_risk_check = current_time
            
            # Calculate current risk metrics
            risk_metrics = await self._calculate_risk_metrics()
            
            # Check for risk limit breaches
            if risk_metrics["current_drawdown"] > self.max_drawdown:
                logger.critical(
                    f"RISK ALERT: Drawdown {risk_metrics['current_drawdown']:.2%} "
                    f"exceeds limit {self.max_drawdown:.2%}"
                )
                
                if not self.emergency_stop_triggered:
                    # Create emergency stop proposal
                    emergency_data = json.dumps({
                        "action": "emergency_stop",
                        "reason": "Maximum drawdown exceeded",
                        "drawdown": risk_metrics["current_drawdown"],
                        "limit": self.max_drawdown
                    }).encode('utf-8')
                    
                    await self.create_proposal(
                        proposal_type=ProposalType.EMERGENCY,
                        data=emergency_data,
                        description=f"EMERGENCY STOP: Drawdown {risk_metrics['current_drawdown']:.2%}"
                    )
                    
                    self.emergency_stop_triggered = True
                    
                    return {
                        "action": "emergency_stop",
                        "reason": "drawdown_exceeded",
                        "status": "critical"
                    }
            
            # Check position concentration
            if risk_metrics["max_position_pct"] > self.max_position_size:
                logger.warning(
                    f"Position concentration warning: {risk_metrics['max_position_pct']:.2%}"
                )
                
                # Propose risk limit adjustment
                risk_limit_data = json.dumps({
                    "action": "reduce_position",
                    "position": risk_metrics["largest_position"],
                    "current_size": risk_metrics["max_position_pct"],
                    "target_size": self.max_position_size
                }).encode('utf-8')
                
                await self.create_proposal(
                    proposal_type=ProposalType.RISK_LIMIT,
                    data=risk_limit_data,
                    description=f"Reduce position concentration to {self.max_position_size:.0%}"
                )
                
                return {
                    "action": "propose_risk_reduction",
                    "concentration": risk_metrics["max_position_pct"],
                    "status": "warning"
                }
            
            return {
                "action": "monitor",
                "risk_level": "normal",
                "drawdown": risk_metrics["current_drawdown"],
                "status": "healthy"
            }
            
        except Exception as e:
            logger.error(f"Error in risk analysis: {e}")
            return None
    
    async def evaluate_proposal(self, proposal: ProposalData) -> VoteType:
        """
        Evaluate a proposal from a risk management perspective.
        
        Risk agent focuses on:
        - Capital preservation
        - Risk limit compliance
        - Downside protection
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
            
            # Emergency proposals: always approve (safety first)
            if proposal.proposal_type == ProposalType.EMERGENCY:
                logger.info("Emergency proposal: Approving for safety")
                return VoteType.APPROVE
            
            # Trade proposals: verify risk parameters
            if proposal.proposal_type == ProposalType.TRADE:
                # Check if trade violates risk limits
                trade_size = proposal_content.get("size", 0)
                
                if trade_size > self.max_position_size:
                    logger.warning(
                        f"Trade size {trade_size:.2%} exceeds limit {self.max_position_size:.2%}"
                    )
                    return VoteType.REJECT
                
                # Check if trade uses leverage
                leverage = proposal_content.get("leverage", 1.0)
                if leverage > self.max_leverage:
                    logger.warning(f"Leverage {leverage}x exceeds limit {self.max_leverage}x")
                    return VoteType.REJECT
                
                return VoteType.APPROVE
            
            # Rebalance proposals: ensure they improve risk profile
            if proposal.proposal_type == ProposalType.REBALANCE:
                target_allocation = proposal_content.get("target_allocation", {})
                
                # Check if maintains liquidity requirements
                stablecoin_pct = target_allocation.get("USDC", 0)
                if stablecoin_pct < self.min_liquidity_ratio:
                    logger.warning(
                        f"Insufficient liquidity: {stablecoin_pct:.2%} < {self.min_liquidity_ratio:.2%}"
                    )
                    return VoteType.REJECT
                
                # Check position concentration
                max_position = max(target_allocation.values()) if target_allocation else 0
                if max_position > self.max_position_size:
                    logger.warning(f"Position too concentrated: {max_position:.2%}")
                    return VoteType.REJECT
                
                return VoteType.APPROVE
            
            # Strategy changes: conservative approach
            if proposal.proposal_type == ProposalType.STRATEGY:
                # Need strong justification for strategy changes
                if len(proposal.description) > 100:
                    return VoteType.APPROVE
                else:
                    return VoteType.ABSTAIN
            
            # Risk limit proposals: evaluate carefully
            if proposal.proposal_type == ProposalType.RISK_LIMIT:
                # Generally approve risk reduction measures
                if "reduce" in proposal.description.lower():
                    return VoteType.APPROVE
                else:
                    return VoteType.ABSTAIN
            
            # Default: abstain on unknown proposal types
            return VoteType.ABSTAIN
            
        except Exception as e:
            logger.error(f"Error evaluating proposal: {e}")
            return VoteType.ABSTAIN
    
    async def _generate_vote_reasoning(
        self,
        proposal: ProposalData,
        vote: VoteType
    ) -> str:
        """Generate risk-focused reasoning for vote"""
        
        if vote == VoteType.APPROVE:
            return f"Proposal complies with risk parameters and protects capital"
        elif vote == VoteType.REJECT:
            return f"Proposal violates risk limits or threatens capital preservation"
        else:
            return "Insufficient information to assess risk impact"
    
    # ------------------------------------------------------------------
    # Real data helpers
    # ------------------------------------------------------------------

    async def _get_session(self) -> aiohttp.ClientSession:
        """Lazy-init a shared HTTP session."""
        if self._session is None or self._session.closed:
            self._session = aiohttp.ClientSession(timeout=_HTTP_TIMEOUT)
        return self._session

    async def _get_sol_price(self) -> float:
        """Fetch live SOL/USD price from Jupiter Price API v2."""
        try:
            session = await self._get_session()
            async with session.get(
                _JUPITER_PRICE, params={"ids": _SOL_MINT}
            ) as resp:
                if resp.status != 200:
                    logger.warning("Jupiter price API returned %s", resp.status)
                    return 0.0
                body = await resp.json()
                entry = body.get("data", {}).get(_SOL_MINT)
                if entry and entry.get("price"):
                    return float(entry["price"])
        except Exception as exc:
            logger.warning("Failed to fetch SOL price: %s", exc)
        return 0.0

    async def _get_sol_balance(self) -> float:
        """Query the agent's SOL balance via Solana RPC."""
        try:
            resp = await self.client.get_balance(self.keypair.pubkey())
            lamports = resp.value
            return lamports / _LAMPORTS_PER_SOL
        except Exception as exc:
            logger.warning("Failed to fetch SOL balance: %s", exc)
            return 0.0

    async def _calculate_risk_metrics(self) -> Dict[str, Any]:
        """
        Calculate portfolio risk metrics using real on-chain data.

        Queries:
        - SOL balance from Solana RPC
        - SOL/USD price from Jupiter Price API v2
        Computes:
        - Portfolio value in USD
        - Current drawdown from peak
        - Position concentration (SOL vs stablecoins)
        - Simple historical volatility
        """
        sol_balance = await self._get_sol_balance()
        sol_price = await self._get_sol_price()

        # Portfolio valuation
        sol_value_usd = sol_balance * sol_price if sol_price else 0.0
        # Assume remaining value is in stablecoins (no SPL token query yet)
        total_value = sol_value_usd  # extend when SPL token balances added

        # Track peak for drawdown
        if total_value > self._peak_portfolio_value:
            self._peak_portfolio_value = total_value

        current_drawdown = 0.0
        if self._peak_portfolio_value > 0:
            current_drawdown = (
                1.0 - total_value / self._peak_portfolio_value
            )

        # Position concentration (SOL fraction of portfolio)
        sol_pct = 1.0 if total_value > 0 else 0.0  # all SOL for now

        # Historical volatility from recent snapshots
        self._portfolio_history.append(total_value)
        if len(self._portfolio_history) > 100:
            self._portfolio_history = self._portfolio_history[-100:]

        volatility = 0.0
        if len(self._portfolio_history) >= 2:
            returns = []
            for i in range(1, len(self._portfolio_history)):
                prev = self._portfolio_history[i - 1]
                curr = self._portfolio_history[i]
                if prev > 0:
                    returns.append((curr - prev) / prev)
            if returns:
                mean_r = sum(returns) / len(returns)
                variance = sum((r - mean_r) ** 2 for r in returns) / len(returns)
                volatility = variance ** 0.5

        return {
            "current_drawdown": max(current_drawdown, 0.0),
            "max_position_pct": sol_pct,
            "largest_position": "SOL",
            "sol_balance": sol_balance,
            "sol_price_usd": sol_price,
            "portfolio_value_usd": total_value,
            "volatility": volatility,
            "liquidity_ratio": 1.0 - sol_pct,  # non-SOL fraction
            "timestamp": int(time.time()),
        }
    
    async def generate_risk_report(self) -> Dict[str, Any]:
        """Generate comprehensive risk report"""
        metrics = await self._calculate_risk_metrics()
        
        return {
            "timestamp": int(time.time()),
            "risk_metrics": metrics,
            "limits": {
                "max_drawdown": self.max_drawdown,
                "max_position_size": self.max_position_size,
                "min_liquidity_ratio": self.min_liquidity_ratio
            },
            "status": "healthy" if metrics["current_drawdown"] < self.max_drawdown else "critical",
            "alerts": []
        }

    async def close(self) -> None:
        """Release HTTP session and RPC client."""
        if self._session and not self._session.closed:
            await self._session.close()
        await super().close()


async def main():
    """Run the risk management agent"""
    import os
    from dotenv import load_dotenv
    
    load_dotenv()
    
    keypair_path = os.getenv("RISK_AGENT_KEYPAIR")
    program_id = os.getenv("PROGRAM_ID")
    idl_path = os.getenv("IDL_PATH")
    
    if not keypair_path or not program_id or not idl_path:
        raise ValueError("Missing required environment variables: RISK_AGENT_KEYPAIR, PROGRAM_ID, or IDL_PATH")
    
    agent = RiskManagementAgent(
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
