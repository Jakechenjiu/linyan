#!/bin/bash
# 灵砚服务器初始化脚本
# 支持 Alibaba Cloud Linux / Ubuntu / CentOS

set -e

echo "=========================================="
echo "  灵砚 LingYan 服务器初始化"
echo "=========================================="

# 检测操作系统
if [ -f /etc/os-release ]; then
    . /etc/os-release
    OS=$ID
    echo "检测到系统: $OS"
else
    echo "无法检测操作系统"
    exit 1
fi

# 根据系统选择包管理器
if [[ "$OS" == "alinux" || "$OS" == "centos" || "$OS" == "rhel" ]]; then
    PKG="yum"
    echo "使用 yum 包管理器"
elif [[ "$OS" == "ubuntu" || "$OS" == "debian" ]]; then
    PKG="apt"
    echo "使用 apt 包管理器"
else
    echo "不支持的系统: $OS"
    exit 1
fi

# 1. 更新系统
echo "[1/7] 更新系统..."
if [[ "$PKG" == "yum" ]]; then
    yum update -y
else
    apt update && apt upgrade -y
fi

# 2. 安装 Node.js 20
echo "[2/7] 安装 Node.js..."
if [[ "$PKG" == "yum" ]]; then
    # Alibaba Cloud Linux
    curl -fsSL https://rpm.nodesource.com/setup_20.x | bash -
    yum install -y nodejs
else
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt install -y nodejs
fi
echo "Node.js $(node -v) 已安装"

# 3. 安装 PostgreSQL
echo "[3/7] 安装 PostgreSQL..."
if [[ "$PKG" == "yum" ]]; then
    yum install -y postgresql-server postgresql
    postgresql-setup --initdb
    systemctl start postgresql
    systemctl enable postgresql
else
    apt install -y postgresql postgresql-contrib
    systemctl start postgresql
    systemctl enable postgresql
fi
echo "PostgreSQL 已安装"

# 4. 创建数据库
echo "[4/7] 创建数据库..."
sudo -u postgres psql -c "CREATE DATABASE linyan;" 2>/dev/null || echo "数据库已存在"
sudo -u postgres psql -c "CREATE USER linyan WITH PASSWORD 'lingyan2026';" 2>/dev/null || echo "用户已存在"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE linyan TO linyan;"
sudo -u postgres psql -c "ALTER USER linyan CREATEDB;"
echo "数据库已创建"

# 5. 安装 PM2 和 Nginx
echo "[5/7] 安装 PM2 和 Nginx..."
npm install -g pm2
if [[ "$PKG" == "yum" ]]; then
    yum install -y nginx
else
    apt install -y nginx
fi
echo "PM2 和 Nginx 已安装"

# 6. 配置 Nginx
echo "[6/7] 配置 Nginx..."
cat > /etc/nginx/conf.d/lingyan.conf << 'NGINX'
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

# 删除默认配置（如果存在）
rm -f /etc/nginx/conf.d/default.conf 2>/dev/null
rm -f /etc/nginx/sites-enabled/default 2>/dev/null

systemctl restart nginx
systemctl enable nginx
echo "Nginx 已配置"

# 7. 配置防火墙
echo "[7/7] 配置防火墙..."
if [[ "$PKG" == "yum" ]]; then
    # Alibaba Cloud Linux 使用 firewalld
    systemctl start firewalld 2>/dev/null || true
    firewall-cmd --permanent --add-service=ssh
    firewall-cmd --permanent --add-service=http
    firewall-cmd --permanent --add-service=https
    firewall-cmd --reload
else
    ufw allow 22/tcp
    ufw allow 80/tcp
    ufw allow 443/tcp
    ufw --force enable
fi
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
