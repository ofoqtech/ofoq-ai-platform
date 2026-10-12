#!/bin/bash
# ============================================================
# Ofoq AI Platform - Server Setup Script
# Run as root on a fresh Ubuntu 24.04 VPS
# Usage: bash setup.sh <your-domain> <your-email> <claude-api-key>
# ============================================================
set -e

DOMAIN=${1:-"ai.example.com"}
EMAIL=${2:-"admin@example.com"}
CLAUDE_KEY=${3:-""}
DB_PASS=$(openssl rand -hex 16)
JWT_SECRET=$(openssl rand -hex 32)

echo "============================================"
echo " Ofoq AI Platform Setup"
echo " Domain: $DOMAIN"
echo "============================================"

# 1. System update
apt-get update -qq && apt-get upgrade -y -qq

# 2. Docker
if ! command -v docker &>/dev/null; then
  curl -fsSL https://get.docker.com | bash
  systemctl enable docker
fi

# 3. Docker Compose v2
if ! docker compose version &>/dev/null; then
  apt-get install -y docker-compose-plugin
fi

# 4. Create app directory
mkdir -p /opt/ofoq-ai
cd /opt/ofoq-ai

# 5. Clone repo (replace with your actual repo URL)
if [ ! -d ".git" ]; then
  git clone https://github.com/ofoqtech/ofoq-ai-platform.git . 2>/dev/null || {
    echo "⚠️  Manual clone needed. Place project files in /opt/ofoq-ai"
    mkdir -p gateway dashboard
  }
fi

# 6. Create gateway .env
cat > gateway/.env <<EOF
NODE_ENV=production
PORT=3000
DB_HOST=postgres
DB_PORT=5432
DB_USER=ofoq
DB_PASS=${DB_PASS}
DB_NAME=ofoq_ai
JWT_SECRET=${JWT_SECRET}
CLAUDE_API_KEY=${CLAUDE_KEY}
OLLAMA_URL=http://ollama:11434
OLLAMA_MODEL=qwen2.5-coder:7b
ALLOWED_ORIGINS=https://${DOMAIN}
EOF

# 7. Create root .env for docker compose
cat > .env <<EOF
DOMAIN=${DOMAIN}
ACME_EMAIL=${EMAIL}
DB_USER=ofoq
DB_PASS=${DB_PASS}
DB_NAME=ofoq_ai
EOF

# 8. Start services
docker compose -f docker-compose.prod.yml up -d --build

# 9. Wait for containers
echo "Waiting for services to start..."
sleep 15

# 10. Pull Ollama model
echo "Pulling qwen2.5-coder:7b model (may take 5-10 minutes)..."
docker exec ofoq_ollama ollama pull qwen2.5-coder:7b &

# 11. Create admin user
echo "Creating admin user..."
docker exec ofoq_gateway node -e "
const axios = require('axios');
async function createAdmin() {
  try {
    // Wait for DB migrations
    await new Promise(r => setTimeout(r, 5000));
    const res = await axios.post('http://localhost:3000/api/v1/auth/register', {
      email: 'admin@${DOMAIN}',
      name: 'Admin',
      password: '${JWT_SECRET:0:12}@Ofoq',
      role: 'admin'
    });
    console.log('Admin created:', res.data);
  } catch (e) {
    console.log('Admin may already exist:', e.message);
  }
}
createAdmin();
" 2>/dev/null || true

# 12. Firewall
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 22/tcp
ufw --force enable

echo ""
echo "============================================"
echo " ✅ Setup Complete!"
echo "============================================"
echo " Dashboard: https://${DOMAIN}"
echo " API Docs:  https://${DOMAIN}/docs"
echo " Admin Email: admin@${DOMAIN}"
echo " Admin Password: ${JWT_SECRET:0:12}@Ofoq"
echo ""
echo " SAVE THESE CREDENTIALS!"
echo "============================================"
echo ""
echo "Note: Ollama model download running in background"
echo "Check: docker exec ofoq_ollama ollama list"
