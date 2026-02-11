"""
Enhanced Learning Agent with Historical Data Analysis
Uses reinforcement learning to optimize strategy based on past performance
"""
import os
import json
import asyncio
import sqlite3
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass
import numpy as np
from solders.keypair import Keypair
from solders.pubkey import Pubkey
from solana.rpc.async_api import AsyncClient
from dotenv import load_dotenv


@dataclass
class HistoricalOutcome:
    """Historical proposal outcome data"""
    timestamp: datetime
    proposal_type: str
    agent_vote: str
    final_result: str
    success: bool
    reward: float


class EnhancedLearningAgent:
    """Learning agent with reinforcement learning capabilities"""
    
    def __init__(self, wallet: Keypair, rpc_client: AsyncClient):
        self.wallet = wallet
        self.rpc_client = rpc_client
        self.db_path = "data/learning_history.db"
        self._init_database()
        
        # Q-Learning parameters
        self.learning_rate = 0.1
        self.discount_factor = 0.95
        self.exploration_rate = 0.2
        
        # State representation: (market_condition, proposal_type, risk_level)
        self.q_table: Dict[Tuple, Dict[str, float]] = {}
        
    def _init_database(self):
        """Initialize SQLite database for historical data"""
        os.makedirs(os.path.dirname(self.db_path) if os.path.dirname(self.db_path) else ".", exist_ok=True)
        
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS outcomes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp TEXT NOT NULL,
                proposal_id INTEGER NOT NULL,
                proposal_type TEXT NOT NULL,
                agent_vote TEXT NOT NULL,
                final_result TEXT NOT NULL,
                success INTEGER NOT NULL,
                reward REAL NOT NULL,
                market_condition TEXT,
                risk_level TEXT
            )
        ''')
        
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS q_values (
                state TEXT PRIMARY KEY,
                approve_value REAL NOT NULL,
                reject_value REAL NOT NULL,
                abstain_value REAL NOT NULL,
                updated_at TEXT NOT NULL
            )
        ''')
        
        conn.commit()
        conn.close()
    
    def record_outcome(
        self,
        proposal_id: int,
        proposal_type: str,
        agent_vote: str,
        final_result: str,
        success: bool,
        market_condition: str = "normal",
        risk_level: str = "medium"
    ):
        """Record proposal outcome for learning"""
        reward = 1.0 if success else -0.5
        
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT INTO outcomes (
                timestamp, proposal_id, proposal_type, agent_vote,
                final_result, success, reward, market_condition, risk_level
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            datetime.now().isoformat(),
            proposal_id,
            proposal_type,
            agent_vote,
            final_result,
            1 if success else 0,
            reward,
            market_condition,
            risk_level
        ))
        
        conn.commit()
        conn.close()
        
        # Update Q-values
        state = (market_condition, proposal_type, risk_level)
        self._update_q_value(state, agent_vote, reward)
    
    def _update_q_value(self, state: Tuple, action: str, reward: float):
        """Update Q-value using Q-learning algorithm"""
        if state not in self.q_table:
            self.q_table[state] = {
                "approve": 0.0,
                "reject": 0.0,
                "abstain": 0.0
            }
        
        # Q(s,a) = Q(s,a) + α * [R + γ * max(Q(s',a')) - Q(s,a)]
        current_q = self.q_table[state][action.lower()]
        max_future_q = max(self.q_table[state].values())
        
        new_q = current_q + self.learning_rate * (
            reward + self.discount_factor * max_future_q - current_q
        )
        
        self.q_table[state][action.lower()] = new_q
        
        # Persist to database
        self._save_q_value(state)
    
    def _save_q_value(self, state: Tuple):
        """Save Q-value to database"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        state_key = "|".join(state)
        q_vals = self.q_table[state]
        
        cursor.execute('''
            INSERT OR REPLACE INTO q_values (
                state, approve_value, reject_value, abstain_value, updated_at
            ) VALUES (?, ?, ?, ?, ?)
        ''', (
            state_key,
            q_vals["approve"],
            q_vals["reject"],
            q_vals["abstain"],
            datetime.now().isoformat()
        ))
        
        conn.commit()
        conn.close()
    
    def _load_q_values(self):
        """Load Q-values from database"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('SELECT * FROM q_values')
        rows = cursor.fetchall()
        
        for row in rows:
            state_key = row[0]
            state = tuple(state_key.split("|"))
            self.q_table[state] = {
                "approve": row[1],
                "reject": row[2],
                "abstain": row[3]
            }
        
        conn.close()
    
    def predict_vote(
        self,
        proposal_type: str,
        market_condition: str = "normal",
        risk_level: str = "medium"
    ) -> Tuple[str, float]:
        """Predict best vote action using learned Q-values"""
        state = (market_condition, proposal_type, risk_level)
        
        # Exploration vs exploitation
        if np.random.random() < self.exploration_rate:
            # Explore: random action
            action = np.random.choice(["approve", "reject", "abstain"])
            confidence = 0.33
        else:
            # Exploit: use Q-values
            if state not in self.q_table:
                self.q_table[state] = {
                    "approve": 0.0,
                    "reject": 0.0,
                    "abstain": 0.0
                }
            
            q_values = self.q_table[state]
            action = max(q_values, key=q_values.get)
            
            # Calculate confidence based on Q-value differences
            max_q = q_values[action]
            avg_q = sum(q_values.values()) / len(q_values)
            confidence = min(1.0, (max_q - avg_q + 1.0) / 2.0)
        
        return action, confidence
    
    def get_performance_stats(self, days: int = 30) -> Dict:
        """Get performance statistics over time period"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cutoff_date = (datetime.now() - timedelta(days=days)).isoformat()
        
        cursor.execute('''
            SELECT 
                COUNT(*) as total,
                SUM(success) as successes,
                AVG(reward) as avg_reward,
                proposal_type,
                agent_vote
            FROM outcomes
            WHERE timestamp >= ?
            GROUP BY proposal_type, agent_vote
        ''', (cutoff_date,))
        
        results = cursor.fetchall()
        
        stats = {
            "total_votes": 0,
            "success_rate": 0.0,
            "avg_reward": 0.0,
            "by_proposal_type": {},
            "by_vote": {}
        }
        
        for row in results:
            total, successes, avg_reward, prop_type, vote = row
            stats["total_votes"] += total
            
            if prop_type not in stats["by_proposal_type"]:
                stats["by_proposal_type"][prop_type] = {
                    "total": 0,
                    "successes": 0,
                    "success_rate": 0.0
                }
            
            stats["by_proposal_type"][prop_type]["total"] += total
            stats["by_proposal_type"][prop_type]["successes"] += successes
            
            if vote not in stats["by_vote"]:
                stats["by_vote"][vote] = {
                    "total": 0,
                    "avg_reward": 0.0
                }
            
            stats["by_vote"][vote]["total"] += total
            stats["by_vote"][vote]["avg_reward"] = avg_reward
        
        # Calculate overall success rate
        if stats["total_votes"] > 0:
            total_successes = sum(
                pt["successes"] 
                for pt in stats["by_proposal_type"].values()
            )
            stats["success_rate"] = total_successes / stats["total_votes"]
            
            cursor.execute('''
                SELECT AVG(reward) FROM outcomes WHERE timestamp >= ?
            ''', (cutoff_date,))
            stats["avg_reward"] = cursor.fetchone()[0] or 0.0
        
        # Calculate success rates by proposal type
        for prop_type, data in stats["by_proposal_type"].items():
            if data["total"] > 0:
                data["success_rate"] = data["successes"] / data["total"]
        
        conn.close()
        return stats
    
    def generate_learning_report(self) -> str:
        """Generate comprehensive learning performance report"""
        stats = self.get_performance_stats(days=30)
        
        report = [
            "=" * 70,
            "🧠 ENHANCED LEARNING AGENT - PERFORMANCE REPORT",
            "=" * 70,
            f"\nWallet: {self.wallet.pubkey()}",
            f"Analysis Period: Last 30 days",
            f"\n📊 Overall Performance:",
            f"   Total Votes: {stats['total_votes']}",
            f"   Success Rate: {stats['success_rate']:.1%}",
            f"   Average Reward: {stats['avg_reward']:.3f}",
        ]
        
        if stats["by_proposal_type"]:
            report.append(f"\n📋 Performance by Proposal Type:")
            for prop_type, data in stats["by_proposal_type"].items():
                report.append(
                    f"   {prop_type}: {data['total']} votes, "
                    f"{data['success_rate']:.1%} success"
                )
        
        if stats["by_vote"]:
            report.append(f"\n🗳️  Performance by Vote Type:")
            for vote, data in stats["by_vote"].items():
                report.append(
                    f"   {vote}: {data['total']} times, "
                    f"avg reward: {data['avg_reward']:.3f}"
                )
        
        # Q-table insights
        if self.q_table:
            report.append(f"\n🎯 Learned Strategies (Q-Values):")
            for state, q_vals in list(self.q_table.items())[:5]:  # Show top 5
                best_action = max(q_vals, key=q_vals.get)
                best_value = q_vals[best_action]
                report.append(
                    f"   State {state}: Best={best_action} (Q={best_value:.3f})"
                )
        
        report.extend([
            "\n" + "=" * 70,
            "✅ LEARNING SYSTEM OPERATIONAL",
            "=" * 70
        ])
        
        return "\n".join(report)


async def demo_learning_agent():
    """Demonstrate enhanced learning agent"""
    load_dotenv()
    
    # Load learning agent wallet
    wallet_path = os.getenv("LEARNING_AGENT_KEYPAIR", "keys/learning-keypair.json")
    with open(wallet_path, 'r') as f:
        secret = json.load(f)
    wallet = Keypair.from_bytes(bytes(secret))
    
    rpc_url = os.getenv("RPC_URL", "https://api.devnet.solana.com")
    rpc_client = AsyncClient(rpc_url)
    
    try:
        # Create enhanced learning agent
        agent = EnhancedLearningAgent(wallet, rpc_client)
        agent._load_q_values()
        
        # Simulate some historical outcomes for demo
        print("\n📝 Recording simulated historical outcomes...")
        outcomes = [
            (0, "rebalance", "approve", "approved", True, "bullish", "low"),
            (1, "trade", "approve", "approved", True, "normal", "medium"),
            (2, "emergency", "approve", "approved", True, "volatile", "high"),
            (3, "rebalance", "reject", "rejected", False, "bearish", "high"),
            (4, "trade", "approve", "approved", True, "bullish", "low"),
        ]
        
        for outcome in outcomes:
            agent.record_outcome(*outcome)
            print(f"   ✅ Recorded: Proposal #{outcome[0]} - {outcome[1]}")
        
        # Test predictions
        print(f"\n🎯 Testing Learned Strategy:")
        
        test_scenarios = [
            ("rebalance", "bullish", "low"),
            ("trade", "normal", "medium"),
            ("emergency", "volatile", "high"),
        ]
        
        for prop_type, market, risk in test_scenarios:
            vote, confidence = agent.predict_vote(prop_type, market, risk)
            print(f"   {prop_type} ({market}, {risk}): {vote.upper()} "
                  f"(confidence: {confidence:.1%})")
        
        # Generate report
        print(f"\n{agent.generate_learning_report()}")
        
    finally:
        await rpc_client.close()


if __name__ == "__main__":
    asyncio.run(demo_learning_agent())
