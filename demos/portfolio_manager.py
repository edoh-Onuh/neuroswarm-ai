"""
DeFi Portfolio Manager - Live Trading Demo
Autonomous agent managing real portfolio with Jupiter DEX
"""
import os
import json
import asyncio
from datetime import datetime
from typing import Dict, List, Optional
from dataclasses import dataclass
from solders.keypair import Keypair
from solders.pubkey import Pubkey
from solana.rpc.async_api import AsyncClient
from dotenv import load_dotenv
import sys
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from integrations.jupiter_client import JupiterClient, TOKENS


@dataclass
class PortfolioPosition:
    """Portfolio position data"""
    token: str
    amount: float
    value_usd: float
    percentage: float


class DeFiPortfolioManager:
    """Autonomous DeFi portfolio manager with live trading"""
    
    def __init__(self, wallet: Keypair, rpc_client: AsyncClient):
        self.wallet = wallet
        self.rpc_client = rpc_client
        self.jupiter = JupiterClient(rpc_client, wallet)
        
        # Portfolio configuration
        self.target_allocation = {
            "SOL": 0.50,   # 50% SOL
            "USDC": 0.30,  # 30% USDC
            "JUP": 0.10,   # 10% JUP
            "BONK": 0.10,  # 10% BONK
        }
        
        self.rebalance_threshold = 0.05  # 5% deviation triggers rebalance
        
    async def get_portfolio_balance(self) -> Dict[str, PortfolioPosition]:
        """Get current portfolio balances"""
        positions = {}
        total_value_usd = 0.0
        
        try:
            # Get SOL balance
            balance_resp = await self.rpc_client.get_balance(self.wallet.pubkey())
            sol_balance = balance_resp.value / 1e9  # Convert lamports to SOL
            
            # Get SOL price
            sol_price = await self.jupiter.get_token_price(TOKENS["SOL"])
            if sol_price:
                sol_value = sol_balance * sol_price
                total_value_usd += sol_value
                positions["SOL"] = PortfolioPosition("SOL", sol_balance, sol_value, 0.0)
            
            # Get SPL token balances (USDC, JUP, BONK)
            # Note: In production, would query token accounts
            # For demo, we'll focus on SOL position
            
            # Calculate percentages
            for position in positions.values():
                if total_value_usd > 0:
                    position.percentage = position.value_usd / total_value_usd
            
            return positions
            
        except Exception as e:
            print(f"Error getting portfolio balance: {e}")
            return {}
    
    async def analyze_portfolio(self) -> Dict:
        """Analyze current portfolio vs target allocation"""
        positions = await self.get_portfolio_balance()
        
        analysis = {
            "positions": positions,
            "total_value_usd": sum(p.value_usd for p in positions.values()),
            "deviations": {},
            "rebalance_needed": False,
            "recommended_actions": []
        }
        
        # Calculate deviations
        for token, target_pct in self.target_allocation.items():
            current_pct = positions.get(token, PortfolioPosition(token, 0, 0, 0)).percentage
            deviation = abs(current_pct - target_pct)
            analysis["deviations"][token] = {
                "current": current_pct,
                "target": target_pct,
                "deviation": deviation
            }
            
            if deviation > self.rebalance_threshold:
                analysis["rebalance_needed"] = True
                
                if current_pct > target_pct:
                    action = f"Sell {token} (over-allocated by {deviation:.1%})"
                else:
                    action = f"Buy {token} (under-allocated by {deviation:.1%})"
                    
                analysis["recommended_actions"].append(action)
        
        return analysis
    
    async def execute_rebalance(self, analysis: Dict) -> List[str]:
        """Execute rebalancing trades"""
        signatures = []
        
        if not analysis["rebalance_needed"]:
            print("✅ Portfolio is balanced, no trades needed")
            return signatures
        
        print(f"\n⚖️  Executing Rebalance")
        print(f"   Total Value: ${analysis['total_value_usd']:.2f}")
        print(f"   Recommended Actions:")
        for action in analysis["recommended_actions"]:
            print(f"   - {action}")
        
        # In production, would execute actual trades here
        # For demo, we'll simulate the trades
        print(f"\n🚧 Demo Mode: Simulating trades (no real transactions)")
        
        # Example: If SOL is over-allocated, swap some to USDC
        for token, deviation_data in analysis["deviations"].items():
            if deviation_data["deviation"] > self.rebalance_threshold:
                deviation_pct = deviation_data["deviation"]
                print(f"   📊 Would rebalance {token}: {deviation_pct:.1%} deviation")
        
        return signatures
    
    async def monitor_and_rebalance(self, interval_seconds: int = 300):
        """Continuously monitor portfolio and rebalance when needed"""
        print("=" * 70)
        print("🤖 DeFi PORTFOLIO MANAGER - LIVE DEMO")
        print("=" * 70)
        print(f"Wallet: {self.wallet.pubkey()}")
        print(f"Monitoring interval: {interval_seconds}s")
        print(f"Rebalance threshold: {self.rebalance_threshold:.1%}")
        print("\nTarget Allocation:")
        for token, pct in self.target_allocation.items():
            print(f"  {token}: {pct:.0%}")
        
        iteration = 0
        while True:
            iteration += 1
            timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            
            print(f"\n{'=' * 70}")
            print(f"📊 Iteration #{iteration} - {timestamp}")
            print(f"{'=' * 70}")
            
            # Analyze portfolio
            analysis = await self.analyze_portfolio()
            
            # Display current positions
            print(f"\n💼 Current Portfolio:")
            print(f"   Total Value: ${analysis['total_value_usd']:.2f}")
            for token, position in analysis["positions"].items():
                print(f"   {token}: {position.amount:.4f} (${position.value_usd:.2f}, {position.percentage:.1%})")
            
            # Display deviations
            print(f"\n📈 Allocation Analysis:")
            for token, dev_data in analysis["deviations"].items():
                current = dev_data["current"]
                target = dev_data["target"]
                deviation = dev_data["deviation"]
                status = "⚠️ " if deviation > self.rebalance_threshold else "✅"
                print(f"   {status} {token}: {current:.1%} vs {target:.1%} target (dev: {deviation:.1%})")
            
            # Execute rebalance if needed
            if analysis["rebalance_needed"]:
                print(f"\n🔄 Rebalancing Required!")
                signatures = await self.execute_rebalance(analysis)
                if signatures:
                    print(f"✅ Rebalance complete: {len(signatures)} transactions")
            else:
                print(f"\n✅ Portfolio balanced, no action needed")
            
            # Wait for next iteration
            print(f"\n⏳ Sleeping for {interval_seconds}s...")
            await asyncio.sleep(interval_seconds)


