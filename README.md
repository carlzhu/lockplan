# DoNow

一个基于 React Native 和 .NET 8 的任务和事件管理应用。

## 📱 功能特性

- ✅ **任务管理** - 创建、编辑、删除任务，支持优先级和截止日期
- 📅 **事件记录** - 记录各类事件，支持分类和标签
- 🔔 **智能提醒** - 任务到期前自动提醒
- 📴 **离线优先** - 离线模式下正常使用，自动同步
- 🎨 **统一界面** - 任务和事件在同一界面创建，随时切换
- 🔐 **用户认证** - JWT 认证，安全可靠

## 🚀 快速开始

### 前置要求

- **Node.js** 18+
- **.NET SDK** 8.0+
- **iOS 开发**: macOS + Xcode 14+ + CocoaPods
  - ⚠️ **个人免费开发者账号**：需要禁用推送通知功能（见下方说明）
  - ✅ **付费开发者账号**：支持所有功能
- **Android 开发**: Android Studio + Java JDK 17+

### 1. 克隆项目

```bash
git clone <repository-url>
cd ai-rest
```

### 2. 启动后端

```bash
cd backend
./run-dev.sh
```

后端将运行在:
- HTTP: http://localhost:5000
- API 端点: http://localhost:5000/api/vpp/{endpoint}
- Swagger: http://localhost:5000/swagger

### 3. 启动前端

```bash
cd frontend
npm install
npx expo start
```

然后按 `i` 启动 iOS 模拟器，或按 `a` 启动 Android 模拟器。

## 📦 生成原生文件

首次运行或添加原生模块后，需要生成原生文件：

```bash
cd frontend

# iOS
./rebuild-ios.sh

# Android
./rebuild-android.sh

# 或同时生成两个平台
./rebuild-all.sh
```

### ⚠️ iOS 个人开发者账号

如果使用**个人免费开发者账号**，需要先禁用推送通知功能：

```bash
cd frontend
./fix-ios-personal-account.sh
```

详细说明请查看：
- [iOS 个人开发者账号说明](docs/iOS个人开发者账号说明.md)
- [生成原生文件操作指南](docs/生成原生文件操作指南.md)

## 🏗️ 项目结构

```
.
├── frontend/              # React Native 前端
│   ├── src/
│   │   ├── screens/      # 界面组件
│   │   ├── services/     # API 和本地服务
│   │   ├── context/      # React Context
│   │   └── navigation/   # 导航配置
│   ├── rebuild-ios.sh    # iOS 原生文件生成脚本
│   ├── rebuild-android.sh # Android 原生文件生成脚本
│   └── rebuild-all.sh    # 生成所有平台
│
├── backend/              # .NET 8 后端
│   ├── DoNow.Api/          # API 层
│   ├── DoNow.Application/  # 应用层
│   ├── DoNow.Domain/       # 领域层
│   ├── DoNow.Infrastructure/ # 基础设施层
│   ├── run-dev.sh        # 启动开发服务器
│   └── test-api.sh       # API 测试脚本
│
├── docs/                 # 文档
│   ├── 生成原生文件操作指南.md
│   ├── 脚本使用说明.md
│   └── Git配置说明.md
│
├── .gitignore           # Git 忽略配置
└── README.md            # 本文档
```

## 🛠️ 技术栈

### 前端
- **React Native** - 跨平台移动应用框架
- **Expo** - React Native 开发工具
- **TypeScript** - 类型安全
- **AsyncStorage** - 本地数据存储
- **Expo Notifications** - 本地通知

### 后端
- **.NET 8** - 现代化的后端框架
- **Entity Framework Core** - ORM
- **MySQL** - 数据库
- **JWT** - 身份认证
- **Swagger** - API 文档

## 📚 文档

- [生成原生文件操作指南](docs/生成原生文件操作指南.md) - 详细的原生文件生成步骤
- [iOS 个人开发者账号说明](docs/iOS个人开发者账号说明.md) - 个人账号的限制和解决方案
- [脚本使用说明](docs/脚本使用说明.md) - 所有脚本的使用方法

## 🔧 常用命令

### 后端

```bash
# 启动开发服务器
cd backend
./run-dev.sh

# 测试 API
./test-api.sh

# 手动运行
dotnet run --project DoNow.Api
```

### 前端

```bash
# 安装依赖
cd frontend
npm install

# 启动开发服务器
npx expo start

# 生成 iOS 原生文件
./rebuild-ios.sh

# 生成 Android 原生文件
./rebuild-android.sh

# 运行 iOS
npx expo run:ios

# 运行 Android
npx expo run:android
```

## 🎯 核心功能

### 统一创建界面

任务和事件可以在同一个界面创建，通过顶部的切换器在两种类型之间切换：

```
┌─────────────────────────────────┐
│ [✓ 任务] [📅 事件]              │ ← 点击切换
├─────────────────────────────────┤
│ 创建新任务/事件                  │
│                                 │
│ 标题 *                          │
│ 描述                            │
│ 日期时间                         │
│ ...                             │
└─────────────────────────────────┘
```

### 离线优先架构

- 所有操作优先保存到本地
- 网络恢复后自动同步
- 使用 UUID 作为主键
- 毫秒级时间戳
- 支持冲突检测

### 智能通知

- 任务到期前自动提醒
- 支持自定义提前时间（5/15/30/60分钟）
- 根据优先级设置通知级别
- 应用关闭也能收到通知

## 🧪 测试

### 后端测试

```bash
cd backend
./test-api.sh
```

### 前端测试

1. 启动应用
2. 创建任务和事件
3. 测试离线模式（关闭网络）
4. 测试通知功能

## 📝 开发指南

### 添加新的原生模块

```bash
# 1. 安装模块
cd frontend
npm install <module-name>

# 2. 重新生成原生文件
./rebuild-ios.sh      # iOS
./rebuild-android.sh  # Android
```

### 修改 app.json 配置

修改 `frontend/app.json` 后，需要重新生成原生文件：

```bash
cd frontend
./rebuild-all.sh
```

### 数据库迁移

```bash
cd backend/DoNow.Infrastructure

# 创建迁移
dotnet ef migrations add <MigrationName> --startup-project ../DoNow.Api

# 应用迁移
dotnet ef database update --startup-project ../DoNow.Api
```

## 🐛 故障排除

### iOS 构建失败

```bash
cd frontend
rm -rf ios
./rebuild-ios.sh
```

### Android 构建失败

```bash
cd frontend
rm -rf android
./rebuild-android.sh
```

### 后端连接失败

检查后端是否正在运行：
```bash
curl http://localhost:5000/swagger
```

### 清除所有缓存

```bash
# 前端
cd frontend
rm -rf node_modules
rm -rf .expo
npm install
./rebuild-all.sh

# 后端
cd backend
dotnet clean
dotnet restore
```

## 📄 许可证

[LICENSE](LICENSE)

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📧 联系方式

如有问题，请提交 Issue。

---

**最后更新**: 2026-01-21
