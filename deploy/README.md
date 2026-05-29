# 灵砚部署指南

## 快速部署（阿里云香港轻量服务器）

### 第一步：购买服务器
1. 登录阿里云：https://www.aliyun.com
2. 购买轻量应用服务器（香港区，2核1G，Ubuntu 22.04）
3. 记下服务器 IP 和 root 密码

### 第二步：初始化服务器
```bash
# SSH 登录服务器
ssh root@你的服务器IP

# 下载初始化脚本
curl -O https://raw.githubusercontent.com/Jakechenjiu/linyan/main/deploy/setup-server.sh

# 运行初始化
chmod +x setup-server.sh
./setup-server.sh
```

### 第三步：配置环境变量
```bash
# 进入项目目录
cd /opt/lingyan

# 复制环境变量模板
cp .env.example .env

# 编辑配置
nano .env
```

填入以下配置：
```
DATABASE_URL=postgresql://lingyan:lingyan2026@localhost:5432/lingyan
AUTH_SECRET=随机生成一个64位字符串
AUTH_URL=https://你的域名.com
```

### 第四步：部署
```bash
# 运行部署脚本
bash deploy/deploy.sh
```

### 第五步：配置域名（可选）
1. 购买域名（阿里云/腾讯云）
2. 添加 DNS 解析，A 记录指向服务器 IP
3. 安装 SSL 证书：
```bash
apt install certbot python3-certbot-nginx
certbot --nginx -d 你的域名.com
```

## 常用命令

```bash
# 查看应用状态
pm2 status

# 查看日志
pm2 logs lingyan

# 重启应用
pm2 restart lingyan

# 更新代码并重新部署
cd /opt/lingyan && bash deploy/deploy.sh
```

## 成本

| 项目 | 费用 |
|------|------|
| 阿里云香港轻量服务器 | ¥99/年 |
| 域名（可选） | ¥5-55/年 |
| SSL证书 | 免费（Let's Encrypt） |
| **总计** | **¥99-154/年** |
