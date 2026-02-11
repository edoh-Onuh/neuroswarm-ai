"""
Register all 5 agents with the Solana Agent Swarm on-chain program
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
from dotenv import load_dotenv
import struct

# Load environment
load_dotenv()

RPC_URL = os.getenv("RPC_URL", "https://api.devnet.solana.com")
PROGRAM_ID_STR = os.getenv("PROGRAM_ID")

if not PROGRAM_ID_STR:
    raise ValueError("PROGRAM_ID environment variable not set")

PROGRAM_ID = Pubkey.from_string(PROGRAM_ID_STR)

# Agent configurations
AGENTS = [
    {
        "name": "Consensus Agent",
        "keypair_path": os.getenv("CONSENSUS_AGENT_KEYPAIR", "keys/consensus-keypair.json"),
        "agent_type": 0,  # Consensus
    },
    {
        "name": "Analytics Agent", 
        "keypair_path": os.getenv("ANALYTICS_AGENT_KEYPAIR", "keys/analytics-keypair.json"),
        "agent_type": 1,  # Analytics
    },
    {
        "name": "Execution Agent",
        "keypair_path": os.getenv("EXECUTION_AGENT_KEYPAIR", "keys/execution-keypair.json"),
        "agent_type": 2,  # Execution
    },
    {
        "name": "Risk Agent",
        "keypair_path": os.getenv("RISK_AGENT_KEYPAIR", "keys/risk-keypair.json"),
        "agent_type": 3,  # Risk
    },
    {
        "name": "Learning Agent",
        "keypair_path": os.getenv("LEARNING_AGENT_KEYPAIR", "keys/learning-keypair.json"),
        "agent_type": 4,  # Learning
    },
]

def load_keypair(path: str) -> Keypair:
    """Load keypair from file"""
    with open(path, 'r') as f:
        secret = json.load(f)
    return Keypair.from_bytes(bytes(secret))

async def register_agent(client: AsyncClient, agent_config: dict) -> bool:
    """Register a single agent"""
    try:
        agent_keypair = load_keypair(agent_config["keypair_path"])
        agent_pubkey = agent_keypair.pubkey()
        
        print(f"\n🤖 Registering {agent_config['name']}")
        print(f"   Address: {agent_pubkey}")
        
        # Derive PDAs
        swarm_state_pda, _ = Pubkey.find_program_address([b"swarm"], PROGRAM_ID)
        agent_pda, _ = Pubkey.find_program_address(
            [b"agent", bytes(agent_pubkey)], 
            PROGRAM_ID
        )
        
        print(f"   Agent PDA: {agent_pda}")
        
        # Check if already registered
        account_info = await client.get_account_info(agent_pda)
        if account_info.value is not None:
            print(f"   ✅ Already registered!")
            return True
        
        # Build register_agent instruction
        # Discriminator for register_agent (sha256("global:register_agent")[:8])
        discriminator = bytes([135, 157, 66, 195, 2, 113, 175, 30])
        
        # Instruction data: discriminator + agent_type (u8) + name (String with length prefix)
        agent_name = agent_config["name"]
        name_bytes = agent_name.encode('utf-8')
        name_length = len(name_bytes)
        
        # Anchor String format: 4-byte length prefix + string bytes
        instruction_data = discriminator + struct.pack('<B', agent_config["agent_type"]) + struct.pack('<I', name_length) + name_bytes
        
        # Create instruction
        keys = [
            AccountMeta(pubkey=swarm_state_pda, is_signer=False, is_writable=True),
            AccountMeta(pubkey=agent_pda, is_signer=False, is_writable=True),
            AccountMeta(pubkey=agent_pubkey, is_signer=True, is_writable=True),
            AccountMeta(pubkey=SYS_PROGRAM_ID, is_signer=False, is_writable=False),
        ]
        
        ix = Instruction(PROGRAM_ID, instruction_data, keys)
        
        # Get recent blockhash
        recent_blockhash_resp = await client.get_latest_blockhash()
        recent_blockhash = recent_blockhash_resp.value.blockhash
        
        # Create and send transaction
        msg = MessageV0.try_compile(
            payer=agent_pubkey,
            instructions=[ix],
            address_lookup_table_accounts=[],
            recent_blockhash=recent_blockhash,
        )
        tx = VersionedTransaction(msg, [agent_keypair])
        
        print(f"   📤 Sending registration transaction...")
        result = await client.send_transaction(tx)
        print(f"   Transaction: {result.value}")
        
        # Wait for confirmation
        print(f"   ⏳ Waiting for confirmation...")
        await client.confirm_transaction(result.value)
        print(f"   ✅ {agent_config['name']} registered successfully!")
        
        return True
        
    except Exception as e:
        print(f"   ❌ Error registering {agent_config['name']}: {e}")
        return False

async def register_all_agents():
    """Register all 5 agents"""
    print("=" * 60)
    print("🚀 SOLANA AGENT SWARM - AGENT REGISTRATION")
    print("=" * 60)
    print(f"\nProgram ID: {PROGRAM_ID}")
    print(f"RPC URL: {RPC_URL}")
    
    # Derive swarm state PDA
    swarm_state_pda, _ = Pubkey.find_program_address([b"swarm"], PROGRAM_ID)
    print(f"Swarm State: {swarm_state_pda}")
    
    client = AsyncClient(RPC_URL)
    
    try:
        # Verify swarm is initialized
        print(f"\n🔍 Verifying swarm initialization...")
        account_info = await client.get_account_info(swarm_state_pda)
        if account_info.value is None:
            print("❌ Swarm not initialized! Run simple_init.py first.")
            return
        print("✅ Swarm initialized and ready")
        
        # Register each agent
        results = []
        for agent_config in AGENTS:
            result = await register_agent(client, agent_config)
            results.append(result)
            await asyncio.sleep(1)  # Brief pause between registrations
        
        # Summary
        print("\n" + "=" * 60)
        print("📊 REGISTRATION SUMMARY")
        print("=" * 60)
        successful = sum(results)
        print(f"✅ Successfully registered: {successful}/{len(AGENTS)} agents")
        
        if successful == len(AGENTS):
            print("\n🎉 All agents registered! The swarm is ready for autonomous operation.")
            print("\nNext steps:")
            print("1. Run: python scripts/demonstrate_coordination.py")
            print("2. Or run: python run_swarm.py")
        else:
            print(f"\n⚠️  {len(AGENTS) - successful} agent(s) failed to register")
            print("Check the errors above and try again.")
        
    finally:
        await client.close()

if __name__ == "__main__":
    asyncio.run(register_all_agents())
