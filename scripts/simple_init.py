"""
Simple initialization script using direct Solana transactions
"""
import os
import json
import asyncio
from pathlib import Path
from solders.keypair import Keypair
from solders.pubkey import Pubkey
from solders.system_program import ID as SYS_PROGRAM_ID
from solana.rpc.async_api import AsyncClient
from solders.transaction import VersionedTransaction
from solders.instruction import Instruction, AccountMeta
from solders.message import MessageV0
from solders.commitment_config import CommitmentLevel
from dotenv import load_dotenv
import struct

# Load environment
load_dotenv()

RPC_URL = os.getenv("RPC_URL", "https://api.devnet.solana.com")
PROGRAM_ID = Pubkey.from_string(os.getenv("PROGRAM_ID"))
AUTHORITY_KEYPAIR_PATH = os.getenv("AUTHORITY_KEYPAIR")

def load_keypair(path: str) -> Keypair:
    """Load keypair from file"""
    with open(path, 'r') as f:
        secret = json.load(f)
    return Keypair.from_bytes(bytes(secret))

async def initialize_swarm():
    """Initialize the swarm state on-chain"""
    
    if not AUTHORITY_KEYPAIR_PATH:
        raise ValueError("AUTHORITY_KEYPAIR environment variable not set")
    
    # Load authority keypair
    authority = load_keypair(AUTHORITY_KEYPAIR_PATH)
    print(f"Authority: {authority.pubkey()}")
    print(f"Program ID: {PROGRAM_ID}")
    
    # Derive swarm state PDA
    swarm_state_seeds = [b"swarm"]
    swarm_state_pda, bump = Pubkey.find_program_address(swarm_state_seeds, PROGRAM_ID)
    print(f"Swarm State PDA: {swarm_state_pda}")
    
    # Create client
    client = AsyncClient(RPC_URL)
    
    try:
        # Check if already initialized
        account_info = await client.get_account_info(swarm_state_pda)
        if account_info.value is not None:
            print("Swarm already initialized!")
            return
        
        # Build initialize instruction
        # Discriminator for initialize (first 8 bytes of sha256("global:initialize"))
        discriminator = bytes([175, 175, 109, 31, 13, 152, 155, 237])
        
        # Instruction data: discriminator + max_agents (u8) + min_votes_required (u8) + proposal_timeout (i64)
        max_agents = 5  # 5 agents
        min_votes_required = 3  # 3 out of 5 agents for consensus
        proposal_timeout = 3600  # 1 hour in seconds
        
        instruction_data = discriminator + struct.pack('<BBq', max_agents, min_votes_required, proposal_timeout)
        
        # Create instruction
        keys = [
            AccountMeta(pubkey=swarm_state_pda, is_signer=False, is_writable=True),
            AccountMeta(pubkey=authority.pubkey(), is_signer=True, is_writable=True),
            AccountMeta(pubkey=SYS_PROGRAM_ID, is_signer=False, is_writable=False),
        ]
        
        ix = Instruction(PROGRAM_ID, instruction_data, keys)
        
        # Get recent blockhash
        recent_blockhash_resp = await client.get_latest_blockhash()
        recent_blockhash = recent_blockhash_resp.value.blockhash
        
        # Create and send transaction
        msg = MessageV0.try_compile(
            payer=authority.pubkey(),
            instructions=[ix],
            address_lookup_table_accounts=[],
            recent_blockhash=recent_blockhash,
        )
        tx = VersionedTransaction(msg, [authority])
        
        print("Sending initialize transaction...")
        result = await client.send_transaction(tx)
        print(f"Transaction signature: {result.value}")
        
        # Wait for confirmation
        print("Waiting for confirmation...")
        await client.confirm_transaction(result.value)
        print("✅ Swarm initialized successfully!")
        
    finally:
        await client.close()

if __name__ == "__main__":
    asyncio.run(initialize_swarm())
