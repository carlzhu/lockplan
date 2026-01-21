#!/bin/bash

# iOS 原生文件重新生成脚本
# 用途: 完整重新生成 iOS 原生文件，包括 bundle 文件

set -e  # 遇到错误立即退出

echo "=========================================="
echo "🚀 开始重新生成 iOS 原生文件"
echo "=========================================="
echo ""

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 1. 检查当前目录
echo "📍 步骤 1/8: 检查当前目录..."
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ 错误: 请在 frontend 目录下运行此脚本${NC}"
    exit 1
fi
echo -e "${GREEN}✅ 当前目录正确${NC}"
echo ""

# 2. 清除旧的原生文件
echo "🗑️  步骤 2/8: 清除旧的 iOS 文件..."
if [ -d "ios" ]; then
    rm -rf ios
    echo -e "${GREEN}✅ 已删除旧的 ios 文件夹${NC}"
else
    echo -e "${YELLOW}⚠️  ios 文件夹不存在，跳过删除${NC}"
fi
echo ""

# 3. 清除缓存
echo "🧹 步骤 3/8: 清除缓存..."
rm -rf node_modules/.cache
rm -rf .expo
echo -e "${GREEN}✅ 缓存已清除${NC}"
echo ""

# 4. 重新生成 iOS 原生文件
echo "🔨 步骤 4/8: 生成 iOS 原生文件..."
npx expo prebuild --platform ios --clean
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ iOS 原生文件生成成功${NC}"
else
    echo -e "${RED}❌ iOS 原生文件生成失败${NC}"
    exit 1
fi
echo ""

# 5. 安装 CocoaPods 依赖
echo "📦 步骤 5/8: 安装 CocoaPods 依赖..."
cd ios
pod install
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ CocoaPods 依赖安装成功${NC}"
else
    echo -e "${RED}❌ CocoaPods 依赖安装失败${NC}"
    cd ..
    exit 1
fi
cd ..
echo ""

# 6. 生成 JavaScript Bundle
echo "📦 步骤 6/8: 生成 JavaScript Bundle..."
npx react-native bundle \
    --entry-file index.js \
    --platform ios \
    --dev false \
    --bundle-output ios/main.jsbundle \
    --assets-dest ios

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ JavaScript Bundle 生成成功${NC}"
else
    echo -e "${RED}❌ JavaScript Bundle 生成失败${NC}"
    exit 1
fi
echo ""

# 7. 验证生成的文件
echo "🔍 步骤 7/8: 验证生成的文件..."
MISSING_FILES=0

if [ ! -d "ios" ]; then
    echo -e "${RED}❌ ios 文件夹不存在${NC}"
    MISSING_FILES=1
else
    echo -e "${GREEN}✅ ios 文件夹存在${NC}"
fi

if [ ! -d "ios/Pods" ]; then
    echo -e "${RED}❌ ios/Pods 文件夹不存在${NC}"
    MISSING_FILES=1
else
    echo -e "${GREEN}✅ ios/Pods 文件夹存在${NC}"
fi

if [ ! -f "ios/main.jsbundle" ]; then
    echo -e "${RED}❌ ios/main.jsbundle 文件不存在${NC}"
    MISSING_FILES=1
else
    BUNDLE_SIZE=$(du -h ios/main.jsbundle | cut -f1)
    echo -e "${GREEN}✅ ios/main.jsbundle 文件存在 (大小: $BUNDLE_SIZE)${NC}"
fi

if [ ! -f "ios/Podfile.lock" ]; then
    echo -e "${RED}❌ ios/Podfile.lock 文件不存在${NC}"
    MISSING_FILES=1
else
    echo -e "${GREEN}✅ ios/Podfile.lock 文件存在${NC}"
fi

if [ $MISSING_FILES -eq 1 ]; then
    echo -e "${RED}❌ 部分文件缺失，请检查错误信息${NC}"
    exit 1
fi
echo ""

# 8. 完成
echo "=========================================="
echo -e "${GREEN}🎉 iOS 原生文件重新生成完成！${NC}"
echo "=========================================="
echo ""
echo "📝 下一步操作:"
echo "   1. 运行应用: npx expo run:ios"
echo "   2. 或指定模拟器: npx expo run:ios --device \"iPhone 17 Pro\""
echo "   3. 或在 Xcode 中打开: open ios/AIVoiceNotes.xcworkspace"
echo ""
echo "📊 生成的文件:"
echo "   - ios/                    (Xcode 项目)"
echo "   - ios/Pods/               (CocoaPods 依赖)"
echo "   - ios/main.jsbundle       (JavaScript Bundle)"
echo "   - ios/assets/             (资源文件)"
echo ""
