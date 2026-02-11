@echo off
echo.
echo === Checking Installation Status ===
echo.

echo Checking Rust...
cargo --version 2>nul
if %errorlevel% == 0 (
    echo [OK] Rust is installed
) else (
    echo [X] Rust is NOT installed
    echo     Install from: https://rustup.rs/
)
echo.

echo Checking Solana CLI...
solana --version 2>nul
if %errorlevel% == 0 (
    echo [OK] Solana CLI is installed
) else (
    echo [X] Solana CLI is NOT installed
    echo     Run: .\setup-windows.ps1
)
echo.

echo Checking Anchor...
anchor --version 2>nul
if %errorlevel% == 0 (
    echo [OK] Anchor is installed
) else (
    echo [X] Anchor is NOT installed
    echo     Run: cargo install --git https://github.com/coral-xyz/anchor avm --locked
)
echo.

echo Checking Node.js...
node --version 2>nul
if %errorlevel% == 0 (
    echo [OK] Node.js is installed
) else (
    echo [X] Node.js is NOT installed
    echo     Download from: https://nodejs.org/
)
echo.

echo Checking Python...
python --version 2>nul
if %errorlevel% == 0 (
    echo [OK] Python is installed
) else (
    echo [X] Python is NOT installed
    echo     Download from: https://python.org/
)
echo.

echo === Summary ===
echo.
echo If all tools show [OK], you can proceed with:
echo 1. .\scripts\generate-keypairs.ps1
echo 2. anchor build
echo 3. anchor deploy --provider.cluster devnet
echo.
pause
