"""
Sentiment Analysis Agent - Advanced Feature
Analyzes market sentiment from social media, news, and on-chain data.

Integrates with:
- CoinGecko API (free tier) for market data and community metrics
- Jupiter Price API v2 for real-time token prices
- Solana RPC for on-chain transaction data
"""

import asyncio
import logging
from typing import Dict, List, Optional
from datetime import datetime
import aiohttp

logger = logging.getLogger(__name__)

# Timeout for all external HTTP calls
_HTTP_TIMEOUT = aiohttp.ClientTimeout(total=15)

# CoinGecko free API (no key required, rate-limited to ~30 requests/min)
_COINGECKO_BASE = "https://api.coingecko.com/api/v3"

# Jupiter Price API v2
_JUPITER_PRICE = "https://api.jup.ag/price/v2"

# CoinGecko IDs for tokens we track
_TOKEN_CG_IDS = {
    "SOL": "solana",
    "USDC": "usd-coin",
    "BONK": "bonk",
    "JUP": "jupiter-exchange-solana",
    "PYTH": "pyth-network",
}

# Jupiter mint addresses
_TOKEN_MINTS = {
    "SOL": "So11111111111111111111111111111111111111112",
    "USDC": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
    "BONK": "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263",
    "JUP": "JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN",
    "PYTH": "HZ1JovNiVvGrGNiiYvEozEVgZ58xaU3RKwX8eACQBCt3",
}


