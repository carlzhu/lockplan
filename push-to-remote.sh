#!/bin/bash

# 推送到远程仓库脚本

set -e

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}推送到远程仓库${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# 1. 检查是否有远程仓库
REMOTE=$(git remote -v)
if [ -z "$REMOTE" ]; then
    echo -e "${YELLOW}当前没有配置远程仓库${NC}"
    echo ""
    echo "请输入远程仓库 URL:"
    echo "例如: https://github.com/username/repo.git"
    echo "或: git@github.com:username/repo.git"
    echo ""
    read -p "远程仓库 URL: " REPO_URL
    
    if [ -z "$REPO_URL" ]; then
        echo -e "${RED}错误: 未输入仓库 URL${NC}"
        exit 1
    fi
    
    echo ""
    echo -e "${YELLOW}添加远程仓库...${NC}"
    git remote add origin "$REPO_URL"
    echo -e "${GREEN}✓ 远程仓库已添加${NC}"
else
    echo -e "${GREEN}✓ 已配置远程仓库:${NC}"
    git remote -v
fi

echo ""

# 2. 检查当前分支
BRANCH=$(git branch --show-current)
echo -e "${GREEN}当前分支: $BRANCH${NC}"
echo ""

# 3. 显示将要推送的提交
echo -e "${YELLOW}将要推送的提交:${NC}"
git log --oneline -5
echo ""

# 4. 询问是否强制推送
echo -e "${YELLOW}推送选项:${NC}"
echo "1) 正常推送 (git push origin $BRANCH)"
echo "2) 强制推送 (git push -f origin $BRANCH) - 会覆盖远程历史"
echo "3) 取消"
echo ""
read -p "选择 (1-3): " choice

case $choice in
    1)
        echo ""
        echo -e "${YELLOW}正常推送到远程...${NC}"
        git push origin $BRANCH
        ;;
    2)
        echo ""
        echo -e "${RED}⚠️  警告: 强制推送会覆盖远程历史！${NC}"
        read -p "确定要强制推送吗? (输入 'yes' 确认): " confirm
        if [ "$confirm" = "yes" ]; then
            echo -e "${YELLOW}强制推送到远程...${NC}"
            git push -f origin $BRANCH
        else
            echo -e "${YELLOW}已取消${NC}"
            exit 0
        fi
        ;;
    3)
        echo -e "${YELLOW}已取消${NC}"
        exit 0
        ;;
    *)
        echo -e "${RED}无效选择${NC}"
        exit 1
        ;;
esac

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}✓ 推送完成！${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${BLUE}远程仓库信息:${NC}"
git remote -v
echo ""
echo -e "${BLUE}最新提交:${NC}"
git log --oneline -1
echo ""
