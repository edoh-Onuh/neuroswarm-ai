# Windows Setup Script for Solana Agent Swarm
# Run this in PowerShell (Administrator)

Write-Host "=== Solana Agent Swarm - Windows Setup ===" -ForegroundColor Cyan
Write-Host ""

# Check if running as administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "⚠️  Please run PowerShell as Administrator for complete installation" -ForegroundColor Yellow
    Write-Host ""
}

# Function to check if command exists
function Test-Command($command) {
    try {
        Get-Command $command -ErrorAction Stop | Out-Null
        return $true
    } catch {
        return $false
    }
}

# 1. Check Rust
Write-Host "Checking Rust installation..." -ForegroundColor Yellow
if (Test-Command "cargo") {
    $rustVersion = cargo --version
    Write-Host "✅ Rust is installed: $rustVersion" -ForegroundColor Green
} else {
    Write-Host "❌ Rust is not installed" -ForegroundColor Red
    Write-Host "Installing Rust..." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Please run this command in a new PowerShell window:" -ForegroundColor Cyan
    Write-Host 'Invoke-WebRequest -Uri "https://win.rustup.rs/x86_64" -OutFile "$env:TEMP\rustup-init.exe"; & "$env:TEMP\rustup-init.exe"' -ForegroundColor White
    Write-Host ""
    Write-Host "After installation, close and reopen PowerShell, then run this script again." -ForegroundColor Yellow
    exit
}

# 2. Check Solana CLI
Write-Host ""
Write-Host "Checking Solana CLI installation..." -ForegroundColor Yellow
if (Test-Command "solana") {
    $solanaVersion = solana --version
    Write-Host "✅ Solana CLI is installed: $solanaVersion" -ForegroundColor Green
} else {
    Write-Host "❌ Solana CLI is not installed" -ForegroundColor Red
    Write-Host ""
    Write-Host "To install Solana CLI on Windows:" -ForegroundColor Cyan
    Write-Host "1. Download from: https://github.com/solana-labs/solana/releases" -ForegroundColor White
    Write-Host "2. Or use WSL (Windows Subsystem for Linux):" -ForegroundColor White
    Write-Host '   sh -c "$(curl -sSfL https://release.solana.com/stable/install)"' -ForegroundColor White
    Write-Host ""
    Write-Host "After installation, restart PowerShell and run this script again." -ForegroundColor Yellow
    exit
}

# 3. Check Node.js and Yarn
Write-Host ""
Write-Host "Checking Node.js installation..." -ForegroundColor Yellow
if (Test-Command "node") {
    $nodeVersion = node --version
    Write-Host "✅ Node.js is installed: $nodeVersion" -ForegroundColor Green
    
    if (Test-Command "yarn") {
        $yarnVersion = yarn --version
        Write-Host "✅ Yarn is installed: $yarnVersion" -ForegroundColor Green
    } else {
        Write-Host "Installing Yarn..." -ForegroundColor Yellow
        npm install -g yarn
    }
} else {
    Write-Host "❌ Node.js is not installed" -ForegroundColor Red
    Write-Host "Download from: https://nodejs.org/" -ForegroundColor Cyan
    Write-Host "After installation, restart PowerShell and run this script again." -ForegroundColor Yellow
    exit
}

# 4. Check/Install Anchor
Write-Host ""
Write-Host "Checking Anchor installation..." -ForegroundColor Yellow
if (Test-Command "anchor") {
    $anchorVersion = anchor --version
    Write-Host "✅ Anchor is installed: $anchorVersion" -ForegroundColor Green
} else {
    Write-Host "❌ Anchor is not installed" -ForegroundColor Red
    Write-Host "Installing Anchor (this may take a while)..." -ForegroundColor Yellow
    
    # Install AVM (Anchor Version Manager)
    cargo install --git https://github.com/coral-xyz/anchor avm --locked --force
    
    # Refresh PATH
    $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
    
    # Install latest Anchor version
    if (Test-Command "avm") {
        avm install latest
        avm use latest
        Write-Host "✅ Anchor installed successfully!" -ForegroundColor Green
    } else {
        Write-Host "⚠️  AVM installed but not in PATH. Please restart PowerShell." -ForegroundColor Yellow
        Write-Host "Then run: avm install latest && avm use latest" -ForegroundColor Cyan
        exit
    }
}

# 5. Check Python
Write-Host ""
Write-Host "Checking Python installation..." -ForegroundColor Yellow
if (Test-Command "python") {
    $pythonVersion = python --version
    Write-Host "✅ Python is installed: $pythonVersion" -ForegroundColor Green
} else {
    Write-Host "⚠️  Python is not installed" -ForegroundColor Yellow
    Write-Host "Download from: https://www.python.org/downloads/" -ForegroundColor Cyan
}

# 6. Setup Solana config
Write-Host ""
Write-Host "Configuring Solana..." -ForegroundColor Yellow
solana config set --url devnet
Write-Host "✅ Solana configured for devnet" -ForegroundColor Green

# 7. Check for keypair
if (Test-Path "$env:USERPROFILE\.config\solana\id.json") {
    Write-Host "✅ Solana keypair exists" -ForegroundColor Green
} else {
    Write-Host "Creating default Solana keypair..." -ForegroundColor Yellow
    New-Item -ItemType Directory -Force -Path "$env:USERPROFILE\.config\solana" | Out-Null
    solana-keygen new --outfile "$env:USERPROFILE\.config\solana\id.json" --no-bip39-passphrase
    Write-Host "✅ Keypair created" -ForegroundColor Green
}

Write-Host ""
Write-Host "=== Setup Summary ===" -ForegroundColor Cyan
Write-Host "✅ All prerequisites installed!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Generate agent keypairs: .\scripts\generate-keypairs.ps1" -ForegroundColor White
Write-Host "2. Build the program: anchor build" -ForegroundColor White
Write-Host "3. Deploy to devnet: anchor deploy --provider.cluster devnet" -ForegroundColor White
Write-Host ""
Write-Host "For Python agents:" -ForegroundColor Yellow
Write-Host "1. Create virtual environment: python -m venv venv" -ForegroundColor White
Write-Host "2. Activate: .\venv\Scripts\Activate.ps1" -ForegroundColor White
Write-Host "3. Install dependencies: pip install -r requirements.txt" -ForegroundColor White
Write-Host ""
