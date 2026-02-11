"""Offline DeFi Portfolio Manager Demo

Demonstrates portfolio management logic without requiring live network access.
Uses simulated token balances and prices for testing.
"""
import asyncio
from typing import Dict, List


class OfflinePortfolioManager:
    """Portfolio manager with simulated data for offline testing"""
    
    # Simulated token prices (USD)
    SIMULATED_PRICES = {
        "SOL": 100.0,
        "USDC": 1.0,
        "JUP": 0.75,
        "BONK": 0.00001,
        "RAY": 2.5,
        "ORCA": 1.2,
    }
    
    def __init__(self, wallet_address: str):
        self.wallet_address = wallet_address
        self.target_allocation = {
            "SOL": 0.50,   # 50%
            "USDC": 0.30,  # 30%
            "JUP": 0.10,   # 10%
            "BONK": 0.10,  # 10%
        }
        self.rebalance_threshold = 0.05  # 5% deviation triggers rebalance
        
        # Simulated current holdings
        self.holdings = {
            "SOL": 2.5,      # $250
            "USDC": 100.0,   # $100
            "JUP": 50.0,     # $37.50
            "BONK": 1000000, # $10
        }
    
    def get_token_price(self, token: str) -> float:
        """Get simulated token price"""
        return self.SIMULATED_PRICES.get(token, 0.0)
    
    def calculate_portfolio_value(self) -> Dict:
        """Calculate current portfolio value and allocation"""
        holdings_value = {}
        total_value = 0.0
        
        for token, amount in self.holdings.items():
            price = self.get_token_price(token)
            value = amount * price
            holdings_value[token] = {
                "amount": amount,
                "price": price,
                "value": value
            }
            total_value += value
        
        # Calculate current allocation percentages
        current_allocation = {}
        for token, data in holdings_value.items():
            current_allocation[token] = data["value"] / total_value if total_value > 0 else 0.0
        
        return {
            "holdings": holdings_value,
            "total_value": total_value,
            "current_allocation": current_allocation
        }
    
    def analyze_portfolio(self) -> Dict:
        """Analyze portfolio and determine if rebalancing needed"""
        portfolio = self.calculate_portfolio_value()
        needs_rebalance = False
        deviations = {}
        
        for token, target_pct in self.target_allocation.items():
            current_pct = portfolio["current_allocation"].get(token, 0.0)
            deviation = current_pct - target_pct
            deviations[token] = deviation
            
            if abs(deviation) > self.rebalance_threshold:
                needs_rebalance = True
        
        return {
            **portfolio,
            "target_allocation": self.target_allocation,
            "deviations": deviations,
            "needs_rebalance": needs_rebalance
        }
    
    def generate_rebalance_plan(self, analysis: Dict) -> List[Dict]:
        """Generate rebalancing trades"""
        trades = []
        total_value = analysis["total_value"]
        
        for token, target_pct in self.target_allocation.items():
            current_value = analysis["holdings"].get(token, {}).get("value", 0.0)
            target_value = total_value * target_pct
            difference = target_value - current_value
            
            if abs(difference) > 1.0:  # $1 minimum
                action = "buy" if difference > 0 else "sell"
                amount_usd = abs(difference)
                price = self.get_token_price(token)
                amount_tokens = amount_usd / price if price > 0 else 0
                
                trades.append({
                    "token": token,
                    "action": action,
                    "amount_tokens": amount_tokens,
                    "amount_usd": amount_usd,
                    "current_pct": analysis["current_allocation"].get(token, 0.0) * 100,
                    "target_pct": target_pct * 100,
                    "deviation_pct": analysis["deviations"].get(token, 0.0) * 100
                })
        
        return sorted(trades, key=lambda x: abs(x["amount_usd"]), reverse=True)
    
    async def monitor_and_rebalance(self, iterations: int = 3):
        """Monitor portfolio and rebalance when needed"""
        print("🤖 Starting Offline Portfolio Manager Demo\n")
        print(f"Wallet: {self.wallet_address[:8]}...{self.wallet_address[-8:]}\n")
        print("=" * 60)
        
        for i in range(iterations):
            print(f"\n📊 Iteration {i + 1}/{iterations}")
            print("-" * 60)
            
            # Analyze portfolio
            analysis = self.analyze_portfolio()
            
            print(f"\n💼 Portfolio Status:")
            print(f"   Total Value: ${analysis['total_value']:.2f}")
            print(f"   Needs Rebalance: {'YES' if analysis['needs_rebalance'] else 'NO'}")
            
            print(f"\n📈 Current Holdings:")
            for token, data in analysis["holdings"].items():
                current_pct = analysis["current_allocation"][token] * 100
                target_pct = self.target_allocation.get(token, 0.0) * 100
                deviation = analysis["deviations"].get(token, 0.0) * 100
                
                status = "✅" if abs(deviation) <= self.rebalance_threshold * 100 else "⚠️"
                print(f"   {status} {token:6} {data['amount']:>12.2f} @ ${data['price']:<8.2f} = ${data['value']:>8.2f} ({current_pct:>5.1f}% | Target: {target_pct:.1f}%)")
            
            # Generate rebalance plan if needed
            if analysis["needs_rebalance"]:
                trades = self.generate_rebalance_plan(analysis)
                
                print(f"\n🔄 Rebalance Plan:")
                for trade in trades:
                    action_symbol = "📈" if trade["action"] == "buy" else "📉"
                    print(f"   {action_symbol} {trade['action'].upper():4} {trade['amount_tokens']:.2f} {trade['token']} "
                          f"(${trade['amount_usd']:.2f}) - Deviation: {trade['deviation_pct']:+.1f}%")
                
                # Simulate execution
                print(f"\n⚡ Executing {len(trades)} trades...")
                await asyncio.sleep(1)  # Simulate execution time
                
                # Update holdings to reflect rebalancing
                for trade in trades:
                    token = trade["token"]
                    if trade["action"] == "buy":
                        self.holdings[token] = self.holdings.get(token, 0) + trade["amount_tokens"]
                    else:
                        self.holdings[token] = max(0, self.holdings.get(token, 0) - trade["amount_tokens"])
                
                print("   ✅ All trades executed successfully")
            else:
                print("\n   ℹ️  Portfolio is balanced, no action needed")
            
            if i < iterations - 1:
                print("\n⏳ Waiting 5 seconds before next check...")
                await asyncio.sleep(5)
        
        print("\n" + "=" * 60)
        print("✅ Demo complete!")
        
        # Final analysis
        final_analysis = self.analyze_portfolio()
        print(f"\n📊 Final Portfolio State:")
        print(f"   Total Value: ${final_analysis['total_value']:.2f}")
        print(f"   Balanced: {'YES ✅' if not final_analysis['needs_rebalance'] else 'NO ⚠️'}")


async def main():
    """Run the offline demo"""
    manager = OfflinePortfolioManager(
        wallet_address="11111111111111111111111111111111"
    )
    
    await manager.monitor_and_rebalance(iterations=3)


if __name__ == "__main__":
    print("🌐 Running in OFFLINE mode (simulated data)\n")
    asyncio.run(main())
