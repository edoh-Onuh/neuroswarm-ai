"""
Jupiter DEX Integration for Agent Swarm
Enables agents to execute real trades on Solana's largest aggregator
"""
import os
import asyncio
import aiohttp
from typing import Dict, List, Optional
from solders.keypair import Keypair
from solders.pubkey import Pubkey
from solana.rpc.async_api import AsyncClient
from solders.transaction import VersionedTransaction
from solders.message import MessageV0
import base64


class JupiterClient:
    """Client for interacting with Jupiter API for token swaps"""
    
    def __init__(self, rpc_client: AsyncClient, wallet: Keypair):
        self.rpc_client = rpc_client
        self.wallet = wallet
        self.base_url = "https://quote-api.jup.ag/v6"
        
    async def get_quote(
        self,
        input_mint: str,
        output_mint: str,
        amount: int,
        slippage_bps: int = 50  # 0.5% default slippage
    ) -> Optional[Dict]:
        """
        Get swap quote from Jupiter
        
        Args:
            input_mint: Input token mint address
            output_mint: Output token mint address
            amount: Amount in smallest units (lamports for SOL)
            slippage_bps: Slippage tolerance in basis points
            
        Returns:
            Quote data or None if failed
        """
        try:
            params = {
                "inputMint": input_mint,
                "outputMint": output_mint,
                "amount": str(amount),
                "slippageBps": str(slippage_bps),
            }
            
            async with aiohttp.ClientSession() as session:
                async with session.get(f"{self.base_url}/quote", params=params) as resp:
                    if resp.status == 200:
                        quote = await resp.json()
                        return quote
                    else:
                        print(f"Jupiter quote error: {resp.status}")
                        return None
                        
        except Exception as e:
            print(f"Error getting Jupiter quote: {e}")
            return None
    
    async def get_swap_transaction(
        self,
        quote: Dict,
        user_public_key: str,
        wrap_unwrap_sol: bool = True,
        compute_unit_price_micro_lamports: Optional[int] = None
    ) -> Optional[Dict]:
        """
        Get swap transaction from Jupiter
        
        Args:
            quote: Quote data from get_quote()
            user_public_key: User's public key as string
            wrap_unwrap_sol: Whether to wrap/unwrap SOL
            compute_unit_price_micro_lamports: Priority fee
            
        Returns:
            Transaction data or None if failed
        """
        try:
            payload = {
                "quoteResponse": quote,
                "userPublicKey": user_public_key,
                "wrapAndUnwrapSol": wrap_unwrap_sol,
            }
            
            if compute_unit_price_micro_lamports:
                payload["computeUnitPriceMicroLamports"] = compute_unit_price_micro_lamports
            
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    f"{self.base_url}/swap",
                    json=payload
                ) as resp:
                    if resp.status == 200:
                        swap_data = await resp.json()
                        return swap_data
                    else:
                        error_text = await resp.text()
                        print(f"Jupiter swap error: {resp.status} - {error_text}")
                        return None
                        
        except Exception as e:
            print(f"Error getting swap transaction: {e}")
            return None
    
    async def execute_swap(
        self,
        input_mint: str,
        output_mint: str,
        amount: int,
        slippage_bps: int = 50,
        priority_fee: Optional[int] = None
    ) -> Optional[str]:
        """
        Execute a token swap via Jupiter
        
        Args:
            input_mint: Input token mint address
            output_mint: Output token mint address  
            amount: Amount in smallest units
            slippage_bps: Slippage tolerance in basis points
            priority_fee: Priority fee in micro-lamports
            
        Returns:
            Transaction signature or None if failed
        """
        try:
            # Get quote
            print(f"🔍 Getting quote: {amount} {input_mint[:8]}... -> {output_mint[:8]}...")
            quote = await self.get_quote(input_mint, output_mint, amount, slippage_bps)
            
            if not quote:
                print("❌ Failed to get quote")
                return None
            
            in_amount = int(quote.get("inAmount", 0))
            out_amount = int(quote.get("outAmount", 0))
            price_impact = float(quote.get("priceImpactPct", 0))
            
            print(f"📊 Quote: {in_amount} -> {out_amount} (impact: {price_impact:.4f}%)")
            
            # Get swap transaction
            print(f"📝 Building swap transaction...")
            swap_data = await self.get_swap_transaction(
                quote,
                str(self.wallet.pubkey()),
                wrap_unwrap_sol=True,
                compute_unit_price_micro_lamports=priority_fee
            )
            
            if not swap_data:
                print("❌ Failed to get swap transaction")
                return None
            
            # Deserialize and sign transaction
            swap_tx_b64 = swap_data.get("swapTransaction")
            if not swap_tx_b64:
                print("❌ No swap transaction in response")
                return None
            
            swap_tx_bytes = base64.b64decode(swap_tx_b64)
            transaction = VersionedTransaction.from_bytes(swap_tx_bytes)
            
            # Sign transaction
            transaction.sign([self.wallet])
            
            # Send transaction
            print(f"📤 Sending swap transaction...")
            result = await self.rpc_client.send_transaction(transaction)
            signature = str(result.value)
            
            print(f"⏳ Confirming transaction: {signature}")
            await self.rpc_client.confirm_transaction(signature)
            
            print(f"✅ Swap successful: {signature}")
            return signature
            
        except Exception as e:
            print(f"❌ Error executing swap: {e}")
            return None
    
    async def get_token_price(self, mint_address: str) -> Optional[float]:
        """
        Get token price in USD
        
        Args:
            mint_address: Token mint address
            
        Returns:
            Price in USD or None
        """
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(
                    f"https://price.jup.ag/v4/price?ids={mint_address}"
                ) as resp:
                    if resp.status == 200:
                        data = await resp.json()
                        price_data = data.get("data", {}).get(mint_address)
                        if price_data:
                            return float(price_data.get("price", 0))
                    return None
        except Exception as e:
            print(f"Error getting token price: {e}")
            return None


