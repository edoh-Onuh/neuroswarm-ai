"""SDK Utilities"""
import json
from solders.keypair import Keypair
from pathlib import Path


def generate_keypair() -> Keypair:
    """Generate a new keypair"""
    return Keypair()


def load_keypair(path: str) -> Keypair:
    """Load keypair from JSON file"""
    with open(path, 'r') as f:
        secret = json.load(f)
    return Keypair.from_bytes(bytes(secret))


async def get_token_balance(pubkey: str, mint: str) -> float:
    """Get token balance"""
    # Implementation would query on-chain token account
    return 0.0