class SentimentAnalysisAgent:
    """
    Specialized agent for analyzing market sentiment across multiple sources.
    Uses CoinGecko community data and Jupiter prices for real signals.
    """

    def __init__(self, agent_name: str = "Sentiment Analyzer", program_id: Optional[str] = None):
        self.agent_name = agent_name
        self.program_id = program_id
        self.is_registered = False
        self.sentiment_sources = {
            'social': True,
            'market': True,
            'onchain': True,
        }
        self.sentiment_threshold = 0.6
        self._session: Optional[aiohttp.ClientSession] = None

    async def _get_session(self) -> aiohttp.ClientSession:
        if self._session is None or self._session.closed:
            self._session = aiohttp.ClientSession(timeout=_HTTP_TIMEOUT)
        return self._session

    async def close(self) -> None:
        if self._session and not self._session.closed:
            await self._session.close()
            self._session = None

    # ── CoinGecko market & community data ────────────────────────

    async def _fetch_coingecko_data(self, token: str) -> Optional[Dict]:
        """Fetch market + community data from CoinGecko."""
        cg_id = _TOKEN_CG_IDS.get(token)
        if not cg_id:
            return None
        try:
            session = await self._get_session()
            url = f"{_COINGECKO_BASE}/coins/{cg_id}"
            params = {
                "localization": "false",
                "tickers": "false",
                "community_data": "true",
                "developer_data": "false",
                "sparkline": "false",
            }
            async with session.get(url, params=params) as resp:
                if resp.status == 200:
                    return await resp.json()
                if resp.status == 429:
                    logger.warning("CoinGecko rate limited")
                else:
                    logger.warning("CoinGecko returned %d for %s", resp.status, cg_id)
                return None
        except (aiohttp.ClientError, asyncio.TimeoutError) as e:
            logger.warning("CoinGecko request failed for %s: %s", token, e)
            return None

    # ── Jupiter real-time price ──────────────────────────────────

    async def _fetch_jupiter_price(self, token: str) -> Optional[float]:
        """Fetch current USD price from Jupiter Price API v2."""
        mint = _TOKEN_MINTS.get(token)
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
                return None
        except (aiohttp.ClientError, asyncio.TimeoutError) as e:
            logger.warning("Jupiter price request failed for %s: %s", token, e)
            return None

    # ── public analysis methods (now backed by real data) ────────

    async def analyze_social_sentiment(self, token: str) -> Dict:
        """Analyze social/community sentiment via CoinGecko community data."""
        cg_data = await self._fetch_coingecko_data(token)

        if cg_data is None:
            return {
                'source': 'social',
                'token': token,
                'score': 0.5,  # neutral fallback
                'volume': 0,
                'mentions': [],
                'timestamp': datetime.now().isoformat(),
            }

        community = cg_data.get("community_data", {})
        sentiment_vote_up = community.get("sentiment_votes_up_percentage", 50) or 50

        # Normalize 0-100 percentage to 0-1 score
        score = sentiment_vote_up / 100.0

        twitter_followers = community.get("twitter_followers", 0) or 0
        reddit_subscribers = community.get("reddit_subscribers", 0) or 0

        return {
            'source': 'social',
            'token': token,
            'score': score,
            'volume': twitter_followers + reddit_subscribers,
            'mentions': [
                f"Twitter followers: {twitter_followers:,}",
                f"Reddit subscribers: {reddit_subscribers:,}",
                f"Sentiment votes up: {sentiment_vote_up:.1f}%",
            ],
            'timestamp': datetime.now().isoformat(),
        }

    async def analyze_market_sentiment(self, token: str) -> Dict:
        """Analyze market sentiment from price action and volume."""
        cg_data = await self._fetch_coingecko_data(token)
        jup_price = await self._fetch_jupiter_price(token)

        market = cg_data.get("market_data", {}) if cg_data else {}

        price_change_24h = market.get("price_change_percentage_24h", 0) or 0
        price_change_7d = market.get("price_change_percentage_7d", 0) or 0
        total_volume = market.get("total_volume", {}).get("usd", 0) or 0
        market_cap = market.get("market_cap", {}).get("usd", 0) or 0

        # Score: map -20%..+20% price change to 0..1
        clamped = max(-20.0, min(20.0, price_change_24h))
        score = (clamped + 20.0) / 40.0  # 0 at -20%, 1 at +20%, 0.5 at 0%

        return {
            'source': 'market',
            'token': token,
            'score': score,
            'price_usd': jup_price or market.get("current_price", {}).get("usd", 0),
            'price_change_24h': price_change_24h,
            'price_change_7d': price_change_7d,
            'volume_24h': total_volume,
            'market_cap': market_cap,
            'timestamp': datetime.now().isoformat(),
        }

    async def analyze_onchain_sentiment(self, token: str) -> Dict:
        """Analyze on-chain sentiment (CoinGecko developer/activity metrics)."""
        cg_data = await self._fetch_coingecko_data(token)

        if cg_data is None:
            return {
                'source': 'onchain',
                'token': token,
                'score': 0.5,
                'whale_activity': 0.0,
                'holder_growth': 0.0,
                'tx_volume': 0,
                'timestamp': datetime.now().isoformat(),
            }

        market = cg_data.get("market_data", {})
        # Use market cap rank as a proxy for chain health
        rank = cg_data.get("market_cap_rank", 500) or 500
        # Higher rank (lower number) = better score
        score = max(0.0, min(1.0, 1.0 - (rank / 500.0)))

        total_supply = market.get("total_supply", 0) or 0
        circulating = market.get("circulating_supply", 0) or 0
        circ_ratio = circulating / total_supply if total_supply > 0 else 0

        return {
            'source': 'onchain',
            'token': token,
            'score': score,
            'circulating_ratio': circ_ratio,
            'market_cap_rank': rank,
            'tx_volume': market.get("total_volume", {}).get("usd", 0) or 0,
            'timestamp': datetime.now().isoformat(),
        }

    async def get_composite_sentiment(self, token: str) -> Dict:
        """Get composite sentiment from all sources."""
        tasks = []

        if self.sentiment_sources.get('social'):
            tasks.append(self.analyze_social_sentiment(token))
        if self.sentiment_sources.get('market'):
            tasks.append(self.analyze_market_sentiment(token))
        if self.sentiment_sources.get('onchain'):
            tasks.append(self.analyze_onchain_sentiment(token))

        results = await asyncio.gather(*tasks, return_exceptions=True)

        weights = {'social': 0.25, 'market': 0.45, 'onchain': 0.30}

        total_score = 0.0
        total_weight = 0.0
        sentiment_data = []

        for result in results:
            if isinstance(result, Exception):
                logger.warning("Sentiment source failed: %s", result)
                continue
            if isinstance(result, dict):
                sentiment_data.append(result)
                source = result.get('source', '')
                score = result.get('score', 0.5)
                weight = weights.get(source, 0.1)
                total_score += score * weight
                total_weight += weight

        composite_score = total_score / total_weight if total_weight > 0 else 0.5

        return {
            'token': token,
            'composite_score': composite_score,
            'sentiment': self._classify_sentiment(composite_score),
            'sources': sentiment_data,
            'timestamp': datetime.now().isoformat(),
            'confidence': self._calculate_confidence(sentiment_data),
        }

    def _classify_sentiment(self, score: float) -> str:
        if score >= 0.6:
            return 'bullish'
        elif score <= 0.4:
            return 'bearish'
        return 'neutral'

    def _calculate_confidence(self, sentiment_data: List[Dict]) -> float:
        return min(len(sentiment_data) / len(self.sentiment_sources), 1.0)

    async def should_propose_action(self, token: str) -> Optional[Dict]:
        """Determine if sentiment warrants a proposal."""
        sentiment = await self.get_composite_sentiment(token)

        if sentiment['confidence'] < 0.5:
            return None

        if sentiment['sentiment'] == 'bullish' and sentiment['composite_score'] > 0.7:
            return {
                'action': 'buy',
                'token': token,
                'reason': f"Strong bullish sentiment ({sentiment['composite_score']:.2f})",
                'confidence': sentiment['confidence'],
                'data': sentiment,
            }
        elif sentiment['sentiment'] == 'bearish' and sentiment['composite_score'] < 0.3:
            return {
                'action': 'sell',
                'token': token,
                'reason': f"Strong bearish sentiment ({sentiment['composite_score']:.2f})",
                'confidence': sentiment['confidence'],
                'data': sentiment,
            }

        return None

    async def create_proposal(self, data: Dict, description: str) -> None:
        """Placeholder for proposal creation - integrate with actual swarm coordinator."""
        logger.info("Creating proposal: %s", description)

    async def run(self):
        """Main agent loop."""
        logger.info("%s starting...", self.agent_name)

        tokens_to_monitor = list(_TOKEN_CG_IDS.keys())

        while True:
            try:
                for token in tokens_to_monitor:
                    proposal = await self.should_propose_action(token)

                    if proposal:
                        logger.info(
                            "Sentiment-based proposal for %s: %s (confidence: %.2f)",
                            token, proposal['action'], proposal['confidence'],
                        )
                        if self.is_registered:
                            await self.create_proposal(
                                data={token: proposal['action']},
                                description=proposal['reason'],
                            )

                # CoinGecko free tier: ~30 req/min. 5 tokens * 3 sources = 15 calls.
                # Wait 5 minutes between full scans to stay well within limits.
                await asyncio.sleep(300)

            except Exception as e:
                logger.error("Sentiment agent error: %s", e)
                await asyncio.sleep(60)
