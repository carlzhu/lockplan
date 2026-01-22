# iOS 个人开发者账号说明

## 问题描述

使用个人免费开发者账号（Personal Development Team）时，会遇到以下错误：

```
Cannot create a iOS App Development provisioning profile for "com.donow.app".
Personal development teams do not support the Push Notifications capability.
```

## 原因

- **个人免费账号**不支持推送通知（Push Notifications）功能
- **付费开发者账号**（Apple Developer Program，$99/年）才支持推送通知

## 解决方案

### 方案 1：使用自动修复脚本（推荐）

```bash
cd frontend
./fix-ios-personal-account.sh
```

脚本会自动：
1. 从 `app.json` 中移除 `expo-notifications` 插件
2. 重新生成 iOS 原生文件
3. 清理推送通知相关配置
4. 安装 CocoaPods 依赖

### 方案 2：手动修复

#### 步骤 1：修改 app.json

移除 `expo-notifications` 插件：

```json
{
  "expo": {
    "plugins": []
  }
}
```

#### 步骤 2：重新生成 iOS 原生文件

```bash
cd frontend
rm -rf ios
npx expo prebuild --platform ios --clean
cd ios
pod install
cd ..
```

#### 步骤 3：在 Xcode 中移除推送通知

1. 打开项目：
   ```bash
   open ios/AIVoiceNotes.xcworkspace
   ```

2. 在 Xcode 中：
   - 选择项目 `AIVoiceNotes`
   - 选择 Target `AIVoiceNotes`
   - 点击 `Signing & Capabilities` 标签
   - 找到 `Push Notifications` 功能
   - 点击左边的 `-` 按钮移除

3. 选择你的开发团队（Personal Team）

4. 运行应用：
   ```bash
   npx expo run:ios
   ```

## 功能影响

### ✅ 仍然可用的功能

- **本地通知**（Local Notifications）- 不需要推送通知功能
- **任务提醒** - 使用本地通知实现
- **事件提醒** - 使用本地通知实现
- **所有其他应用功能**

### ❌ 不可用的功能

- **远程推送通知**（Remote Push Notifications）
- **服务器主动推送消息**

## 本地通知 vs 远程推送通知

### 本地通知（Local Notifications）

- ✅ 免费账号可用
- ✅ 应用内设置的提醒
- ✅ 定时触发
- ✅ 不需要服务器
- ✅ 适用于任务提醒、事件提醒等场景

### 远程推送通知（Remote Push Notifications）

- ❌ 需要付费账号
- ✅ 服务器主动推送
- ✅ 应用关闭时也能收到
- ✅ 适用于聊天消息、系统通知等场景

## 升级到付费账号

如果需要远程推送通知功能，可以：

1. 访问 [Apple Developer Program](https://developer.apple.com/programs/)
2. 注册并支付 $99/年
3. 恢复 `app.json` 中的 `expo-notifications` 插件
4. 重新生成 iOS 原生文件
5. 配置推送通知证书

## 常见问题

### Q: 为什么应用还能收到通知？

A: 应用使用的是**本地通知**，不是远程推送通知。本地通知不需要推送通知功能。

### Q: 如何测试本地通知？

A: 在应用中创建任务并设置提醒时间，到时间后会收到本地通知。

### Q: 付费账号有什么其他好处？

A:
- 支持推送通知
- 可以发布到 App Store
- 支持 TestFlight 测试
- 支持 App Groups、iCloud 等高级功能
- 可以创建多个应用

### Q: 个人账号可以发布应用吗？

A: 不可以。发布到 App Store 需要付费的 Apple Developer Program 账号。

## 相关文件

- `frontend/app.json` - Expo 配置文件
- `frontend/fix-ios-personal-account.sh` - 自动修复脚本
- `frontend/ios/AIVoiceNotes/AIVoiceNotes.entitlements` - iOS 权限配置
- `frontend/rebuild-ios.sh` - iOS 原生文件生成脚本

## 参考链接

- [Apple Developer Program](https://developer.apple.com/programs/)
- [Expo Notifications](https://docs.expo.dev/versions/latest/sdk/notifications/)
- [iOS Capabilities](https://developer.apple.com/documentation/xcode/capabilities)

---

**最后更新**: 2026-01-21
