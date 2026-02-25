"""
Jupiter DEX Integration for Agent Swarm
Enables agents to execute real trades on Solana's largest aggregator

Uses Jupiter Swap API v1 (https://docs.jup.ag/docs/apis/swap-api)
and Jupiter Price API v2 (https://docs.jup.ag/docs/apis/price-api-v2)
"""
import os
import asyncio
import logging
import aiohttp
from typing import Dict, List, Optional
from solders.keypair import Keypair
from solders.pubkey import Pubkey
from solana.rpc.async_api import AsyncClient
from solders.transaction import VersionedTransaction
from solders.message import MessageV0
import base64

logger = logging.getLogger(__name__)

# Default timeout for all HTTP requests (seconds)
_DEFAULT_TIMEOUT = aiohttp.ClientTimeout(total=30)

# Max retries for transient failures
_MAX_RETRIES = 3
_RETRY_BACKOFF = 1.0  # seconds, doubled each retry


class JupiterClient:
    """Client for interacting with Jupiter API for token swaps.

    Uses a shared ``aiohttp.ClientSession`` for connection reuse.
    Call ``close()`` (or use as async context manager) when done.
    """

    # Current Jupiter API endpoints (v1 swap, v2 price)
    QUOTE_URL = "https://api.jup.ag/swap/v1/quote"
    SWAP_URL = "https://api.jup.ag/swap/v1/swap"
    PRICE_URL = "https://api.jup.ag/price/v2"

    def __init__(self, rpc_client: AsyncClient, wallet: Keypair):
        self.rpc_client = rpc_client
        self.wallet = wallet
        self._session: Optional[aiohttp.ClientSession] = None

    async def _get_session(self) -> aiohttp.ClientSession:
        """Return (and lazily create) a reusable HTTP session."""
        if self._session is None or self._session.closed:
            self._session = aiohttp.ClientSession(timeout=_DEFAULT_TIMEOUT)
        return self._session

    async def close(self) -> None:
        """Close the underlying HTTP session."""
        if self._session and not self._session.closed:
            await self._session.close()
            self._session = None

    async def __aenter__(self):
        return self

    async def __aexit__(self, *exc):
        await self.close()

    # ── internal retry helper ────────────────────────────────────

    async def _request_with_retry(
        self,
        method: str,
        url: str,
        *,
        params: Optional[Dict] = None,
        json_payload: Optional[Dict] = None,
    ) -> Optional[Dict]:
        """Execute an HTTP request with retries and proper error handling."""
        session = await self._get_session()
        last_error: Optional[Exception] = None
        backoff = _RETRY_BACKOFF

        for attempt in range(1, _MAX_RETRIES + 1):
            try:
                if method == "GET":
                    resp = await session.get(url, params=params)
                else:
                    resp = await session.post(url, json=json_payload)

                if resp.status == 200:
                    return await resp.json()

                # Rate limited — wait and retry
                if resp.status == 429:
                    retry_after = float(resp.headers.get("Retry-After", backoff))
                    logger.warning(
                        "Jupiter rate limited (429), retrying in %.1fs (attempt %d/%d)",
                        retry_after, attempt, _MAX_RETRIES,
                    )
                    await asyncio.sleep(retry_after)
                    backoff *= 2
                    continue

                # Non-retryable HTTP error
                error_text = await resp.text()
                logger.error("Jupiter %s %s returned %d: %s", method, url, resp.status, error_text)
                return None

            except asyncio.TimeoutError:
                last_error = asyncio.TimeoutError(f"Timeout on {url}")
                logger.warning("Jupiter request timed out (attempt %d/%d)", attempt, _MAX_RETRIES)
            except aiohttp.ClientError as exc:
                last_error = exc
                logger.warning("Jupiter connection error (attempt %d/%d): %s", attempt, _MAX_RETRIES, exc)

            await asyncio.sleep(backoff)
            backoff *= 2

        logger.error("Jupiter request failed after %d attempts: %s", _MAX_RETRIES, last_error)
        return None

    # ── public methods ───────────────────────────────────────────

    async def get_quote(
        self,
        input_mint: str,
        output_mint: str,
        amount: int,
        slippage_bps: int = 50,  # 0.5% default slippage
    ) -> Optional[Dict]:
        """
        Get swap quote from Jupiter Swap API v1.

        Args:
            input_mint: Input token mint address
            output_mint: Output token mint address
            amount: Amount in smallest units (lamports for SOL)
            slippage_bps: Slippage tolerance in basis points

        Returns:
            Quote data or None if failed
        """
        params = {
            "inputMint": input_mint,
            "outputMint": output_mint,
            "amount": str(amount),
            "slippageBps": str(slippage_bps),
        }
        return await self._request_with_retry("GET", self.QUOTE_URL, params=params)

    async def get_swap_transaction(
        self,
        quote: Dict,
        user_public_key: str,
        wrap_unwrap_sol: bool = True,
        compute_unit_price_micro_lamports: Optional[int] = None,
    ) -> Optional[Dict]:
        """
        Get swap transaction from Jupiter Swap API v1.

        Args:
            quote: Quote data from get_quote()
            user_public_key: User's public key as string
            wrap_unwrap_sol: Whether to wrap/unwrap SOL
            compute_unit_price_micro_lamports: Priority fee

        Returns:
            Transaction data or None if failed
        """
        payload: Dict = {
            "quoteResponse": quote,
            "userPublicKey": user_public_key,
            "wrapAndUnwrapSol": wrap_unwrap_sol,
        }
        if compute_unit_price_micro_lamports:
            payload["computeUnitPriceMicroLamports"] = compute_unit_price_micro_lamports

        return await self._request_with_retry("POST", self.SWAP_URL, json_payload=payload)

    async def execute_swap(
        self,
        input_mint: str,
        output_mint: str,
        amount: int,
        slippage_bps: int = 50,
        priority_fee: Optional[int] = None,
    ) -> Optional[str]:
        """
        Execute a token swap via Jupiter.

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
            logger.info("Getting quote: %d %s... -> %s...", amount, input_mint[:8], output_mint[:8])
            quote = await self.get_quote(input_mint, output_mint, amount, slippage_bps)

            if not quote:
                logger.error("Failed to get quote")
                return None

            in_amount = int(quote.get("inAmount", 0))
            out_amount = int(quote.get("outAmount", 0))
            price_impact = float(quote.get("priceImpactPct", 0))

            logger.info("Quote: %d -> %d (impact: %.4f%%)", in_amount, out_amount, price_impact)

            logger.info("Building swap transaction...")
            swap_data = await self.get_swap_transaction(
                quote,
                str(self.wallet.pubkey()),
                wrap_unwrap_sol=True,
                compute_unit_price_micro_lamports=priority_fee,
            )

            if not swap_data:
                logger.error("Failed to get swap transaction")
                return None

            # Deserialize and sign transaction
            swap_tx_b64 = swap_data.get("swapTransaction")
            if not swap_tx_b64:
                logger.error("No swapTransaction in response")
                return None

            swap_tx_bytes = base64.b64decode(swap_tx_b64)
            transaction = VersionedTransaction.from_bytes(swap_tx_bytes)

            # Sign transaction
            transaction.sign([self.wallet])

            # Send transaction
            logger.info("Sending swap transaction...")
            result = await self.rpc_client.send_transaction(transaction)
            signature = str(result.value)

            logger.info("Confirming transaction: %s", signature)
            await self.rpc_client.confirm_transaction(signature)

            logger.info("Swap successful: %s", signature)
            return signature

        except Exception as e:
            logger.error("Error executing swap: %s", e)
            return None

    async def get_token_price(self, mint_address: str) -> Optional[float]:
        """
        Get token price in USD via Jupiter Price API v2.

        Args:
            mint_address: Token mint address

        Returns:
            Price in USD or None
        """
        try:
            data = await self._request_with_retry(
                "GET", self.PRICE_URL, params={"ids": mint_address}
            )
            if data is None:
                return None

            token_data = data.get("data", {}).get(mint_address)
            if token_data and token_data.get("price") is not None:
                return float(token_data["price"])
            return None
        except (KeyError, ValueError, TypeError) as e:
            logger.error("Error parsing token price: %s", e)
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

    async with JupiterClient(rpc_client, wallet) as jupiter:
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
            print(f"\nQuote for 0.01 SOL -> USDC:")
            print(f"   Output: {int(quote['outAmount']) / 1_000_000:.4f} USDC")
            print(f"   Price Impact: {float(quote.get('priceImpactPct', 0)):.4f}%")
            route_plan = quote.get("routePlan", [])
            print(f"   Route: {len(route_plan)} hop(s)")

    await rpc_client.close()


if __name__ == "__main__":
    asyncio.run(test_jupiter_swap())
