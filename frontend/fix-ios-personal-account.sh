#!/bin/bash

# 修复 iOS 个人开发者账号的推送通知问题
# 用途: 禁用推送通知功能，使其可以在个人免费账号上运行

set -e

echo "=========================================="
echo "🔧 修复 iOS 个人开发者账号问题"
echo "=========================================="
echo ""

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# 1. 检查当前目录
echo "📍 步骤 1/4: 检查当前目录..."
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ 错误: 请在 frontend 目录下运行此脚本${NC}"
    exit 1
fi
echo -e "${GREEN}✅ 当前目录正确${NC}"
echo ""

# 2. 备份原文件
echo "💾 步骤 2/4: 备份配置文件..."
if [ -f "app.json" ]; then
    cp app.json app.json.backup
    echo -e "${GREEN}✅ 已备份 app.json${NC}"
fi
echo ""

# 3. 修改 app.json - 移除 expo-notifications 插件
echo "🔧 步骤 3/4: 修改 app.json 配置..."
echo -e "${YELLOW}   移除 expo-notifications 插件...${NC}"

# 使用 node 来修改 JSON 文件
node -e "
const fs = require('fs');
const appJson = JSON.parse(fs.readFileSync('app.json', 'utf8'));

// 移除 expo-notifications 插件
if (appJson.expo.plugins) {
    appJson.expo.plugins = appJson.expo.plugins.filter(plugin => {
        if (Array.isArray(plugin)) {
            return plugin[0] !== 'expo-notifications';
        }
        return plugin !== 'expo-notifications';
    });
}

fs.writeFileSync('app.json', JSON.stringify(appJson, null, 2));
console.log('✅ 已移除 expo-notifications 插件');
"

echo -e "${GREEN}✅ app.json 配置已更新${NC}"
echo ""

# 4. 重新生成 iOS 原生文件
echo "🔨 步骤 4/4: 重新生成 iOS 原生文件..."
echo -e "${YELLOW}   这将清除旧的配置并重新生成...${NC}"

# 删除旧的 ios 目录
if [ -d "ios" ]; then
    rm -rf ios
    echo -e "${GREEN}✅ 已删除旧的 ios 目录${NC}"
fi

# 重新生成
npx expo prebuild --platform ios --clean --no-install

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ iOS 原生文件重新生成成功${NC}"
else
    echo -e "${RED}❌ iOS 原生文件生成失败${NC}"
    exit 1
fi
echo ""

# 5. 安装 CocoaPods 依赖
echo "📦 安装 CocoaPods 依赖..."
cd ios
pod install
cd ..
echo -e "${GREEN}✅ CocoaPods 依赖安装成功${NC}"
echo ""

# 6. 验证 entitlements 文件
echo "🔍 验证配置..."
if [ -f "ios/AIVoiceNotes/AIVoiceNotes.entitlements" ]; then
    if grep -q "aps-environment" ios/AIVoiceNotes/AIVoiceNotes.entitlements; then
        echo -e "${YELLOW}⚠️  警告: entitlements 文件仍包含推送通知配置${NC}"
        echo -e "${YELLOW}   手动移除 aps-environment 配置...${NC}"
        # 创建一个空的 entitlements 文件
        cat > ios/AIVoiceNotes/AIVoiceNotes.entitlements << 'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
  <dict>
  </dict>
</plist>
EOF
        echo -e "${GREEN}✅ 已清理 entitlements 文件${NC}"
    else
        echo -e "${GREEN}✅ entitlements 文件配置正确${NC}"
    fi
fi
echo ""

echo "=========================================="
echo -e "${GREEN}🎉 修复完成！${NC}"
echo "=========================================="
echo ""
echo "📝 说明:"
echo "   - 已禁用推送通知功能"
echo "   - 现在可以使用个人免费开发者账号运行"
echo "   - 本地通知功能仍然可用（不需要推送通知）"
echo ""
echo "📝 下一步:"
echo "   1. 在 Xcode 中打开项目: open ios/AIVoiceNotes.xcworkspace"
echo "   2. 选择你的开发团队（Personal Team）"
echo "   3. 在 Signing & Capabilities 中确认没有 Push Notifications"
echo "   4. 运行应用: npx expo run:ios"
echo ""
echo "💡 提示:"
echo "   - 如果需要远程推送通知，需要付费的 Apple Developer Program ($99/年)"
echo "   - 本地通知（Local Notifications）不需要付费账号，仍然可以使用"
echo ""
