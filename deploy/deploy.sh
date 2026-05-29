#!/bin/bash
# 灵砚部署脚本
# 在服务器上运行，部署最新代码

set -e

APP_DIR="/opt/lingyan"
APP_NAME="lingyan"

echo "=========================================="
echo "  灵砚 LingYan 部署"
echo "=========================================="

# 检查是否在正确目录
if [ ! -f "$APP_DIR/package.json" ]; then
    echo "错误: 请先运行 setup-server.sh 初始化服务器"
    exit 1
fi

cd "$APP_DIR"

# 1. 拉取最新代码
echo "[1/5] 拉取最新代码..."
git pull origin main

# 2. 安装依赖
echo "[2/5] 安装依赖..."
npm install

# 3. 生成 Prisma Client
echo "[3/5] 生成数据库客户端..."
npx prisma generate

# 4. 推送数据库变更
echo "[4/5] 更新数据库..."
npx prisma db push

# 5. 构建并重启
echo "[5/5] 构建并重启..."
npm run build

# 重启 PM2
pm2 delete "$APP_NAME" 2>/dev/null || true
pm2 start npm --name "$APP_NAME" -- start
pm2 save

echo ""
echo "=========================================="
echo "  部署完成！"
echo "=========================================="
echo ""
echo "访问: http://$(curl -s ifconfig.me)"
echo "PM2 状态: pm2 status"
echo "查看日志: pm2 logs $APP_NAME"
