# DoNow Backend

.NET 8 后端 API 服务。

## 🚀 快速开始

```bash
# 使用脚本启动
./run-dev.sh

# 或手动启动
dotnet run --project DoNow.Api
```

服务将运行在:
- HTTP: http://localhost:5000
- HTTPS: https://localhost:5001
- API 端点: http://localhost:5000/api/vpp/{endpoint}
- Swagger: http://localhost:5000/swagger

## 🧪 测试 API

```bash
./test-api.sh
```

## 🏗️ 项目结构

```
backend/
├── DoNow.Api/          # API 层 (Controllers, Program.cs)
├── DoNow.Application/  # 应用层 (DTOs, Interfaces)
├── DoNow.Domain/       # 领域层 (Entities)
└── DoNow.Infrastructure/ # 基础设施层 (Services, Data)
```

## 🗄️ 数据库

### 创建迁移

```bash
cd DoNow.Infrastructure
dotnet ef migrations add <MigrationName> --startup-project ../DoNow.Api
```

### 应用迁移

```bash
dotnet ef database update --startup-project ../DoNow.Api
```

## 🛠️ 可用脚本

- `./run-dev.sh` - 启动开发服务器
- `./test-api.sh` - 测试 API 端点

## 📚 更多文档

查看项目根目录的 [README.md](../README.md) 和 [docs/](../docs/) 目录。
