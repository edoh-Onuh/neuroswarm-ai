"""
Initialization script for Solana Agent Swarm

This script initializes the swarm state on-chain.
Run this ONCE after deploying the program.
"""

import asyncio
import os
import json
import logging
from dotenv import load_dotenv

from solders.pubkey import Pubkey
from solders.keypair import Keypair
from solana.rpc.async_api import AsyncClient
from solana.rpc.commitment import Confirmed
from anchorpy import Provider, Wallet, Program, Idl

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


async def initialize_swarm():
    """Initialize the agent swarm on-chain"""
    
    load_dotenv()
    
    # Load configuration
    rpc_url = os.getenv("RPC_URL", "https://api.devnet.solana.com")
    program_id = Pubkey.from_string(os.getenv("PROGRAM_ID"))
    idl_path = os.getenv("IDL_PATH")
    authority_keypair_path = os.getenv("AUTHORITY_KEYPAIR")
    
    # Load authority keypair
    with open(authority_keypair_path, 'r') as f:
        keypair_data = json.load(f)
    authority_keypair = Keypair.from_bytes(bytes(keypair_data))
    
    logger.info(f"Authority: {authority_keypair.pubkey()}")
    logger.info(f"Program ID: {program_id}")
    logger.info(f"RPC: {rpc_url}")
    
    # Setup client and program
    client = AsyncClient(rpc_url, commitment=Confirmed)
    wallet = Wallet(authority_keypair)
    
    with open(idl_path, 'r') as f:
        idl_dict = json.load(f)
    idl = Idl.from_json(json.dumps(idl_dict))
    
    provider = Provider(client, wallet)
    program = Program(idl, program_id, provider)
    
    # Get swarm PDA
    swarm_pda, bump = Pubkey.find_program_address([b"swarm"], program_id)
    logger.info(f"Swarm PDA: {swarm_pda}")
    
    # Configuration
    max_agents = int(os.getenv("MAX_AGENTS", 5))
    min_votes_required = int(os.getenv("MIN_VOTES_REQUIRED", 3))
    proposal_timeout = int(os.getenv("PROPOSAL_TIMEOUT", 3600))
    
    logger.info(f"Configuration:")
    logger.info(f"  Max Agents: {max_agents}")
    logger.info(f"  Min Votes Required: {min_votes_required}")
    logger.info(f"  Proposal Timeout: {proposal_timeout}s")
    
    try:
        # Check if already initialized
        try:
            swarm_state = await program.account["SwarmState"].fetch(swarm_pda)
            logger.info("✅ Swarm already initialized!")
            logger.info(f"   Active Agents: {swarm_state.active_agents}")
            logger.info(f"   Total Proposals: {swarm_state.total_proposals}")
            return
        except:
            pass  # Not initialized yet, proceed
        
        # Initialize the swarm
        logger.info("Initializing swarm...")
        
        tx = await program.rpc["initialize"](
            max_agents,
            min_votes_required,
            proposal_timeout,
            ctx={
                "accounts": {
                    "swarm_state": swarm_pda,
                    "authority": authority_keypair.pubkey(),
                    "system_program": Pubkey.default(),
                },
                "signers": [authority_keypair],
            }
        )
        
        logger.info(f"✅ Swarm initialized successfully!")
        logger.info(f"   Transaction: {tx}")
        logger.info(f"   Swarm PDA: {swarm_pda}")
        
        # Verify initialization
        swarm_state = await program.account["SwarmState"].fetch(swarm_pda)
        logger.info(f"✅ Verification:")
        logger.info(f"   Authority: {swarm_state.authority}")
        logger.info(f"   Max Agents: {swarm_state.max_agents}")
        logger.info(f"   Min Votes: {swarm_state.min_votes_required}")
        
    except Exception as e:
        logger.error(f"❌ Failed to initialize swarm: {e}")
        raise
    finally:
        await client.close()


if __name__ == "__main__":
    asyncio.run(initialize_swarm())
