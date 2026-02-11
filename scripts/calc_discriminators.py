"""
Calculate Anchor instruction discriminators
"""
import hashlib

def calculate_discriminator(namespace: str, name: str) -> bytes:
    """Calculate 8-byte discriminator for Anchor instruction"""
    preimage = f"{namespace}:{name}"
    hash_result = hashlib.sha256(preimage.encode()).digest()
    return hash_result[:8]

# Calculate discriminators for all instructions
instructions = [
    ("global", "initialize"),
    ("global", "register_agent"),
    ("global", "create_proposal"),
    ("global", "vote_proposal"),
    ("global", "execute_proposal"),
    ("global", "update_reputation"),
    ("global", "record_outcome"),
]

print("Anchor Instruction Discriminators:")
print("=" * 60)
for namespace, name in instructions:
    disc = calculate_discriminator(namespace, name)
    print(f"{name:20s}: {list(disc)}")
    print(f"{'':20s}  {disc.hex()}")
