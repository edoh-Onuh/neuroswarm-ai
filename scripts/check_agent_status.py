"""
Utility script to check agent status on-chain
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


async def check_agent_status():
    """Check status of all registered agents"""
    
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
    
    # Setup client and program
    client = AsyncClient(rpc_url, commitment=Confirmed)
    wallet = Wallet(authority_keypair)
    
    with open(idl_path, 'r') as f:
        idl_dict = json.load(f)
    idl = Idl.from_json(json.dumps(idl_dict))
    
    provider = Provider(client, wallet)
    program = Program(idl, program_id, provider)
    
    try:
        # Get swarm state
        swarm_pda, _ = Pubkey.find_program_address([b"swarm"], program_id)
        swarm_state = await program.account["SwarmState"].fetch(swarm_pda)
        
        logger.info("=" * 60)
        logger.info("SWARM STATUS")
        logger.info("=" * 60)
        logger.info(f"Authority: {swarm_state.authority}")
        logger.info(f"Active Agents: {swarm_state.active_agents}/{swarm_state.max_agents}")
        logger.info(f"Total Proposals: {swarm_state.total_proposals}")
        logger.info(f"Executed Proposals: {swarm_state.executed_proposals}")
        logger.info(f"Min Votes Required: {swarm_state.min_votes_required}")
        logger.info(f"Proposal Timeout: {swarm_state.proposal_timeout}s")
        
        # Check each agent
        agent_types = [
            "CONSENSUS",
            "ANALYTICS",
            "RISK",
            "LEARNING"
        ]
        
        agent_keypair_envs = [
            "CONSENSUS_AGENT_KEYPAIR",
            "ANALYTICS_AGENT_KEYPAIR",
            "RISK_AGENT_KEYPAIR",
            "LEARNING_AGENT_KEYPAIR"
        ]
        
        logger.info("\n" + "=" * 60)
        logger.info("AGENT STATUS")
        logger.info("=" * 60)
        
        for agent_type, keypair_env in zip(agent_types, agent_keypair_envs):
            keypair_path = os.getenv(keypair_env)
            
            if not keypair_path or not os.path.exists(keypair_path):
                logger.warning(f"{agent_type}: Keypair not found")
                continue
            
            with open(keypair_path, 'r') as f:
                kp_data = json.load(f)
            agent_keypair = Keypair.from_bytes(bytes(kp_data))
            
            # Get agent PDA
            agent_pda, _ = Pubkey.find_program_address(
                [b"agent", bytes(agent_keypair.pubkey())],
                program_id
            )
            
            try:
                agent = await program.account["Agent"].fetch(agent_pda)
                
                logger.info(f"\n{agent_type} Agent:")
                logger.info(f"  Name: {agent.name}")
                logger.info(f"  Public Key: {agent_keypair.pubkey()}")
                logger.info(f"  PDA: {agent_pda}")
                logger.info(f"  Reputation: {agent.reputation}")
                logger.info(f"  Proposals Created: {agent.proposals_created}")
                logger.info(f"  Votes Cast: {agent.votes_cast}")
                logger.info(f"  Successful Proposals: {agent.successful_proposals}")
                logger.info(f"  Active: {'✅' if agent.is_active else '❌'}")
                
            except Exception as e:
                logger.warning(f"{agent_type}: Not registered ({e})")
        
        logger.info("\n" + "=" * 60)
        
    except Exception as e:
        logger.error(f"Error checking agent status: {e}")
        raise
    finally:
        await client.close()


if __name__ == "__main__":
    asyncio.run(check_agent_status())
