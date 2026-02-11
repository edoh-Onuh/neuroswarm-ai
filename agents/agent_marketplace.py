"""
Agent Marketplace - Advanced Feature
Platform where agents compete, users can rent agents, and agents earn reputation
"""

from typing import Dict, List, Optional, Any
from dataclasses import dataclass
from datetime import datetime
from enum import Enum

class AgentRating(Enum):
    """Agent performance ratings"""
    LEGENDARY = "legendary"  # Top 1%
    ELITE = "elite"  # Top 5%
    EXPERT = "expert"  # Top 10%
    PROFICIENT = "proficient"  # Top 25%
    DEVELOPING = "developing"  # Bottom 75%

@dataclass
class AgentPerformanceMetrics:
    """Performance metrics for marketplace agents"""
    agent_id: str
    agent_name: str
    total_proposals: int
    successful_proposals: int
    total_profit: float
    average_roi: float
    risk_adjusted_return: float
    consistency_score: float  # 0-100
    reputation: int
    rating: AgentRating
    rental_price: float  # SOL per day
    times_rented: int
    total_earnings: float

@dataclass
class AgentListing:
    """Marketplace listing for an agent"""
    agent_id: str
    owner_pubkey: str
    name: str
    description: str
    capabilities: List[str]
    performance: AgentPerformanceMetrics
    rental_terms: Dict[str, Any]
    reviews: List[Dict]
    listed_at: datetime
    is_available: bool