# Common token addresses on Solana
TOKENS = {
    "SOL": "So11111111111111111111111111111111111111112",  # Wrapped SOL
    "USDC": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
    "USDT": "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB",
    "BONK": "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263",
    "JUP": "JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN",
    "RAY": "4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R",
    "ORCA": "orcaEKTdK7LKz57vaAYr9QeNsVEPfiu6QeMU1kektZE",
}


async def test_jupiter_swap():
    """Test Jupiter integration"""
    from dotenv import load_dotenv
    import json
    
    load_dotenv()
    
    # Load wallet
    wallet_path = os.getenv("CONSENSUS_AGENT_KEYPAIR", "keys/consensus-keypair.json")
    with open(wallet_path, 'r') as f:
        secret = json.load(f)
    wallet = Keypair.from_bytes(bytes(secret))
    
    # Initialize client
    rpc_url = os.getenv("RPC_URL", "https://api.devnet.solana.com")
    rpc_client = AsyncClient(rpc_url)
    
    jupiter = JupiterClient(rpc_client, wallet)
    
    # Test: Get SOL price
    print("\n" + "=" * 60)
    print("Testing Jupiter Integration")
    print("=" * 60)
    
    sol_price = await jupiter.get_token_price(TOKENS["SOL"])
    if sol_price:
        print(f"\n💰 SOL Price: ${sol_price:.2f}")
    
    # Test: Get quote (0.01 SOL -> USDC)
    amount = 10_000_000  # 0.01 SOL in lamports
    quote = await jupiter.get_quote(
        TOKENS["SOL"],
        TOKENS["USDC"],
        amount,
        slippage_bps=50
    )
    
    if quote:
        print(f"\n📊 Quote for 0.01 SOL -> USDC:")
        print(f"   Output: {int(quote['outAmount']) / 1_000_000:.4f} USDC")
        print(f"   Price Impact: {float(quote['priceImpactPct']):.4f}%")
        print(f"   Route: {len(quote['routePlan'])} hop(s)")
    
    await rpc_client.close()


if __name__ == "__main__":
    asyncio.run(test_jupiter_swap())
