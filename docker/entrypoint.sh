#!/bin/sh

# Start Hardhat node in the background
echo "Starting Local Blockchain Node..."
npx hardhat node &

# Wait for node to initialize (simple sleep wait)
sleep 5

# Deploy contracts to localhost
echo "Deploying Contracts..."
npx hardhat run scripts/deploy.js --network localhost

# Keep container alive to serve RPC requests
tail -f /dev/null