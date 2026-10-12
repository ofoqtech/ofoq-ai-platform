#!/bin/bash
# Quick deploy script - run from server after code update
set -e
cd /opt/ofoq-ai

echo "🚀 Deploying Ofoq AI Platform..."
git pull origin main
docker compose -f docker-compose.prod.yml up -d --build gateway dashboard
docker system prune -f
echo "✅ Deploy complete!"
docker compose -f docker-compose.prod.yml ps
