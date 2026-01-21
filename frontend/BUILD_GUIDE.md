# React Native 打包指南

> **💡 想用 Xcode 打包 iOS 应用？** 查看 [Xcode 打包快速参考](../docs/02.Xcode打包快速参考.md) ⭐
> 
> **⚠️ 重要！** 打包前必须先创建 Bundle，查看 [重要提示-Bundle文件](../docs/00.重要提示-Bundle文件.md)

## 📁 目录说明

### 不是打包产物的文件夹
- `ios/` - iOS 原生项目代码（Xcode 项目）
- `android/` - Android 原生项目代码
- `src/` - React Native 源代码

### 打包产物
- `ios/main.jsbundle` - iOS JavaScript bundle
- `ios/assets/` - iOS 资源文件
- `android/app/src/main/assets/index.android.bundle` - Android bundle
- `android/app/src/main/res/` - Android 资源

## 🔄 重新打包流程

### 方法 1: 使用 npm 脚本（推荐）

#### iOS
```bash
# 清理并重新打包
npm run bundle:ios

# 或手动清理后打包
rm -f ios/main.jsbundle
rm -rf ios/assets
npm run bundle:ios
```

#### Android
```bash
# 清理并重新打包
npm run bundle:android

# 或手动清理后打包
rm -f android/app/src/main/assets/index.android.bundle
rm -rf android/app/src/main/res/drawable-*
npm run bundle:android
```

#### 所有平台
```bash
npm run bundle:all
```

### 方法 2: 使用原生命令

#### iOS
```bash
npx react-native bundle \
  --entry-file=index.js \
  --platform=ios \
  --dev=false \
  --bundle-output=./ios/main.jsbundle \
  --assets-dest=./ios \
  --minify=true
```

#### Android
```bash
npx react-native bundle \
  --entry-file=index.js \
  --platform=android \
  --dev=false \
  --bundle-output=./android/app/src/main/assets/index.android.bundle \
  --assets-dest=./android/app/src/main/res \
  --minify=true
```

## 🏗️ 完整构建流程

### iOS 完整构建

#### 1. 清理
```bash
# 清理 bundle
rm -f ios/main.jsbundle
rm -rf ios/assets

# 清理 Xcode 构建缓存
rm -rf ios/build
rm -rf ios/Pods
```

#### 2. 安装依赖
```bash
# 安装 npm 依赖
npm install

# 安装 CocoaPods 依赖
cd ios
pod install
cd ..
```

#### 3. 创建 bundle
```bash
npm run bundle:ios
```

#### 4. 构建应用
```bash
# 使用 React Native CLI
npx react-native run-ios

# 或使用 Xcode
open ios/AIVoiceNotes.xcworkspace
# 然后在 Xcode 中点击 Run
```

### Android 完整构建

#### 1. 清理
```bash
# 清理 bundle
rm -f android/app/src/main/assets/index.android.bundle
rm -rf android/app/src/main/res/drawable-*

# 清理 Gradle 缓存
cd android
./gradlew clean
cd ..
```

#### 2. 安装依赖
```bash
npm install
```

#### 3. 创建 bundle
```bash
npm run bundle:android
```

#### 4. 构建应用
```bash
# Debug 版本
npx react-native run-android

# Release 版本
cd android
./gradlew assembleRelease
cd ..
```

## 📦 生产构建

### iOS 生产构建

#### 使用 Expo EAS（推荐）
```bash
# 安装 EAS CLI
npm install -g eas-cli

# 登录
eas login

# 配置项目
eas build:configure

# 构建
eas build --platform ios --profile production
```

#### 使用 Xcode
1. 打开 `ios/AIVoiceNotes.xcworkspace`
2. 选择 Product → Archive
3. 上传到 App Store Connect

### Android 生产构建

#### 使用 Expo EAS（推荐）
```bash
eas build --platform android --profile production
```

#### 使用 Gradle
```bash
cd android
./gradlew bundleRelease  # 生成 AAB
# 或
./gradlew assembleRelease  # 生成 APK
cd ..
```

输出位置：
- AAB: `android/app/build/outputs/bundle/release/app-release.aab`
- APK: `android/app/build/outputs/apk/release/app-release.apk`

## 🔍 验证打包结果

### 检查 iOS bundle
```bash
ls -lh ios/main.jsbundle
ls -la ios/assets/
```

应该看到：
- `main.jsbundle` 文件（约 2-3 MB）
- `assets/` 文件夹包含图片等资源

### 检查 Android bundle
```bash
ls -lh android/app/src/main/assets/index.android.bundle
ls -la android/app/src/main/res/drawable-*/
```

## 🐛 常见问题

### 问题 1: Bundle 创建失败
```bash
# 清理缓存
npm cache clean --force
rm -rf node_modules
npm install

# 重新打包
npm run bundle:ios
```

### 问题 2: 资源文件缺失
```bash
# 确保 assets 目录存在
mkdir -p ios/assets
mkdir -p android/app/src/main/assets

# 重新打包
npm run bundle:all
```

### 问题 3: Metro 配置警告
更新 `metro.config.js`:
```javascript
const { getDefaultConfig } = require('@react-native/metro-config');

module.exports = getDefaultConfig(__dirname);
```

### 问题 4: iOS 构建失败
```bash
# 重新安装 Pods
cd ios
rm -rf Pods Podfile.lock
pod install
cd ..
```

### 问题 5: Android 构建失败
```bash
# 清理 Gradle
cd android
./gradlew clean
./gradlew --stop
cd ..

# 重新构建
npm run bundle:android
```

## 📊 打包文件大小

### 开发版本
- iOS bundle: ~2-3 MB
- Android bundle: ~2-3 MB

### 生产版本（minified）
- iOS bundle: ~1-2 MB
- Android bundle: ~1-2 MB

### 完整应用
- iOS IPA: ~30-50 MB
- Android APK: ~20-40 MB
- Android AAB: ~15-30 MB

## 🚀 快速命令参考

```bash
# 清理所有打包文件
npm run clean  # 如果有这个脚本

# 重新打包 iOS
rm -f ios/main.jsbundle && npm run bundle:ios

# 重新打包 Android
rm -f android/app/src/main/assets/index.android.bundle && npm run bundle:android

# 运行开发版本（不需要打包）
npm start
npx react-native run-ios
npx react-native run-android

# 构建生产版本
npm run build:prod
```

## 📝 注意事项

1. **开发时不需要打包**：使用 `npm start` 启动 Metro，代码会实时更新
2. **真机测试需要打包**：在真机上运行需要先创建 bundle
3. **生产发布必须打包**：上传到 App Store 或 Google Play 前必须打包
4. **bundle 文件不要提交到 git**：已在 `.gitignore` 中排除

## 🔗 相关文档

- [React Native 打包文档](https://reactnative.dev/docs/signed-apk-android)
- [Expo EAS Build](https://docs.expo.dev/build/introduction/)
- [iOS 发布指南](https://reactnative.dev/docs/publishing-to-app-store)
- [Android 发布指南](https://reactnative.dev/docs/signed-apk-android)
