#!/bin/bash

# Android 原生文件重新生成脚本
# 用途: 完整重新生成 Android 原生文件，包括 bundle 文件

set -e  # 遇到错误立即退出

echo "=========================================="
echo "🚀 开始重新生成 Android 原生文件"
echo "=========================================="
echo ""

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 1. 检查当前目录
echo "📍 步骤 1/7: 检查当前目录..."
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ 错误: 请在 frontend 目录下运行此脚本${NC}"
    exit 1
fi
echo -e "${GREEN}✅ 当前目录正确${NC}"
echo ""

# 2. 清除旧的原生文件
echo "🗑️  步骤 2/7: 清除旧的 Android 文件..."
if [ -d "android" ]; then
    rm -rf android
    echo -e "${GREEN}✅ 已删除旧的 android 文件夹${NC}"
else
    echo -e "${YELLOW}⚠️  android 文件夹不存在，跳过删除${NC}"
fi
echo ""

# 3. 清除缓存
echo "🧹 步骤 3/7: 清除缓存..."
rm -rf node_modules/.cache
rm -rf .expo
echo -e "${GREEN}✅ 缓存已清除${NC}"
echo ""

# 4. 重新生成 Android 原生文件
echo "🔨 步骤 4/7: 生成 Android 原生文件..."
npx expo prebuild --platform android --clean
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Android 原生文件生成成功${NC}"
else
    echo -e "${RED}❌ Android 原生文件生成失败${NC}"
    exit 1
fi
echo ""

# 5. 生成 JavaScript Bundle
echo "📦 步骤 5/7: 生成 JavaScript Bundle..."
mkdir -p android/app/src/main/assets
npx react-native bundle \
    --entry-file index.js \
    --platform android \
    --dev false \
    --bundle-output android/app/src/main/assets/index.android.bundle \
    --assets-dest android/app/src/main/res

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ JavaScript Bundle 生成成功${NC}"
else
    echo -e "${RED}❌ JavaScript Bundle 生成失败${NC}"
    exit 1
fi
echo ""

# 6. 验证生成的文件
echo "🔍 步骤 6/7: 验证生成的文件..."
MISSING_FILES=0

if [ ! -d "android" ]; then
    echo -e "${RED}❌ android 文件夹不存在${NC}"
    MISSING_FILES=1
else
    echo -e "${GREEN}✅ android 文件夹存在${NC}"
fi

if [ ! -f "android/app/src/main/assets/index.android.bundle" ]; then
    echo -e "${RED}❌ index.android.bundle 文件不存在${NC}"
    MISSING_FILES=1
else
    BUNDLE_SIZE=$(du -h android/app/src/main/assets/index.android.bundle | cut -f1)
    echo -e "${GREEN}✅ index.android.bundle 文件存在 (大小: $BUNDLE_SIZE)${NC}"
fi

if [ ! -f "android/build.gradle" ]; then
    echo -e "${RED}❌ android/build.gradle 文件不存在${NC}"
    MISSING_FILES=1
else
    echo -e "${GREEN}✅ android/build.gradle 文件存在${NC}"
fi

if [ $MISSING_FILES -eq 1 ]; then
    echo -e "${RED}❌ 部分文件缺失，请检查错误信息${NC}"
    exit 1
fi
echo ""

# 7. 完成
echo "=========================================="
echo -e "${GREEN}🎉 Android 原生文件重新生成完成！${NC}"
echo "=========================================="
echo ""
echo "📝 下一步操作:"
echo "   1. 运行应用: npx expo run:android"
echo "   2. 或在 Android Studio 中打开: open -a \"Android Studio\" android"
echo ""
echo "📊 生成的文件:"
echo "   - android/                                    (Android 项目)"
echo "   - android/app/src/main/assets/               (Bundle 文件)"
echo "   - android/app/src/main/res/                  (资源文件)"
echo ""
