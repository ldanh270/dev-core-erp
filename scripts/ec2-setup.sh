#!/bin/bash
# ============================================================
# EC2 First-Time Setup Script
# Run this ONCE on a fresh Amazon Linux 2023 / Ubuntu EC2
#
# Usage:
#   chmod +x scripts/ec2-setup.sh
#   ssh ec2-user@YOUR_EC2_IP 'bash -s' < scripts/ec2-setup.sh
# ============================================================

set -euo pipefail

echo "🚀 Starting DevCore ERP EC2 setup..."

# Detect OS
if [ -f /etc/amazon-linux-release ] || grep -q "Amazon Linux" /etc/os-release 2>/dev/null; then
  OS="amazon"
elif grep -q "Ubuntu" /etc/os-release 2>/dev/null; then
  OS="ubuntu"
else
  echo "Unsupported OS. Use Amazon Linux 2023 or Ubuntu 22.04+" && exit 1
fi

# ---- Install Docker ----
echo "📦 Installing Docker..."
if [ "$OS" = "amazon" ]; then
  sudo yum update -y
  sudo yum install -y docker git
  sudo systemctl enable docker
  sudo systemctl start docker
  sudo usermod -aG docker ec2-user
else
  sudo apt-get update -y
  sudo apt-get install -y ca-certificates curl gnupg git
  sudo install -m 0755 -d /etc/apt/keyrings
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
  echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
  sudo apt-get update -y
  sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
  sudo systemctl enable docker
  sudo systemctl start docker
  sudo usermod -aG docker ubuntu
fi

# ---- Install Docker Compose v2 ----
echo "📦 Installing Docker Compose..."
COMPOSE_VERSION="2.29.0"
sudo curl -L "https://github.com/docker/compose/releases/download/v${COMPOSE_VERSION}/docker-compose-$(uname -s)-$(uname -m)" \
  -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
docker-compose --version

# ---- Create project directory ----
echo "📂 Creating project directory..."
mkdir -p ~/devcore-erp/nginx/conf.d

# ---- Create env file templates ----
echo "📝 Creating env file templates..."

cat > ~/devcore-erp/backend.env.example << 'EOF'
NODE_ENV=production
PORT=5000
SERVER_URL=https://YOUR_DOMAIN
CLIENT_URL=https://YOUR_FRONTEND_URL
CORS_ALLOWED_ORIGINS=https://YOUR_FRONTEND_URL
DATABASE_URL=postgresql://...
DIRECT_URL=postgresql://...
ACCESS_TOKEN_SECRET=
REFRESH_TOKEN_SECRET=
OAUTH_STATE_SECRET=
OAUTH_CREDENTIAL_ENCRYPTION_KEY=
FRONTEND_URL=https://YOUR_FRONTEND_URL
RESEND_API_KEY=
EMAIL_FROM=
GOOGLE_OAUTH_CLIENT_ID=
GOOGLE_OAUTH_CLIENT_SECRET=
AI_API_KEY=
AI_BASE_URL=https://openrouter.ai/api/v1
AI_MODEL=google/gemini-2.5-flash
SEED_PASSWORD=
EOF

cat > ~/devcore-erp/mcp.env.example << 'EOF'
NODE_ENV=production
PORT=3001
DEVCORE_API_BASE_URL=http://backend:5000
PUBLIC_BASE_URL=https://YOUR_DOMAIN/mcp
DEBUG=false
EOF

cat > ~/devcore-erp/gateway.env.example << 'EOF'
NODE_ENV=production
TELEGRAM_BOT_TOKEN=
NINE_ROUTER_BASE_URL=https://openrouter.ai/api/v1
NINE_ROUTER_API_KEY=
NINE_ROUTER_MODEL=openai/gpt-4o-mini
MCP_SSE_URL=http://mcp:3001/mcp/sse
MCP_MESSAGE_URL=http://mcp:3001/mcp/message
REDIS_URL=redis://:REDIS_PASSWORD@redis:6379
PORT=3002
EOF

cat > ~/devcore-erp/.env.example << 'EOF'
GITHUB_REPO=your-github-org/dev-core-erp
IMAGE_TAG=latest
REDIS_PASSWORD=your_strong_redis_password_here
EOF

echo ""
echo "✅ Setup complete!"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📋 NEXT STEPS:"
echo ""
echo "1. Copy env files and fill in values:"
echo "   cp ~/devcore-erp/backend.env.example ~/devcore-erp/backend.env"
echo "   cp ~/devcore-erp/mcp.env.example     ~/devcore-erp/mcp.env"
echo "   cp ~/devcore-erp/gateway.env.example ~/devcore-erp/gateway.env"
echo "   cp ~/devcore-erp/.env.example        ~/devcore-erp/.env"
echo "   nano ~/devcore-erp/backend.env  # fill in all values"
echo ""
echo "2. Configure GitHub Secrets (repo Settings → Secrets → Actions):"
echo "   EC2_HOST            = $(curl -s http://169.254.169.254/latest/meta-data/public-ipv4)"
echo "   EC2_USER            = $(whoami)"
echo "   EC2_SSH_PRIVATE_KEY = <paste your .pem file content>"
echo ""
echo "3. Add nginx config and replace YOUR_DOMAIN"
echo ""
echo "4. Set up SSL with Certbot:"
echo "   sudo docker run -it --rm -v certbot_conf:/etc/letsencrypt \\"
echo "     -v certbot_www:/var/www/certbot certbot/certbot certonly \\"
echo "     --webroot -w /var/www/certbot -d YOUR_DOMAIN"
echo ""
echo "5. Log out and back in for docker group to take effect"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
