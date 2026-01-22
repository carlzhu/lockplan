#!/bin/bash

# DoNow 开发环境启动脚本
# 同时启动前端和后端

set -e

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   DoNow 开发环境启动              ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"
echo ""

# 获取本机 IP
LOCAL_IP=$(ifconfig | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}' | head -1)
echo -e "${YELLOW}本机 IP: ${LOCAL_IP}${NC}"
echo ""

# 显示配置信息
echo -e "${GREEN}=== 配置信息 ===${NC}"
echo "后端地址: http://localhost:5000"
echo "Swagger: http://localhost:5000/swagger"
echo ""
echo "前端配置:"
echo "  - iOS 模拟器: http://localhost:5000"
echo "  - Android 模拟器: http://10.0.2.2:5000"
echo "  - 真机设备: http://${LOCAL_IP}:5000"
echo ""

# 检查后端是否已启动
if lsof -Pi :5000 -sTCP:LISTEN -t >/dev/null ; then
    echo -e "${GREEN}✓ 后端已在运行 (端口 5000)${NC}"
else
    echo -e "${YELLOW}启动后端...${NC}"
    cd backend
    ./run-dev.sh &
    BACKEND_PID=$!
    cd ..
    sleep 3
    echo -e "${GREEN}✓ 后端已启动 (PID: $BACKEND_PID)${NC}"
fi

echo ""

# 检查前端是否已启动
if lsof -Pi :8081 -sTCP:LISTEN -t >/dev/null ; then
    echo -e "${GREEN}✓ 前端已在运行 (端口 8081)${NC}"
else
    echo -e "${YELLOW}启动前端...${NC}"
    cd frontend
    npm start &
    FRONTEND_PID=$!
    cd ..
    sleep 3
    echo -e "${GREEN}✓ 前端已启动 (PID: $FRONTEND_PID)${NC}"
fi

echo ""
echo -e "${GREEN}=== 开发环境已就绪！===${NC}"
echo ""
echo -e "${BLUE}下一步操作:${NC}"
echo "1. 在 Expo 终端中按 'i' 启动 iOS 模拟器"
echo "2. 或按 'a' 启动 Android 模拟器"
echo "3. 或扫描二维码在真机上运行"
echo ""
echo -e "${YELLOW}提示:${NC}"
echo "- 后端 API: http://localhost:5000/swagger"
echo "- 前端日志: 查看 Expo 终端输出"
echo "- 停止服务: 按 Ctrl+C"
echo ""
