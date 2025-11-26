#!/bin/bash

# MetaID NFT - Build and Deploy Script
# This script helps you build, test, and deploy the MetaID NFT program

set -e  # Exit on error

echo "🪪 MetaID NFT - Build & Deploy Script"
echo "======================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if running from project root
if [ ! -f "anchor_project/Anchor.toml" ]; then
    echo -e "${RED}Error: Please run this script from the project root directory${NC}"
    exit 1
fi

# Change to anchor project directory
cd anchor_project

echo "📋 Step 1: Checking Prerequisites"
echo "-----------------------------------"

# Check for Anchor CLI
if ! command -v anchor &> /dev/null && [ ! -f ~/.avm/bin/anchor-0.32.1 ]; then
    echo -e "${RED}✗ Anchor CLI not found${NC}"
    echo "  Please install Anchor CLI first:"
    echo "  cargo install --git https://github.com/coral-xyz/anchor --tag v0.30.1 anchor-cli --locked"
    exit 1
else
    echo -e "${GREEN}✓ Anchor CLI found${NC}"
    ANCHOR_CMD="~/.avm/bin/anchor-0.32.1"
fi

# Check for Solana CLI
if ! command -v solana &> /dev/null; then
    echo -e "${RED}✗ Solana CLI not found${NC}"
    echo "  Please install Solana CLI first:"
    echo "  sh -c \"\$(curl -sSfL https://release.anza.xyz/v1.18.20/install)\""
    exit 1
else
    echo -e "${GREEN}✓ Solana CLI found${NC}"
    solana --version
fi

# Check for cargo build-sbf
if ! command -v cargo-build-sbf &> /dev/null; then
    echo -e "${YELLOW}⚠ cargo-build-sbf not found - attempting to use anchor build${NC}"
fi

echo ""
echo "🔨 Step 2: Building the Program"
echo "-----------------------------------"

if [ -f ~/.avm/bin/anchor-0.32.1 ]; then
    ~/.avm/bin/anchor-0.32.1 build
elif command -v anchor &> /dev/null; then
    anchor build
else
    echo -e "${RED}✗ Could not find anchor command${NC}"
    exit 1
fi

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Build successful!${NC}"
else
    echo -e "${RED}✗ Build failed${NC}"
    exit 1
fi

echo ""
echo "📊 Program Information:"
PROGRAM_ID=$(solana address -k target/deploy/metaid_nft-keypair.json)
echo "  Program ID: $PROGRAM_ID"

# Check if IDL was generated
if [ -f "target/idl/metaid_nft.json" ]; then
    echo -e "${GREEN}✓ IDL generated${NC}"
else
    echo -e "${RED}✗ IDL not found${NC}"
fi

echo ""
echo "🧪 Step 3: Running Tests (optional)"
echo "-----------------------------------"
read -p "Do you want to run tests? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    if [ -f ~/.avm/bin/anchor-0.32.1 ]; then
        ~/.avm/bin/anchor-0.32.1 test
    else
        anchor test
    fi
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ All tests passed!${NC}"
    else
        echo -e "${RED}✗ Tests failed${NC}"
        read -p "Continue anyway? (y/n) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi
fi

echo ""
echo "📋 Step 4: Deployment Options"
echo "-----------------------------------"
echo "1) Deploy to Devnet"
echo "2) Deploy to Mainnet"
echo "3) Skip deployment"
echo ""
read -p "Choose an option (1-3): " choice

case $choice in
    1)
        echo ""
        echo "🚀 Deploying to Devnet..."
        solana config set --url devnet
        
        # Check balance
        BALANCE=$(solana balance | awk '{print $1}')
        echo "Current balance: $BALANCE SOL"
        
        if (( $(echo "$BALANCE < 2" | bc -l) )); then
            echo "Low balance, requesting airdrop..."
            solana airdrop 2
        fi
        
        if [ -f ~/.avm/bin/anchor-0.32.1 ]; then
            ~/.avm/bin/anchor-0.32.1 deploy --provider.cluster devnet
        else
            anchor deploy --provider.cluster devnet
        fi
        
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}✓ Deployed to Devnet!${NC}"
            echo "  Verify at: https://explorer.solana.com/address/$PROGRAM_ID?cluster=devnet"
        fi
        ;;
    2)
        echo ""
        echo "🚀 Deploying to Mainnet..."
        echo -e "${YELLOW}⚠ WARNING: This will deploy to MAINNET and cost real SOL${NC}"
        read -p "Are you sure? (type 'yes' to continue): " confirm
        
        if [ "$confirm" != "yes" ]; then
            echo "Deployment cancelled"
            exit 0
        fi
        
        solana config set --url mainnet-beta
        
        BALANCE=$(solana balance | awk '{print $1}')
        echo "Current balance: $BALANCE SOL"
        
        if (( $(echo "$BALANCE < 3" | bc -l) )); then
            echo -e "${RED}✗ Insufficient balance (need at least 3 SOL for deployment)${NC}"
            exit 1
        fi
        
        if [ -f ~/.avm/bin/anchor-0.32.1 ]; then
            ~/.avm/bin/anchor-0.32.1 deploy --provider.cluster mainnet
        else
            anchor deploy --provider.cluster mainnet
        fi
        
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}✓ Deployed to Mainnet!${NC}"
            echo "  Verify at: https://explorer.solana.com/address/$PROGRAM_ID"
        fi
        ;;
    3)
        echo "Skipping deployment"
        ;;
    *)
        echo "Invalid option"
        exit 1
        ;;
esac

echo ""
echo "📦 Step 5: Update Frontend"
echo "-----------------------------------"

if [ -f "target/idl/metaid_nft.json" ]; then
    cp target/idl/metaid_nft.json ../frontend/src/idl/
    echo -e "${GREEN}✓ IDL copied to frontend${NC}"
else
    echo -e "${YELLOW}⚠ IDL not found - frontend may need manual update${NC}"
fi

echo ""
echo "✅ Build Complete!"
echo "===================="
echo ""
echo "Next steps:"
echo "1. Frontend is available at: http://localhost:5173/"
echo "2. Program ID: $PROGRAM_ID"
echo "3. Update PROJECT_DESCRIPTION.md with deployment info"
echo ""
echo "To start the frontend:"
echo "  cd ../frontend && npm run dev"
echo ""
echo "To deploy the frontend:"
echo "  cd ../frontend && npm run build && vercel --prod"
echo ""
echo "🎉 Happy coding!"
