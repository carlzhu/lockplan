#!/bin/bash

# 完整重新生成所有平台原生文件脚本
# 用途: 同时重新生成 iOS 和 Android 原生文件

set -e  # 遇到错误立即退出

echo "=========================================="
echo "🚀 开始重新生成所有平台原生文件"
echo "=========================================="
echo ""

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 1. 检查当前目录
echo "📍 步骤 1/10: 检查当前目录..."
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ 错误: 请在 frontend 目录下运行此脚本${NC}"
    exit 1
fi
echo -e "${GREEN}✅ 当前目录正确${NC}"
echo ""

# 2. 清除旧的原生文件
echo "🗑️  步骤 2/10: 清除旧的原生文件..."
if [ -d "ios" ]; then
    rm -rf ios
    echo -e "${GREEN}✅ 已删除旧的 ios 文件夹${NC}"
fi
if [ -d "android" ]; then
    rm -rf android
    echo -e "${GREEN}✅ 已删除旧的 android 文件夹${NC}"
fi
echo ""

# 3. 清除缓存
echo "🧹 步骤 3/10: 清除缓存..."
rm -rf node_modules/.cache
rm -rf .expo
echo -e "${GREEN}✅ 缓存已清除${NC}"
echo ""

# 4. 重新生成所有平台原生文件
echo "🔨 步骤 4/10: 生成所有平台原生文件..."
npx expo prebuild --clean
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ 原生文件生成成功${NC}"
else
    echo -e "${RED}❌ 原生文件生成失败${NC}"
    exit 1
fi
echo ""

# 5. 安装 iOS CocoaPods 依赖
echo -e "${BLUE}========== iOS 配置 ==========${NC}"
echo "📦 步骤 5/10: 安装 iOS CocoaPods 依赖..."
if [ -d "ios" ]; then
    cd ios
    pod install
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ iOS CocoaPods 依赖安装成功${NC}"
    else
        echo -e "${RED}❌ iOS CocoaPods 依赖安装失败${NC}"
        cd ..
        exit 1
    fi
    cd ..
else
    echo -e "${RED}❌ ios 文件夹不存在${NC}"
    exit 1
fi
echo ""

# 6. 生成 iOS JavaScript Bundle
echo "📦 步骤 6/10: 生成 iOS JavaScript Bundle..."
npx react-native bundle \
    --entry-file index.js \
    --platform ios \
    --dev false \
    --bundle-output ios/main.jsbundle \
    --assets-dest ios

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ iOS JavaScript Bundle 生成成功${NC}"
else
    echo -e "${RED}❌ iOS JavaScript Bundle 生成失败${NC}"
    exit 1
fi
echo ""

# 7. 验证 iOS 文件
echo "🔍 步骤 7/10: 验证 iOS 文件..."
IOS_MISSING=0

if [ ! -d "ios/Pods" ]; then
    echo -e "${RED}❌ ios/Pods 文件夹不存在${NC}"
    IOS_MISSING=1
else
    echo -e "${GREEN}✅ ios/Pods 文件夹存在${NC}"
fi

if [ ! -f "ios/main.jsbundle" ]; then
    echo -e "${RED}❌ ios/main.jsbundle 文件不存在${NC}"
    IOS_MISSING=1
else
    BUNDLE_SIZE=$(du -h ios/main.jsbundle | cut -f1)
    echo -e "${GREEN}✅ ios/main.jsbundle 文件存在 (大小: $BUNDLE_SIZE)${NC}"
fi

if [ $IOS_MISSING -eq 1 ]; then
    echo -e "${RED}❌ iOS 部分文件缺失${NC}"
    exit 1
fi
echo ""

# 8. 生成 Android JavaScript Bundle
echo -e "${BLUE}========== Android 配置 ==========${NC}"
echo "📦 步骤 8/10: 生成 Android JavaScript Bundle..."
if [ -d "android" ]; then
    mkdir -p android/app/src/main/assets
    npx react-native bundle \
        --entry-file index.js \
        --platform android \
        --dev false \
        --bundle-output android/app/src/main/assets/index.android.bundle \
        --assets-dest android/app/src/main/res

    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Android JavaScript Bundle 生成成功${NC}"
    else
        echo -e "${RED}❌ Android JavaScript Bundle 生成失败${NC}"
        exit 1
    fi
else
    echo -e "${RED}❌ android 文件夹不存在${NC}"
    exit 1
fi
echo ""

# 9. 验证 Android 文件
echo "🔍 步骤 9/10: 验证 Android 文件..."
ANDROID_MISSING=0

if [ ! -f "android/app/src/main/assets/index.android.bundle" ]; then
    echo -e "${RED}❌ index.android.bundle 文件不存在${NC}"
    ANDROID_MISSING=1
else
    BUNDLE_SIZE=$(du -h android/app/src/main/assets/index.android.bundle | cut -f1)
    echo -e "${GREEN}✅ index.android.bundle 文件存在 (大小: $BUNDLE_SIZE)${NC}"
fi

if [ ! -f "android/build.gradle" ]; then
    echo -e "${RED}❌ android/build.gradle 文件不存在${NC}"
    ANDROID_MISSING=1
else
    echo -e "${GREEN}✅ android/build.gradle 文件存在${NC}"
fi

if [ $ANDROID_MISSING -eq 1 ]; then
    echo -e "${RED}❌ Android 部分文件缺失${NC}"
    exit 1
fi
echo ""

# 10. 完成
echo "=========================================="
echo -e "${GREEN}🎉 所有平台原生文件重新生成完成！${NC}"
echo "=========================================="
echo ""
echo "📝 下一步操作:"
echo ""
echo -e "${BLUE}iOS:${NC}"
echo "   1. 运行应用: npx expo run:ios"
echo "   2. 或指定模拟器: npx expo run:ios --device \"iPhone 17 Pro\""
echo "   3. 或在 Xcode 中打开: open ios/AIVoiceNotes.xcworkspace"
echo ""
echo -e "${BLUE}Android:${NC}"
echo "   1. 运行应用: npx expo run:android"
echo "   2. 或在 Android Studio 中打开: open -a \"Android Studio\" android"
echo ""
echo "📊 生成的文件:"
echo -e "${BLUE}iOS:${NC}"
echo "   - ios/                    (Xcode 项目)"
echo "   - ios/Pods/               (CocoaPods 依赖)"
echo "   - ios/main.jsbundle       (JavaScript Bundle)"
echo "   - ios/assets/             (资源文件)"
echo ""
echo -e "${BLUE}Android:${NC}"
echo "   - android/                                    (Android 项目)"
echo "   - android/app/src/main/assets/               (Bundle 文件)"
echo "   - android/app/src/main/res/                  (资源文件)"
echo ""
