# 验证路由配置

## 🧪 快速验证

### 1. 启动后端

```bash
cd backend
./run-dev.sh
```

### 2. 验证 Swagger

在浏览器中打开：
```
http://localhost:5000/swagger
```

应该能看到 Swagger UI 界面，显示所有 API 端点。

### 3. 验证 API 端点

所有 API 端点应该都有 `/api/donow` 前缀：

```bash
# 测试健康检查（如果有）
curl http://localhost:5000/api/donow/health

# 测试注册端点
curl -X POST http://localhost:5000/api/donow/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "Test123!",
    "fullName": "Test User"
  }'
```

### 4. 在 Swagger 中测试

1. 打开 http://localhost:5000/swagger
2. 展开任意 API 端点
3. 点击 "Try it out"
4. 查看 Request URL，应该包含 `/api/donow` 前缀

例如：
```
http://localhost:5000/api/donow/auth/register
http://localhost:5000/api/donow/tasks
http://localhost:5000/api/donow/events
```

## ✅ 预期结果

### Swagger UI
- ✅ 可以正常访问 http://localhost:5000/swagger
- ✅ 显示所有 API 端点
- ✅ 所有端点都有 `/api/donow` 前缀

### API 端点
- ✅ `/api/donow/auth/register` - 用户注册
- ✅ `/api/donow/auth/login` - 用户登录
- ✅ `/api/donow/tasks` - 任务管理
- ✅ `/api/donow/events` - 事件管理
- ✅ `/api/donow/categories` - 分类管理

### 不应该有前缀的路由
- ✅ `/swagger` - Swagger UI
- ✅ `/swagger/v1/swagger.json` - Swagger JSON

## 🔍 故障排除

### Swagger 无法访问

**问题**: 访问 http://localhost:5000/swagger 返回 404

**可能原因**:
1. 后端未启动
2. 端口被占用
3. 路由配置错误

**解决方案**:
```bash
# 检查后端是否运行
curl http://localhost:5000/swagger

# 检查端口占用
lsof -i :5000

# 重启后端
cd backend
./run-dev.sh
```

### API 端点返回 404

**问题**: 访问 API 端点返回 404

**检查清单**:
1. ✅ 是否使用了 `/api/donow` 前缀？
2. ✅ 控制器路由是否正确？
3. ✅ 是否有 `[ApiController]` 特性？

**正确的 URL 格式**:
```
✅ http://localhost:5000/api/donow/tasks
❌ http://localhost:5000/tasks
❌ http://localhost:5000/api/tasks
```

### 前端无法连接

**问题**: 前端应用无法连接到后端

**检查**:
1. 前端 `apiConfig.ts` 中的 `API_PREFIX` 是否为 `/api/donow`
2. 后端 CORS 是否配置正确
3. 网络连接是否正常

**验证前端配置**:
```typescript
// frontend/src/config/apiConfig.ts
export const API_PREFIX = '/api/donow';  // 应该是这个值
```

## 📝 测试脚本

使用提供的测试脚本：

```bash
cd backend
./test-api.sh
```

脚本会自动测试所有主要端点，并显示结果。

## 🔧 调试技巧

### 查看所有注册的路由

在 `Program.cs` 中添加调试代码（开发环境）：

```csharp
if (app.Environment.IsDevelopment())
{
    var endpoints = app.Services.GetRequiredService<IEnumerable<EndpointDataSource>>()
        .SelectMany(es => es.Endpoints)
        .OfType<RouteEndpoint>();
    
    foreach (var endpoint in endpoints)
    {
        Console.WriteLine($"Route: {endpoint.RoutePattern.RawText}");
    }
}
```

### 启用详细日志

在 `appsettings.Development.json` 中：

```json
{
  "Logging": {
    "LogLevel": {
      "Default": "Debug",
      "Microsoft.AspNetCore": "Debug"
    }
  }
}
```

## 📚 相关文档

- [API路由配置说明](../docs/API路由配置说明.md)
- [Program.cs](DoNow.Api/Program.cs)
- [MvcOptionsExtensions.cs](DoNow.Api/Extensions/MvcOptionsExtensions.cs)

---

**最后更新**: 2026-01-21
