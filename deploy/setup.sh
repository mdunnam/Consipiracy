#!/usr/bin/env bash
# =============================================================================
# deploy/setup.sh — One-time server bootstrap for Truth Archive on Ubuntu 22.04
#
# Run this ONCE on a fresh EC2 instance as ubuntu:
#   chmod +x setup.sh && sudo bash setup.sh
#
# After this script finishes, follow the manual steps printed at the end.
# =============================================================================

set -euo pipefail

APP_DIR="/var/www/truth-archive"
LOG_DIR="/var/log/truth-archive"
SERVICE_USER="www-data"

echo ""
echo "============================================"
echo " Truth Archive — Server Bootstrap"
echo "============================================"
echo ""

# --- 1. System updates -------------------------------------------------------
echo "[1/8] Updating system packages..."
apt-get update -qq
apt-get upgrade -y -qq
apt-get install -y -qq curl git nginx certbot python3-certbot-nginx ufw

# --- 2. Node.js 20 LTS -------------------------------------------------------
echo "[2/8] Installing Node.js 20 LTS..."
curl -fsSL https://deb.nodesource.com/setup_20.x | bash - >/dev/null
apt-get install -y -qq nodejs
node --version
npm --version

# --- 3. PM2 ------------------------------------------------------------------
echo "[3/8] Installing PM2..."
npm install -g pm2 >/dev/null 2>&1

# --- 4. Create app directory -------------------------------------------------
echo "[4/8] Creating app directory ${APP_DIR}..."
mkdir -p "$APP_DIR"
mkdir -p "$LOG_DIR"
chown ubuntu:ubuntu "$APP_DIR"
chown ubuntu:ubuntu "$LOG_DIR"

# --- 5. Firewall -------------------------------------------------------------
echo "[5/8] Configuring UFW firewall..."
ufw --force reset >/dev/null
ufw default deny incoming  >/dev/null
ufw default allow outgoing >/dev/null
ufw allow 22/tcp comment 'SSH'   >/dev/null
ufw allow 80/tcp comment 'HTTP'  >/dev/null
ufw allow 443/tcp comment 'HTTPS' >/dev/null
ufw --force enable >/dev/null
ufw status

# --- 6. Nginx ----------------------------------------------------------------
echo "[6/8] Configuring Nginx..."
# Remove default site
rm -f /etc/nginx/sites-enabled/default

# Copy our config
cp "$(dirname "$0")/nginx.conf" /etc/nginx/sites-available/thetrutharchive.org
ln -sf /etc/nginx/sites-available/thetrutharchive.org \
       /etc/nginx/sites-enabled/thetrutharchive.org

# Test config (will warn about missing SSL certs — that's OK before certbot)
nginx -t 2>/dev/null || true

systemctl enable nginx
systemctl restart nginx

# --- 7. Log rotation ---------------------------------------------------------
echo "[7/8] Setting up log rotation..."
cat > /etc/logrotate.d/truth-archive << 'LOGROTATE'
/var/log/truth-archive/*.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 ubuntu ubuntu
    sharedscripts
    postrotate
        pm2 reloadLogs 2>/dev/null || true
    endscript
}
LOGROTATE

# --- 8. PM2 startup on boot --------------------------------------------------
echo "[8/8] Configuring PM2 startup..."
# Generate startup command for ubuntu user (run this as ubuntu, not root)
su - ubuntu -c "pm2 startup systemd -u ubuntu --hp /home/ubuntu" 2>/dev/null || true

echo ""
echo "============================================"
echo " Bootstrap complete!"
echo "============================================"
echo ""
echo "NEXT STEPS (run as ubuntu user, not root):"
echo ""
echo "  1. Upload your site files to ${APP_DIR}:"
echo "     rsync -avz --exclude='.env' --exclude='node_modules' --exclude='stripe-cli' \\"
echo "       --exclude='*.zip' --exclude='ebook.pdf' --exclude='deploy' \\"
echo "       /path/to/local/site/ ubuntu@YOUR_EC2_IP:${APP_DIR}/"
echo ""
echo "  2. SSH in and install dependencies:"
echo "     cd ${APP_DIR} && npm ci --omit=dev"
echo ""
echo "  3. Create production .env file:"
echo "     nano ${APP_DIR}/.env"
echo "     (Fill in STRIPE_SECRET_KEY=sk_live_..., STRIPE_WEBHOOK_SECRET,"
echo "      SITE_URL=https://thetrutharchive.org, PORT=3000)"
echo ""
echo "  4. Get a free SSL certificate:"
echo "     sudo certbot --nginx -d thetrutharchive.org -d www.thetrutharchive.org"
echo "     (Enter your email, agree to terms, choose redirect)"
echo ""
echo "  5. Start the app:"
echo "     cd ${APP_DIR}"
echo "     pm2 start ecosystem.config.js --env production"
echo "     pm2 save"
echo ""
echo "  6. Register a Stripe production webhook:"
echo "     Dashboard → Developers → Webhooks → Add endpoint:"
echo "     URL: https://thetrutharchive.org/webhook"
echo "     Event: checkout.session.completed"
echo "     Copy the whsec_ signing secret into .env"
echo "     pm2 restart truth-archive"
echo ""
echo "  7. Point your domain:"
echo "     In your registrar (or Route 53):"
echo "     A record: thetrutharchive.org  →  YOUR_EC2_ELASTIC_IP"
echo "     A record: www.thetrutharchive.org → YOUR_EC2_ELASTIC_IP"
echo ""
