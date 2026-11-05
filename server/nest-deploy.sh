#!/bin/bash
# ==============================================================================
# LINUX / DEBIAN / CLUSTER DEPLOYMENT SCRIPT
# Nerds Room League Event Platform Backend
# ==============================================================================

set -e

echo "🚀 Starting Nerds Room League backend deployment..."

# 1. Check Node.js
if ! command -v node &> /dev/null; then
    echo "📦 Installing Node.js 20 LTS..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

echo "✅ Node.js $(node -v) detected."

# 2. Check PM2
if ! command -v pm2 &> /dev/null; then
    echo "📦 Installing PM2 globally..."
    npm install -g pm2
fi

# 3. Install Dependencies
echo "📦 Installing dependencies..."
npm install --production

# 4. Start PM2
echo "⚙️ Starting backend process via PM2..."
pm2 start ecosystem.config.cjs || pm2 restart nerdsroom-league-api

# 5. Save PM2 startup
pm2 save

echo ""
echo "=============================================================================="
echo "🎉 DEPLOYMENT COMPLETE!"
echo "Your backend is running in the background on port 8080."
echo "Test health endpoint: curl http://localhost:8080/api/health"
echo "=============================================================================="
