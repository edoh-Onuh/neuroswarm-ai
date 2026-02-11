# Generate Keypairs Script for Windows
# Run this after setup-windows.ps1

Write-Host "=== Generating Agent Keypairs ===" -ForegroundColor Cyan
Write-Host ""

# Create keys directory
if (-not (Test-Path "keys")) {
    New-Item -ItemType Directory -Path "keys" | Out-Null
    Write-Host "✅ Created keys directory" -ForegroundColor Green
}

# Generate keypairs
$keypairs = @(
    "authority",
    "consensus",
    "analytics",
    "risk",
    "learning",
    "execution"
)

foreach ($name in $keypairs) {
    $keypairPath = "keys/$name-keypair.json"
    
    if (Test-Path $keypairPath) {
        Write-Host "⏭️  Skipping $name (already exists)" -ForegroundColor Yellow
    } else {
        Write-Host "Generating $name keypair..." -ForegroundColor Yellow
        solana-keygen new --outfile $keypairPath --no-bip39-passphrase --silent
        
        $pubkey = solana-keygen pubkey $keypairPath
        Write-Host "✅ $name : $pubkey" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "=== Airdropping SOL (Devnet) ===" -ForegroundColor Cyan
Write-Host "This may take a moment..." -ForegroundColor Yellow
Write-Host ""

# Airdrop SOL to each keypair
solana airdrop 2 (solana-keygen pubkey keys/authority-keypair.json) 2>$null
Write-Host "✅ Authority: 2 SOL" -ForegroundColor Green

solana airdrop 1 (solana-keygen pubkey keys/consensus-keypair.json) 2>$null
Write-Host "✅ Consensus: 1 SOL" -ForegroundColor Green

solana airdrop 1 (solana-keygen pubkey keys/analytics-keypair.json) 2>$null
Write-Host "✅ Analytics: 1 SOL" -ForegroundColor Green

solana airdrop 1 (solana-keygen pubkey keys/risk-keypair.json) 2>$null
Write-Host "✅ Risk: 1 SOL" -ForegroundColor Green

solana airdrop 1 (solana-keygen pubkey keys/learning-keypair.json) 2>$null
Write-Host "✅ Learning: 1 SOL" -ForegroundColor Green

Write-Host ""
Write-Host "=== Setup .env file ===" -ForegroundColor Cyan

if (Test-Path ".env") {
    Write-Host "⏭️  .env already exists" -ForegroundColor Yellow
} else {
    Copy-Item ".env.example" ".env"
    Write-Host "✅ Created .env from template" -ForegroundColor Green
    Write-Host ""
    Write-Host "⚠️  Remember to update PROGRAM_ID in .env after deployment!" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "=== All Done! ===" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Build: anchor build" -ForegroundColor White
Write-Host "2. Deploy: anchor deploy --provider.cluster devnet" -ForegroundColor White
Write-Host "3. Update PROGRAM_ID in .env file" -ForegroundColor White
Write-Host "4. Initialize: python scripts/initialize_swarm.py" -ForegroundColor White
Write-Host ""
