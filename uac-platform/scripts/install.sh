#!/bin/bash
# Universal Access Controller (UAC) - Bare-Metal Deployment Script
# Target: Ubuntu 22.04 LTS / 24.04 LTS
# WARNING: This script makes significant changes to the system network config! Run on a fresh install only.

set -e

if [ "$EUID" -ne 0 ]; then
  echo "Please run as root (sudo ./install.sh)"
  exit 1
fi

echo "=================================================="
echo " Starting UAC Platform Installation (Draft)"
echo "=================================================="

# 1. Update and Install Core Dependencies
echo "[1/6] Installing system dependencies..."
apt-get update
DEBIAN_FRONTEND=noninteractive apt-get install -y \
  netplan.io iproute2 iptables dnsmasq \
  mariadb-server redis-server freeradius freeradius-mysql \
  python3-pip python3-venv \
  curl git build-essential

# 2. Node.js for Frontend
echo "[2/6] Installing Node.js..."
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs

# 3. Database Setup
echo "[3/6] Configuring MariaDB and FreeRADIUS..."
mysql -e "CREATE DATABASE IF NOT EXISTS uac_db;"
mysql -e "CREATE USER IF NOT EXISTS 'uac_admin'@'localhost' IDENTIFIED BY 'uac_password';"
mysql -e "GRANT ALL PRIVILEGES ON uac_db.* TO 'uac_admin'@'localhost';"
mysql -e "FLUSH PRIVILEGES;"
# Load radius schema (assuming freeradius-mysql is installed)
if [ -f /etc/freeradius/3.0/mods-config/sql/main/mysql/schema.sql ]; then
    mysql uac_db < /etc/freeradius/3.0/mods-config/sql/main/mysql/schema.sql || true
fi

# 4. Controller Setup (Python FastAPI)
echo "[4/6] Setting up UAC Controller Engine..."
CONTROLLER_DIR="/opt/uac-controller"
mkdir -p "$CONTROLLER_DIR"
cp -r ./controller/* $CONTROLLER_DIR/
python3 -m venv "$CONTROLLER_DIR/venv"
source "$CONTROLLER_DIR/venv/bin/activate"
pip install -r "$CONTROLLER_DIR/requirements.txt"

# Create systemd service for Controller
cat <<EOF > /etc/systemd/system/uac-controller.service
[Unit]
Description=UAC Controller API
After=network.target mariadb.service redis.service

[Service]
User=root
WorkingDirectory=/opt/uac-controller
Environment="PATH=/opt/uac-controller/venv/bin"
Environment="HOST_FS_ROOT=/"
ExecStart=/opt/uac-controller/venv/bin/uvicorn main:app --host 0.0.0.0 --port 8000

[Install]
WantedBy=multi-user.target
EOF

# 5. Dashboard Setup (Next.js)
echo "[5/6] Setting up UAC Dashboard..."
DASHBOARD_DIR="/opt/uac-dashboard"
mkdir -p "$DASHBOARD_DIR"
cp -r ./dashboard/* $DASHBOARD_DIR/
cd "$DASHBOARD_DIR"
npm install
npm run build

# Create systemd service for Dashboard
cat <<EOF > /etc/systemd/system/uac-dashboard.service
[Unit]
Description=UAC Next.js Dashboard
After=network.target

[Service]
User=root
WorkingDirectory=/opt/uac-dashboard
Environment="PORT=3001"
ExecStart=/usr/bin/npm start

[Install]
WantedBy=multi-user.target
EOF

# 6. Enable and Start Services
echo "[6/6] Starting services..."
systemctl daemon-reload
systemctl enable --now uac-controller
systemctl enable --now uac-dashboard
systemctl restart freeradius

echo "=================================================="
echo " UAC Platform Installation Complete!"
echo " Note: Review /opt/uac-controller and /opt/uac-dashboard."
echo "=================================================="
