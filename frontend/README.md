# DoNow Frontend

React Native 移动应用前端。

## 🚀 快速开始

```bash
# 安装依赖
npm install

# 启动开发服务器
npx expo start
```

然后按 `i` 启动 iOS 模拟器，或按 `a` 启动 Android 模拟器。

## 📦 生成原生文件

首次运行或添加原生模块后：

```bash
# iOS
./rebuild-ios.sh

# Android
./rebuild-android.sh

# 所有平台
./rebuild-all.sh
```

## 🛠️ 可用脚本

- `./rebuild-ios.sh` - 重新生成 iOS 原生文件
- `./rebuild-android.sh` - 重新生成 Android 原生文件
- `./rebuild-all.sh` - 重新生成所有平台
- `./deploy.sh` - EAS 云构建和部署

详细说明: [脚本使用说明](../docs/脚本使用说明.md)

## 📱 运行应用

```bash
# iOS
npx expo run:ios

# Android
npx expo run:android

# 指定设备
npx expo run:ios --device "iPhone 17 Pro"
```

## 📚 更多文档

查看项目根目录的 [README.md](../README.md) 和 [docs/](../docs/) 目录。
