"""
Sentiment Analysis Agent - Advanced Feature
Analyzes market sentiment from social media, news, and on-chain data
"""

import asyncio
from typing import Dict, List, Optional
from datetime import datetime
import aiohttp

class SentimentAnalysisAgent:
    """
    Specialized agent for analyzing market sentiment across multiple sources
    """
    
    def __init__(self, agent_name: str = "Sentiment Analyzer", program_id: Optional[str] = None):
        self.agent_name = agent_name
        self.program_id = program_id
        self.is_registered = False
        self.sentiment_sources = {
            'twitter': True,
            'reddit': True,
            'news': True,
            'onchain': True
        }
        self.sentiment_threshold = 0.6
        
    async def analyze_twitter_sentiment(self, token: str) -> Dict:
        """Analyze Twitter sentiment for a token"""
        # Placeholder for Twitter API integration
        sentiment_score = 0.0
        tweet_volume = 0
        top_mentions = []
        
        return {
            'source': 'twitter',
            'token': token,
            'score': sentiment_score,
            'volume': tweet_volume,
            'mentions': top_mentions,
            'timestamp': datetime.now().isoformat()
        }
    
    async def analyze_reddit_sentiment(self, token: str) -> Dict:
        """Analyze Reddit sentiment for a token"""
        sentiment_score = 0.0
        post_count = 0
        subreddits = []
        
        return {
            'source': 'reddit',
            'token': token,
            'score': sentiment_score,
            'posts': post_count,
            'subreddits': subreddits,
            'timestamp': datetime.now().isoformat()
        }
    
    async def analyze_news_sentiment(self, token: str) -> Dict:
        """Analyze news sentiment for a token"""
        sentiment_score = 0.0
        article_count = 0
        sources = []
        
        return {
            'source': 'news',
            'token': token,
            'score': sentiment_score,
            'articles': article_count,
            'sources': sources,
            'timestamp': datetime.now().isoformat()
        }
    
    async def analyze_onchain_sentiment(self, token_address: str) -> Dict:
        """Analyze on-chain sentiment (whale movements, holder changes)"""
        whale_activity = 0.0
        holder_growth = 0.0
        transaction_volume = 0
        
        return {
            'source': 'onchain',
            'token': token_address,
            'whale_activity': whale_activity,
            'holder_growth': holder_growth,
            'tx_volume': transaction_volume,
            'timestamp': datetime.now().isoformat()
        }
    
    async def get_composite_sentiment(self, token: str) -> Dict:
        """Get composite sentiment from all sources"""
        tasks = []
        
        if self.sentiment_sources['twitter']:
            tasks.append(self.analyze_twitter_sentiment(token))
        if self.sentiment_sources['reddit']:
            tasks.append(self.analyze_reddit_sentiment(token))
        if self.sentiment_sources['news']:
            tasks.append(self.analyze_news_sentiment(token))
        if self.sentiment_sources['onchain']:
            tasks.append(self.analyze_onchain_sentiment(token))
        
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        # Calculate weighted average
        total_score = 0.0
        total_weight = 0.0
        
        weights = {
            'twitter': 0.25,
            'reddit': 0.15,
            'news': 0.30,
            'onchain': 0.30
        }
        
        sentiment_data = []
        for result in results:
            if isinstance(result, Exception):
                continue
            if isinstance(result, dict):
                sentiment_data.append(result)
                source = result.get('source', '')
                score = result.get('score', 0.0)
            else:
                continue
            weight = weights.get(source, 0.1)
            total_score += score * weight
            total_weight += weight
        
        composite_score = total_score / total_weight if total_weight > 0 else 0.0
        
        return {
            'token': token,
            'composite_score': composite_score,
            'sentiment': self._classify_sentiment(composite_score),
            'sources': sentiment_data,
            'timestamp': datetime.now().isoformat(),
            'confidence': self._calculate_confidence(sentiment_data)
        }
    
    def _classify_sentiment(self, score: float) -> str:
        """Classify sentiment based on score"""
        if score >= 0.6:
            return 'bullish'
        elif score <= 0.4:
            return 'bearish'
        else:
            return 'neutral'
    
    def _calculate_confidence(self, sentiment_data: List[Dict]) -> float:
        """Calculate confidence level based on data availability"""
        return min(len(sentiment_data) / len(self.sentiment_sources), 1.0)
    
    async def should_propose_action(self, token: str) -> Optional[Dict]:
        """Determine if sentiment warrants a proposal"""
        sentiment = await self.get_composite_sentiment(token)
        
        if sentiment['confidence'] < 0.5:
            return None  # Not enough data
        
        if sentiment['sentiment'] == 'bullish' and sentiment['composite_score'] > 0.7:
            return {
                'action': 'buy',
                'token': token,
                'reason': f"Strong bullish sentiment ({sentiment['composite_score']:.2f})",
                'confidence': sentiment['confidence'],
                'data': sentiment
            }
        elif sentiment['sentiment'] == 'bearish' and sentiment['composite_score'] < 0.3:
            return {
                'action': 'sell',
                'token': token,
                'reason': f"Strong bearish sentiment ({sentiment['composite_score']:.2f})",
                'confidence': sentiment['confidence'],
                'data': sentiment
            }
        
        return None
    
    async def create_proposal(self, data: Dict, description: str) -> None:
        """Placeholder for proposal creation - integrate with actual swarm coordinator"""
        print(f"Creating proposal: {description}")
        # TODO: Integrate with actual proposal system
        pass
    
    async def run(self):
        """Main agent loop"""
        print(f"🔍 {self.agent_name} starting...")
        
        tokens_to_monitor = ['SOL', 'USDC', 'BONK', 'JUP', 'PYTH']
        
        while True:
            try:
                for token in tokens_to_monitor:
                    proposal = await self.should_propose_action(token)
                    
                    if proposal:
                        print(f"📢 Sentiment-based proposal for {token}:")
                        print(f"   Action: {proposal['action']}")
                        print(f"   Reason: {proposal['reason']}")
                        print(f"   Confidence: {proposal['confidence']:.2%}")
                        
                        # Submit proposal to swarm (if registered)
                        if self.is_registered:
                            await self.create_proposal(
                                data={token: proposal['action']},
                                description=proposal['reason']
                            )
                
                await asyncio.sleep(300)  # Check every 5 minutes
                
            except Exception as e:
                print(f"❌ Sentiment agent error: {e}")
                await asyncio.sleep(60)