async def main():
    """Run portfolio manager demo"""
    load_dotenv()
    
    # Load execution agent wallet (handles trades)
    wallet_path = os.getenv("EXECUTION_AGENT_KEYPAIR", "keys/execution-keypair.json")
    with open(wallet_path, 'r') as f:
        secret = json.load(f)
    wallet = Keypair.from_bytes(bytes(secret))
    
    # Initialize RPC client
    rpc_url = os.getenv("RPC_URL", "https://api.devnet.solana.com")
    rpc_client = AsyncClient(rpc_url)
    
    try:
        # Create portfolio manager
        manager = DeFiPortfolioManager(wallet, rpc_client)
        
        # Run continuous monitoring (demo: run for 3 iterations)
        for _ in range(3):
            analysis = await manager.analyze_portfolio()
            
            # Display analysis
            print(f"\n💼 Portfolio Analysis:")
            print(f"   Total Value: ${analysis['total_value_usd']:.2f}")
            for token, pos in analysis["positions"].items():
                print(f"   {token}: {pos.amount:.4f} (${pos.value_usd:.2f}, {pos.percentage:.1%})")
            
            if analysis["rebalance_needed"]:
                print(f"\n🔄 Rebalance needed:")
                for action in analysis["recommended_actions"]:
                    print(f"   - {action}")
            else:
                print(f"\n✅ Portfolio balanced")
            
            await asyncio.sleep(5)
        
    finally:
        await rpc_client.close()


if __name__ == "__main__":
    asyncio.run(main())