class AgentMarketplace:
    """
    Marketplace for renting, trading, and competing agents
    """
    
    def __init__(self):
        self.listings: Dict[str, AgentListing] = {}
        self.leaderboard: List[AgentPerformanceMetrics] = []
        self.active_rentals: Dict[str, Dict] = {}
        
    def list_agent(
        self,
        agent_id: str,
        owner_pubkey: str,
        name: str,
        description: str,
        capabilities: List[str],
        rental_price: float,
        rental_terms: Optional[Dict] = None
    ) -> str:
        """List an agent on the marketplace"""
        
        # Calculate initial performance metrics
        performance = AgentPerformanceMetrics(
            agent_id=agent_id,
            agent_name=name,
            total_proposals=0,
            successful_proposals=0,
            total_profit=0.0,
            average_roi=0.0,
            risk_adjusted_return=0.0,
            consistency_score=0.0,
            reputation=1000,  # Starting reputation
            rating=AgentRating.DEVELOPING,
            rental_price=rental_price,
            times_rented=0,
            total_earnings=0.0
        )
        
        listing = AgentListing(
            agent_id=agent_id,
            owner_pubkey=owner_pubkey,
            name=name,
            description=description,
            capabilities=capabilities,
            performance=performance,
            rental_terms=rental_terms or {
                'min_rental_period': 1,  # days
                'max_rental_period': 30,
                'cancellation_policy': 'flexible',
                'performance_guarantee': True
            },
            reviews=[],
            listed_at=datetime.now(),
            is_available=True
        )
        
        self.listings[agent_id] = listing
        return agent_id
    
    def search_agents(
        self,
        capabilities: Optional[List[str]] = None,
        min_rating: Optional[AgentRating] = None,
        max_price: Optional[float] = None,
        min_reputation: Optional[int] = None
    ) -> List[AgentListing]:
        """Search for agents based on criteria"""
        
        results = list(self.listings.values())
        
        if capabilities:
            results = [
                agent for agent in results
                if any(cap in agent.capabilities for cap in capabilities)
            ]
        
        if min_rating:
            rating_order = {
                AgentRating.LEGENDARY: 5,
                AgentRating.ELITE: 4,
                AgentRating.EXPERT: 3,
                AgentRating.PROFICIENT: 2,
                AgentRating.DEVELOPING: 1
            }
            min_rating_value = rating_order[min_rating]
            results = [
                agent for agent in results
                if rating_order[agent.performance.rating] >= min_rating_value
            ]
        
        if max_price:
            results = [
                agent for agent in results
                if agent.performance.rental_price <= max_price
            ]
        
        if min_reputation:
            results = [
                agent for agent in results
                if agent.performance.reputation >= min_reputation
            ]
        
        # Sort by performance
        results.sort(
            key=lambda x: (
                x.performance.reputation,
                x.performance.risk_adjusted_return
            ),
            reverse=True
        )
        
        return results
    
    def rent_agent(
        self,
        agent_id: str,
        renter_pubkey: str,
        rental_period: int,
        payment_amount: float
    ) -> Dict:
        """Rent an agent"""
        
        if agent_id not in self.listings:
            raise ValueError(f"Agent {agent_id} not found")
        
        listing = self.listings[agent_id]
        
        if not listing.is_available:
            raise ValueError(f"Agent {agent_id} is not available")
        
        # Validate rental terms
        terms = listing.rental_terms
        if rental_period < terms['min_rental_period']:
            raise ValueError(f"Minimum rental period is {terms['min_rental_period']} days")
        if rental_period > terms['max_rental_period']:
            raise ValueError(f"Maximum rental period is {terms['max_rental_period']} days")
        
        expected_payment = listing.performance.rental_price * rental_period
        if payment_amount < expected_payment:
            raise ValueError(f"Insufficient payment: {payment_amount} < {expected_payment}")
        
        # Create rental agreement
        rental = {
            'agent_id': agent_id,
            'renter_pubkey': renter_pubkey,
            'owner_pubkey': listing.owner_pubkey,
            'rental_period': rental_period,
            'payment_amount': payment_amount,
            'start_date': datetime.now(),
            'end_date': datetime.now(),  # Add rental_period days
            'status': 'active',
            'performance_guarantee': terms.get('performance_guarantee', False)
        }
        
        self.active_rentals[f"{agent_id}_{renter_pubkey}"] = rental
        listing.is_available = False
        listing.performance.times_rented += 1
        listing.performance.total_earnings += payment_amount
        
        return rental
    
    def update_agent_performance(
        self,
        agent_id: str,
        proposal_success: bool,
        profit: float,
        roi: float
    ):
        """Update agent performance metrics"""
        
        if agent_id not in self.listings:
            return
        
        listing = self.listings[agent_id]
        perf = listing.performance
        
        perf.total_proposals += 1
        if proposal_success:
            perf.successful_proposals += 1
        
        perf.total_profit += profit
        
        # Update average ROI
        perf.average_roi = (
            (perf.average_roi * (perf.total_proposals - 1) + roi) /
            perf.total_proposals
        )
        
        # Update success rate
        success_rate = perf.successful_proposals / perf.total_proposals
        
        # Update consistency score (based on success rate and volatility)
        perf.consistency_score = success_rate * 100
        
        # Update reputation
        if proposal_success:
            perf.reputation += 10 + int(roi * 5)  # Bonus for high ROI
        else:
            perf.reputation -= 5
        
        # Update rating
        perf.rating = self._calculate_rating(perf)
        
        # Update leaderboard
        self._update_leaderboard()
    
    def _calculate_rating(self, perf: AgentPerformanceMetrics) -> AgentRating:
        """Calculate agent rating based on performance"""
        
        if perf.total_proposals < 10:
            return AgentRating.DEVELOPING
        
        # Calculate composite score
        score = (
            perf.reputation * 0.3 +
            perf.consistency_score * 0.3 +
            (perf.risk_adjusted_return * 100) * 0.2 +
            (perf.average_roi * 100) * 0.2
        )
        
        if score >= 90:
            return AgentRating.LEGENDARY
        elif score >= 80:
            return AgentRating.ELITE
        elif score >= 70:
            return AgentRating.EXPERT
        elif score >= 60:
            return AgentRating.PROFICIENT
        else:
            return AgentRating.DEVELOPING
    
    def _update_leaderboard(self):
        """Update marketplace leaderboard"""
        all_performance = [listing.performance for listing in self.listings.values()]
        
        self.leaderboard = sorted(
            all_performance,
            key=lambda x: (x.reputation, x.risk_adjusted_return, x.consistency_score),
            reverse=True
        )
    
    def get_leaderboard(self, limit: int = 10) -> List[AgentPerformanceMetrics]:
        """Get top performing agents"""
        return self.leaderboard[:limit]
    
    def add_review(
        self,
        agent_id: str,
        reviewer_pubkey: str,
        rating: int,  # 1-5 stars
        comment: str
    ):
        """Add a review for an agent"""
        
        if agent_id not in self.listings:
            raise ValueError(f"Agent {agent_id} not found")
        
        review = {
            'reviewer_pubkey': reviewer_pubkey,
            'rating': max(1, min(5, rating)),
            'comment': comment,
            'timestamp': datetime.now().isoformat()
        }
        
        self.listings[agent_id].reviews.append(review)
        
        # Update reputation based on review
        reputation_change = (rating - 3) * 5  # -10 to +10
        self.listings[agent_id].performance.reputation += reputation_change
    
    def get_agent_stats(self, agent_id: str) -> Dict:
        """Get detailed stats for an agent"""
        
        if agent_id not in self.listings:
            raise ValueError(f"Agent {agent_id} not found")
        
        listing = self.listings[agent_id]
        perf = listing.performance
        
        # Calculate average review rating
        avg_rating = 0.0
        if listing.reviews:
            avg_rating = sum(r['rating'] for r in listing.reviews) / len(listing.reviews)
        
        return {
            'agent_id': agent_id,
            'name': listing.name,
            'performance': {
                'total_proposals': perf.total_proposals,
                'success_rate': (
                    perf.successful_proposals / perf.total_proposals * 100
                    if perf.total_proposals > 0 else 0
                ),
                'total_profit': perf.total_profit,
                'average_roi': perf.average_roi,
                'reputation': perf.reputation,
                'rating': perf.rating.value,
                'consistency_score': perf.consistency_score
            },
            'rental_info': {
                'price_per_day': perf.rental_price,
                'times_rented': perf.times_rented,
                'total_earnings': perf.total_earnings,
                'is_available': listing.is_available
            },
            'reviews': {
                'count': len(listing.reviews),
                'average_rating': avg_rating,
                'recent': listing.reviews[-5:]  # Last 5 reviews
            }
        }

# Example usage
if __name__ == '__main__':
    marketplace = AgentMarketplace()
    
    # List some agents
    agent1_id = marketplace.list_agent(
        agent_id="agent_001",
        owner_pubkey="owner123",
        name="Elite Trader Pro",
        description="High-frequency trading specialist with proven track record",
        capabilities=["market_analysis", "arbitrage", "risk_management"],
        rental_price=5.0  # 5 SOL per day
    )
    
    # Search agents
    results = marketplace.search_agents(
        capabilities=["market_analysis"],
        max_price=10.0
    )
    
    print(f"Found {len(results)} agents")
    
    # Get leaderboard
    top_agents = marketplace.get_leaderboard(10)
    print(f"\nTop 10 Agents:")
    for i, agent in enumerate(top_agents, 1):
        print(f"{i}. {agent.agent_name} - Reputation: {agent.reputation}")
