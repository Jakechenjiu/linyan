#!/bin/bash
# 灵砚服务器初始化脚本
# 在阿里云香港轻量服务器上运行（Ubuntu 22.04）

set -e

echo "=========================================="
echo "  灵砚 LingYan 服务器初始化"
echo "=========================================="

# 1. 更新系统
echo "[1/7] 更新系统..."
apt update && apt upgrade -y

# 2. 安装 Node.js 20
echo "[2/7] 安装 Node.js..."
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs
echo "Node.js $(node -v) 已安装"

# 3. 安装 PostgreSQL
echo "[3/7] 安装 PostgreSQL..."
apt install -y postgresql postgresql-contrib
systemctl start postgresql
systemctl enable postgresql
echo "PostgreSQL 已安装"

# 4. 创建数据库
echo "[4/7] 创建数据库..."
sudo -u postgres psql -c "CREATE DATABASE linyan;"
sudo -u postgres psql -c "CREATE USER linyan WITH PASSWORD 'lingyan2026';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE linyan TO linyan;"
sudo -u postgres psql -c "ALTER USER linyan CREATEDB;"
echo "数据库已创建"

# 5. 安装 PM2 和 Nginx
echo "[5/7] 安装 PM2 和 Nginx..."
npm install -g pm2
apt install -y nginx
echo "PM2 和 Nginx 已安装"

# 6. 配置 Nginx
echo "[6/7] 配置 Nginx..."
cat > /etc/nginx/sites-available/lingyan << 'NGINX'
server {
    listen 80;
    server_name _;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }
}
NGINX

ln -sf /etc/nginx/sites-available/lingyan /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
systemctl restart nginx
systemctl enable nginx
echo "Nginx 已配置"

# 7. 配置防火墙
echo "[7/7] 配置防火墙..."
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable
echo "防火墙已配置"

echo ""
echo "=========================================="
echo "  服务器初始化完成！"
echo "=========================================="
echo ""
echo "下一步："
echo "1. 克隆代码: git clone https://github.com/Jakechenjiu/linyan.git /opt/lingyan"
echo "2. 配置环境变量: cp /opt/lingyan/.env.example /opt/lingyan/.env"
echo "3. 编辑 .env 填入配置"
echo "4. 运行部署脚本: bash /opt/lingyan/deploy/deploy.sh"
