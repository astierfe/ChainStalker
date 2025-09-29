#!/bin/bash

set -e

if [ "$#" -ne 1 ]; then
    echo "Usage: ./deploy.sh [anvil|sepolia]"
    exit 1
fi

NETWORK=$1

if [ ! -f .env ]; then
    echo "Error: .env file not found"
    exit 1
fi

source .env

echo "================================"
echo "Deploying to: $NETWORK"
echo "================================"

case $NETWORK in
    anvil)
        echo "Starting Anvil deployment..."
        forge script script/Deploy.s.sol:DeployScript \
            --rpc-url $ANVIL_RPC_URL \
            --broadcast \
            --legacy \
            -vvvv
        ;;
    
    sepolia)
        echo "Starting Sepolia deployment..."
        
        if [ -z "$ETHERSCAN_API_KEY" ]; then
            echo "Warning: ETHERSCAN_API_KEY not set, skipping verification"
            forge script script/Deploy.s.sol:DeployScript \
                --rpc-url $SEPOLIA_RPC_URL \
                --broadcast \
                --legacy \
                -vvvv
        else
            echo "Deploying and verifying on Etherscan..."
            forge script script/Deploy.s.sol:DeployScript \
                --rpc-url $SEPOLIA_RPC_URL \
                --broadcast \
                --verify \
                --etherscan-api-key $ETHERSCAN_API_KEY \
                --legacy \
                -vvvv
        fi
        ;;
    
    *)
        echo "Error: Unknown network '$NETWORK'"
        echo "Supported networks: anvil, sepolia"
        exit 1
        ;;
esac

echo ""
echo "================================"
echo "Deployment completed!"
echo "================================"
echo ""
echo "Check broadcast/ folder for deployment artifacts"
echo "Contract addresses are logged above"