#!/bin/bash

# VocalClerk App Icon Generator
# 使用 ImageMagick 创建应用图标

set -e

echo "🎨 开始生成 VocalClerk 应用图标..."
echo ""

# 颜色定义
PRIMARY_COLOR="#4A90E2"      # 主蓝色
SECONDARY_COLOR="#3498DB"    # 亮蓝色
ACCENT_COLOR="#2980B9"       # 深蓝色
CHECK_COLOR="#2ECC71"        # 绿色
WHITE="#FFFFFF"
GRAY="#646464"
LIGHT_GRAY="#B4B4B4"

# 创建临时目录
TMP_DIR="./tmp_icon"
mkdir -p "$TMP_DIR"

# 生成主图标 (1024x1024)
echo "📱 生成主图标 (1024x1024)..."

# 创建渐变背景
convert -size 1024x1024 \
    gradient:"$PRIMARY_COLOR"-"$ACCENT_COLOR" \
    -rotate 180 \
    "$TMP_DIR/background.png"

# 创建圆角遮罩
convert -size 1024x1024 xc:none \
    -draw "roundrectangle 0,0 1024,1024 200,200" \
    "$TMP_DIR/mask.png"

# 应用圆角到背景
convert "$TMP_DIR/background.png" "$TMP_DIR/mask.png" \
    -alpha off -compose CopyOpacity -composite \
    "$TMP_DIR/bg_rounded.png"

# 创建白色卡片
convert -size 512x614 xc:white \
    \( +clone -alpha extract \
       -draw 'fill black polygon 0,0 0,50 50,0 fill white circle 50,50 50,0' \
       \( +clone -flip \) -compose Multiply -composite \
       \( +clone -flop \) -compose Multiply -composite \
    \) -alpha off -compose CopyOpacity -composite \
    -gravity center \
    "$TMP_DIR/card.png"

# 创建任务列表项
# 第一个任务 - 已完成（绿色勾选）
convert -size 51x51 xc:none \
    -fill "$CHECK_COLOR" \
    -draw "roundrectangle 0,0 51,51 10,10" \
    -fill white -stroke white -strokewidth 8 \
    -draw "polyline 13,26 23,36 38,15" \
    "$TMP_DIR/checkbox_checked.png"

# 未完成的复选框
convert -size 51x51 xc:none \
    -fill none -stroke "$LIGHT_GRAY" -strokewidth 5 \
    -draw "roundrectangle 0,0 51,51 10,10" \
    "$TMP_DIR/checkbox_empty.png"

# 创建任务文本线条
convert -size 300x12 xc:"$GRAY" "$TMP_DIR/line_active.png"
convert -size 300x12 xc:"$LIGHT_GRAY" "$TMP_DIR/line_done.png"
convert -size 180x8 xc:"$LIGHT_GRAY" "$TMP_DIR/line_short.png"

# 组合卡片和任务项
convert "$TMP_DIR/card.png" \
    \( "$TMP_DIR/checkbox_checked.png" -geometry +82+102 \) -composite \
    \( "$TMP_DIR/line_done.png" -geometry +164+119 \) -composite \
    \( "$TMP_DIR/checkbox_empty.png" -geometry +82+205 \) -composite \
    \( "$TMP_DIR/line_active.png" -geometry +164+222 \) -composite \
    \( "$TMP_DIR/line_short.png" -geometry +164+256 \) -composite \
    \( "$TMP_DIR/checkbox_empty.png" -geometry +82+308 \) -composite \
    \( "$TMP_DIR/line_active.png" -geometry +164+325 \) -composite \
    "$TMP_DIR/card_with_tasks.png"

# 创建麦克风图标
convert -size 154x154 xc:none \
    -fill white -stroke "$SECONDARY_COLOR" -strokewidth 8 \
    -draw "circle 77,77 77,0" \
    -fill "$SECONDARY_COLOR" \
    -draw "roundrectangle 52,41 102,113 25,25" \
    -fill none -stroke "$SECONDARY_COLOR" -strokewidth 6 \
    -draw "arc 36,92 118,133 0,180" \
    -draw "line 77,113 77,133" \
    -draw "rectangle 52,133 102,146" \
    "$TMP_DIR/microphone.png"

# 组合所有元素
convert "$TMP_DIR/bg_rounded.png" \
    \( "$TMP_DIR/card_with_tasks.png" -geometry +256+205 \) -composite \
    \( "$TMP_DIR/microphone.png" -geometry +768+102 \) -composite \
    "assets/icon.png"

echo "   ✅ 已保存: assets/icon.png"

# 复制为其他图标
cp assets/icon.png assets/adaptive-icon.png
echo "   ✅ 已保存: assets/adaptive-icon.png"

cp assets/icon.png assets/splash-icon.png
echo "   ✅ 已保存: assets/splash-icon.png"

# 生成 favicon (512x512)
convert assets/icon.png -resize 512x512 assets/favicon.png
echo "   ✅ 已保存: assets/favicon.png"

# 清理临时文件
rm -rf "$TMP_DIR"

echo ""
echo "🎉 所有图标生成完成！"
echo ""
echo "📝 生成的图标:"
echo "   - assets/icon.png (1024x1024) - 主应用图标"
echo "   - assets/adaptive-icon.png (1024x1024) - Android 自适应图标"
echo "   - assets/splash-icon.png (1024x1024) - 启动屏幕图标"
echo "   - assets/favicon.png (512x512) - Web favicon"
echo ""
echo "💡 下一步:"
echo "   1. 查看生成的图标: open assets/icon.png"
echo "   2. 如果满意，重新构建应用:"
echo "      ./rebuild-ios.sh 或 ./rebuild-android.sh"
echo ""
