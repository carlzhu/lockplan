# DoNow Backend API

基于 .NET 8 的 RESTful API，采用 Clean Architecture 架构。

## 🚀 快速开始

### 最少参数（仅 2 个必需）

`appsettings.json` 提供了默认配置，你**只需要覆盖敏感信息**：

```bash
docker run -d \
  --name donow-api \
  -p 8080:8080 \
  -e ConnectionStrings__DefaultConnection="Server=your-server;Port=3306;Database=donow;User=root;Password=your-password" \
  -e Jwt__Secret="your-secret-key-at-least-32-characters" \
  zhurg/donow-api:latest
```

**就这 2 个参数！** 其他配置会使用 `appsettings.json` 中的默认值。

### 完整配置（可选）

如果需要覆盖更多配置：

```bash
docker run -d \
  --name donow-api \
  -p 8080:8080 \
  -e ConnectionStrings__DefaultConnection="Server=sh-cdb-0voyapin.sql.tencentcdb.com;Port=63239;Database=vocalclerk;User=root;Password=Riwfgkhgm*8;SslMode=None" \
  -e Jwt__Secret="doNowSecretKey2023ForSecureTokenGenerationAndValidationWithExtraSecurityBits" \
  -e Jwt__Issuer="DoNowApi" \
  -e Jwt__Audience="DoNowClient" \
  -e AI__Qianwen__ApiKey="sk-bcc1971cd90d4133979537035333ef9f" \
  zhurg/donow-api:latest
```

访问 http://localhost:8080/swagger

## 🔧 环境变量配置

### 配置加载机制

.NET 按以下顺序加载配置：
1. **appsettings.json** - 提供默认值
2. **环境变量** - 覆盖默认值

所以你**只需要传递需要覆盖的参数**，其他使用默认值。

### 必需的环境变量（仅 2 个）

```bash
# 数据库连接（必需）
-e ConnectionStrings__DefaultConnection="Server=your-server;Port=3306;Database=donow;User=root;Password=your-password"

# JWT 密钥（必需，至少 32 字符）
-e Jwt__Secret="your-super-secret-key-at-least-32-characters-long"
```

### 可选的环境变量

这些都有默认值，不传也能运行：

```bash
# JWT 配置（默认值已在 appsettings.json 中）
-e Jwt__Issuer="DoNowApi"                    # 默认: DoNowApi
-e Jwt__Audience="DoNowClient"               # 默认: DoNowClient
-e Jwt__ExpirationMs="86400000"              # 默认: 86400000 (24小时)

# AI 配置
-e AI__Qianwen__ApiKey="sk-your-api-key"     # 默认: 空（不使用 AI 功能）
-e AI__Qianwen__Url="https://..."            # 默认: 千问官方地址
-e AI__Ollama__Url="http://..."              # 默认: localhost:11434

# 安全配置
-e Security__MaxFailedAttempts="5"           # 默认: 5
-e Security__AccountLockDurationMinutes="30" # 默认: 30
```

### appsettings.json 中的默认值

```json
{
  "Jwt": {
    "Issuer": "DoNowApi",
    "Audience": "DoNowClient",
    "ExpirationMs": "86400000"
  },
  "Security": {
    "MaxFailedAttempts": 5,
    "AccountLockDurationMinutes": 30
  },
  "AI": {
    "Qianwen": {
      "Url": "https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation"
    },
    "Ollama": {
      "Url": "http://localhost:11434/api/generate"
    }
  }
}
```

## 📁 项目结构

```
backend/
├── DoNow.Api/              # API 层（Controllers）
├── DoNow.Application/      # 应用层（Services, DTOs）
├── DoNow.Domain/           # 领域层（Entities）
├── DoNow.Infrastructure/   # 基础设施层（Data Access）
├── DoNow.Tests/            # 测试
└── Dockerfile              # Docker 镜像构建
```

## 🧪 本地开发

### 前置要求

- .NET 8.0 SDK
- MySQL 8.0+

### 运行

```bash
cd DoNow.Api
dotnet run
```

### 测试

```bash
dotnet test
```

## 📚 常用命令

```bash
# 查看日志
docker logs -f donow-api

# 重启服务
docker restart donow-api

# 停止服务
docker stop donow-api

# 更新到最新版本
docker pull zhurg/donow-api:latest
docker stop donow-api && docker rm donow-api
# 然后重新运行 docker run 命令
```

## ☁️ 云平台部署

### Kubernetes

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: donow-secrets
type: Opaque
stringData:
  db-connection: "Server=your-server;Port=3306;Database=donow;User=root;Password=your-password"
  jwt-secret: "your-secret-key"
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: donow-api
spec:
  replicas: 2
  selector:
    matchLabels:
      app: donow-api
  template:
    metadata:
      labels:
        app: donow-api
    spec:
      containers:
      - name: api
        image: zhurg/donow-api:latest
        ports:
        - containerPort: 8080
        env:
        - name: ConnectionStrings__DefaultConnection
          valueFrom:
            secretKeyRef:
              name: donow-secrets
              key: db-connection
        - name: Jwt__Secret
          valueFrom:
            secretKeyRef:
              name: donow-secrets
              key: jwt-secret
```

### Docker Swarm

```bash
docker service create \
  --name donow-api \
  --publish 8080:8080 \
  --env ConnectionStrings__DefaultConnection="Server=your-server;Port=3306;Database=donow;User=root;Password=your-password" \
  --env Jwt__Secret="your-secret-key" \
  zhurg/donow-api:latest
```

---

## 🔒 安全提示

- ⚠️ JWT 密钥至少 32 字符
- ⚠️ 生产环境使用强密码
- ⚠️ 定期更新镜像和密钥
- ⚠️ 使用 Kubernetes Secrets 管理敏感信息

## 📖 API 文档

启动后访问 Swagger UI：
- 本地: http://localhost:5000/swagger
- Docker: http://localhost:8080/swagger
