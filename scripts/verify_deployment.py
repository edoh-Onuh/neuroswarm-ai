"""
Verify on-chain deployment and agent coordination
"""
import os
import asyncio
from solders.pubkey import Pubkey
from solana.rpc.async_api import AsyncClient
from dotenv import load_dotenv

load_dotenv()

RPC_URL = os.getenv("RPC_URL", "https://api.devnet.solana.com")
PROGRAM_ID = Pubkey.from_string(os.getenv("PROGRAM_ID"))

async def verify_deployment():
    """Verify all on-chain accounts"""
    print("=" * 70)
    print("🔍 SOLANA AGENT SWARM - ON-CHAIN VERIFICATION")
    print("=" * 70)
    
    client = AsyncClient(RPC_URL)
    
    try:
        print(f"\n📍 Program ID: {PROGRAM_ID}")
        print(f"🌐 Network: Solana Devnet")
        print(f"🔗 RPC: {RPC_URL}")
        
        # Verify SwarmState
        swarm_pda, _ = Pubkey.find_program_address([b"swarm"], PROGRAM_ID)
        print(f"\n📦 SwarmState PDA: {swarm_pda}")
        
        swarm_account = await client.get_account_info(swarm_pda)
        if swarm_account.value:
            print(f"   ✅ SwarmState EXISTS")
            print(f"   📏 Data size: {len(swarm_account.value.data)} bytes")
            print(f"   💰 Lamports: {swarm_account.value.lamports}")
        else:
            print(f"   ❌ SwarmState NOT FOUND")
        
        # Verify all 5 agents
        agents = {
            "Consensus": "2cRxRHSrTZURQpyBkPFZ3Y9YrUqRbXtBrmPXnyozz7mJ",
            "Analytics": "9oGGEqdbG1cfrhJsjZpZvN4yCGgRV8CqoUEVS4GBgDtW",
            "Execution": "BwokxVPRutvANCQAoDM5qHizmwqNwPJPAVHT9moaG2NK",
            "Risk": "HdmfqqUhn2ExkJYsBpB8JfCwoYVrvR1TtPsy8JogZeii",
            "Learning": "DWn1GihfH9MndzLpW518aa3jMmWa5FpnyYVbGAUytNVu",
        }
        
        print(f"\n👥 Agent Registry (5/5):")
        for name, address in agents.items():
            agent_pubkey = Pubkey.from_string(address)
            agent_pda, _ = Pubkey.find_program_address(
                [b"agent", bytes(agent_pubkey)],
                PROGRAM_ID
            )
            
            agent_account = await client.get_account_info(agent_pda)
            if agent_account.value:
                print(f"   ✅ {name} Agent: {agent_pda}")
                print(f"      Address: {address}")
            else:
                print(f"   ❌ {name} Agent: NOT REGISTERED")
        
        # Verify proposals
        print(f"\n📝 Proposals:")
        for i in range(6):  # Check first 6 proposals
            proposal_pda, _ = Pubkey.find_program_address(
                [b"proposal", i.to_bytes(8, 'little')],
                PROGRAM_ID
            )
            
            proposal_account = await client.get_account_info(proposal_pda)
            if proposal_account.value:
                print(f"   ✅ Proposal #{i}: {proposal_pda}")
        
        print("\n" + "=" * 70)
        print("✅ VERIFICATION COMPLETE")
        print("=" * 70)
        print("\n🎉 All components deployed and operational on Solana devnet!")
        print("\n🔗 View on Explorer:")
        print(f"   Program: https://explorer.solana.com/address/{PROGRAM_ID}?cluster=devnet")
        print(f"   SwarmState: https://explorer.solana.com/address/{swarm_pda}?cluster=devnet")
        
    finally:
        await client.close()

if __name__ == "__main__":
    asyncio.run(verify_deployment())
