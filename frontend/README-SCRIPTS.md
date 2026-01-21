# 自动化脚本使用说明

## 🚀 快速开始

### 重新生成 iOS 原生文件

```bash
./rebuild-ios.sh
```

### 重新生成 Android 原生文件

```bash
./rebuild-android.sh
```

### 重新生成所有平台

```bash
./rebuild-all.sh
```

## 📋 脚本功能

所有脚本都会自动完成：

1. ✅ 清除旧的原生文件
2. ✅ 清除缓存
3. ✅ 生成原生项目文件
4. ✅ 安装依赖（iOS: CocoaPods）
5. ✅ **生成 JavaScript Bundle 文件**
6. ✅ 验证所有必需文件
7. ✅ 显示下一步操作

## 🎯 何时使用

- 添加了新的原生模块（如 expo-notifications）
- 修改了 app.json 配置
- 更新了 Expo SDK 版本
- 需要生成生产版本的 Bundle
- 原生文件出现问题需要重新生成

## 📝 详细文档

查看完整文档：`../docs/生成原生文件操作指南.md`

## ⚠️ 注意事项

- 脚本会删除现有的 `ios/` 或 `android/` 文件夹
- 确保在 `frontend` 目录下运行
- 首次运行可能需要较长时间（下载依赖）
