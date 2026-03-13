#!/bin/bash
# Metrix Auto-Deploy Script
# Run on VPS: bash deploy.sh

set -e

echo "Pulling latest changes..."
cd /root/metrix
git pull origin main

echo "Installing dependencies..."
npm install --production=false

echo "Building..."
npm run build

echo "Restarting app..."
pm2 restart metrix

echo "Deploy complete! App is live."
pm2 status
