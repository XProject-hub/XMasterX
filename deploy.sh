#!/bin/bash
echo "Deploying IPTV Manager..."

# Pull latest changes
git pull

# Install backend dependencies
cd /var/www/iptv-manager/backend
npm install

# Install frontend dependencies and build
cd /var/www/iptv-manager/frontend
npm install
npm run build

# Restart the application
cd /var/www/iptv-manager
pm2 restart ecosystem.config.js

echo "Deployment completed!"
