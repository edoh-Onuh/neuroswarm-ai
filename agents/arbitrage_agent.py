"""
Arbitrage Agent - Advanced Feature
Identifies arbitrage opportunities by comparing Jupiter quotes across routes.

Uses Jupiter Swap API v1 for real-time price discovery via swap quotes.
"""

import asyncio
import logging
from typing import Dict, List, Optional, Tuple
from datetime import datetime
import aiohttp

logger = logging.getLogger(__name__)

_HTTP_TIMEOUT = aiohttp.ClientTimeout(total=15)
_JUPITER_QUOTE = "https://api.jup.ag/swap/v1/quote"
_JUPITER_PRICE = "https://api.jup.ag/price/v2"

# Token mint addresses on Solana
_TOKENS = {
    "SOL": "So11111111111111111111111111111111111111112",
    "USDC": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
    "USDT": "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB",
    "BONK": "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263",
    "JUP": "JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN",
    "RAY": "4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R",
}


class ArbitrageAgent:
    """
    Specialized agent for finding arbitrage opportunities.

    Compares Jupiter quote outputs for forward and reverse swaps
    to detect price inefficiencies across DEX routes.
    """

    def __init__(self, agent_name: str = "Arbitrage Hunter", program_id: Optional[str] = None):
        self.agent_name = agent_name
        self.program_id = program_id
        self.is_registered = False
        self.min_profit_bps = 50   # Minimum 0.5% profit
        self.max_slippage_bps = 100  # Maximum 1% slippage
        self._session: Optional[aiohttp.ClientSession] = None

    async def _get_session(self) -> aiohttp.ClientSession:
        if self._session is None or self._session.closed:
            self._session = aiohttp.ClientSession(timeout=_HTTP_TIMEOUT)
        return self._session

    async def close(self) -> None:
        if self._session and not self._session.closed:
            await self._session.close()
            self._session = None

    # ── price fetching via Jupiter ───────────────────────────────

    async def get_price(self, token: str) -> Optional[float]:
        """Get USD price for a token from Jupiter Price API v2."""
        mint = _TOKENS.get(token)
        if not mint:
            return None
        try:
            session = await self._get_session()
            async with session.get(_JUPITER_PRICE, params={"ids": mint}) as resp:
                if resp.status == 200:
                    data = await resp.json()
                    token_data = data.get("data", {}).get(mint)
                    if token_data and token_data.get("price") is not None:
                        return float(token_data["price"])
                elif resp.status == 429:
                    logger.warning("Jupiter price API rate limited")
                return None
        except (aiohttp.ClientError, asyncio.TimeoutError) as e:
            logger.warning("Price fetch failed for %s: %s", token, e)
            return None

    async def get_quote_output(self, input_mint: str, output_mint: str, amount: int) -> Optional[Dict]:
        """Get a Jupiter swap quote to determine effective exchange rate."""
        try:
            session = await self._get_session()
            params = {
                "inputMint": input_mint,
                "outputMint": output_mint,
                "amount": str(amount),
                "slippageBps": str(self.max_slippage_bps),
            }
            async with session.get(_JUPITER_QUOTE, params=params) as resp:
                if resp.status == 200:
                    return await resp.json()
                if resp.status == 429:
                    logger.warning("Jupiter quote API rate limited")
                return None
        except (aiohttp.ClientError, asyncio.TimeoutError) as e:
            logger.warning("Quote request failed: %s", e)
            return None

    # ── arbitrage detection ──────────────────────────────────────

    async def find_arbitrage_opportunities(self, token_a: str, token_b: str) -> List[Dict]:
        """
        Find arbitrage opportunities by checking round-trip swap profitability.

        For a token pair A/B:
        1. Get Jupiter quote for A -> B (forward)
        2. Get Jupiter quote for B -> A (reverse, using the output from step 1)
        3. Compare final A amount to original — if more, there's an arb opportunity.
        """
        opportunities = []

        mint_a = _TOKENS.get(token_a)
        mint_b = _TOKENS.get(token_b)
        if not mint_a or not mint_b:
            return []

        # Use a moderate test amount (e.g. 0.1 SOL = 100_000_000 lamports for SOL-based)
        # For USDC pairs, use 10 USDC = 10_000_000
        if token_a == "SOL":
            test_amount = 100_000_000  # 0.1 SOL
        else:
            test_amount = 10_000_000  # 10 USDC (6 decimals)

        # Forward: A -> B
        forward_quote = await self.get_quote_output(mint_a, mint_b, test_amount)
        if not forward_quote:
            return []

        out_b = int(forward_quote.get("outAmount", 0))
        if out_b == 0:
            return []

        # Reverse: B -> A (with the output from forward)
        reverse_quote = await self.get_quote_output(mint_b, mint_a, out_b)
        if not reverse_quote:
            return []

        out_a_final = int(reverse_quote.get("outAmount", 0))
        if out_a_final == 0:
            return []

        # Calculate round-trip profit
        profit_bps = int((out_a_final - test_amount) / test_amount * 10_000)

        if profit_bps >= self.min_profit_bps:
            forward_impact = float(forward_quote.get("priceImpactPct", 0))
            reverse_impact = float(reverse_quote.get("priceImpactPct", 0))

            opportunities.append({
                'token_pair': f"{token_a}/{token_b}",
                'input_amount': test_amount,
                'intermediate_amount': out_b,
                'output_amount': out_a_final,
                'profit_bps': profit_bps,
                'profit_percentage': profit_bps / 100,
                'forward_impact_pct': forward_impact,
                'reverse_impact_pct': reverse_impact,
                'forward_route_hops': len(forward_quote.get("routePlan", [])),
                'reverse_route_hops': len(reverse_quote.get("routePlan", [])),
                'timestamp': datetime.now().isoformat(),
            })

        return opportunities

    async def calculate_optimal_trade_size(self, opportunity: Dict) -> float:
        """Calculate optimal trade size considering liquidity and slippage."""
        # Conservative: use the test amount that produced the opportunity
        return float(opportunity.get("input_amount", 0))

    async def simulate_arbitrage(self, opportunity: Dict, trade_size: float) -> Dict:
        """Simulate arbitrage execution with estimated fees."""
        dex_fee_rate = 0.003  # ~0.3% average DEX fee per leg
        solana_tx_fee = 0.000005 * 2  # Two transactions

        gross_profit_pct = opportunity['profit_percentage']
        fee_pct = dex_fee_rate * 2 * 100  # Two legs
        net_profit_pct = gross_profit_pct - fee_pct

        return {
            'gross_profit_pct': gross_profit_pct,
            'estimated_fees_pct': fee_pct,
            'net_profit_pct': net_profit_pct,
            'solana_tx_fee_sol': solana_tx_fee,
            'profitable': net_profit_pct > 0,
        }

    async def execute_arbitrage(self, opportunity: Dict, trade_size: float) -> bool:
        """Execute arbitrage trade (placeholder for actual execution)."""
        logger.info(
            "Executing arbitrage: %s | profit: %.2f%% | input: %d",
            opportunity['token_pair'], opportunity['profit_percentage'], int(trade_size),
        )
        # In production, would build and send two Jupiter swap transactions
        # atomically using Jito bundles or similar
        return False

    async def scan_markets(self) -> List[Dict]:
        """Scan all markets for arbitrage opportunities using real Jupiter quotes."""
        token_pairs = [
            ('SOL', 'USDC'),
            ('SOL', 'USDT'),
            ('BONK', 'USDC'),
            ('JUP', 'USDC'),
            ('RAY', 'USDC'),
        ]

        all_opportunities = []

        for token_a, token_b in token_pairs:
            opportunities = await self.find_arbitrage_opportunities(token_a, token_b)
            all_opportunities.extend(opportunities)
            # Brief pause to respect rate limits
            await asyncio.sleep(0.5)

        return sorted(all_opportunities, key=lambda x: x['profit_bps'], reverse=True)

    async def create_proposal(self, data: Dict, description: str) -> None:
        """Placeholder for proposal creation."""
        logger.info("Creating proposal: %s", description)

    async def run(self):
        """Main agent loop."""
        logger.info("%s starting...", self.agent_name)

        while True:
            try:
                opportunities = await self.scan_markets()

                if opportunities:
                    logger.info("Found %d arbitrage opportunities:", len(opportunities))

                    for opp in opportunities[:5]:
                        simulation = await self.simulate_arbitrage(opp, opp['input_amount'])
                        logger.info(
                            "  %s: %.2f%% gross, %.2f%% net, profitable=%s",
                            opp['token_pair'],
                            opp['profit_percentage'],
                            simulation['net_profit_pct'],
                            simulation['profitable'],
                        )

                        if simulation['profitable'] and self.is_registered:
                            await self.create_proposal(
                                data=opp,
                                description=f"Arbitrage: {opp['profit_percentage']:.2f}% on {opp['token_pair']}",
                            )

                # Jupiter rate limits: wait 30 seconds between full scans
                await asyncio.sleep(30)

            except Exception as e:
                logger.error("Arbitrage agent error: %s", e)
                await asyncio.sleep(60)
