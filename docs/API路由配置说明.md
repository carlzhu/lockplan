# API 路由配置说明

## 📍 路由结构

DoNow API 使用统一的路由前缀 `/api/vpp`，所有 API 端点都在此前缀下。

### 完整 URL 格式

```
http://localhost:5000/api/vpp/{controller}/{action}
```

### 示例端点

| 功能 | 端点 | 完整 URL |
|------|------|----------|
| 用户注册 | `POST /auth/register` | `http://localhost:5000/api/vpp/auth/register` |
| 用户登录 | `POST /auth/login` | `http://localhost:5000/api/vpp/auth/login` |
| 获取任务列表 | `GET /tasks` | `http://localhost:5000/api/vpp/tasks` |
| 创建任务 | `POST /tasks` | `http://localhost:5000/api/vpp/tasks` |
| 获取事件列表 | `GET /events` | `http://localhost:5000/api/vpp/events` |
| 获取分类列表 | `GET /categories` | `http://localhost:5000/api/vpp/categories` |

## 🔧 配置方式

### 后端配置

在 `backend/DoNow.Api/Program.cs` 中配置全局路由前缀：

```csharp
builder.Services.AddControllers(options =>
{
    // 添加全局路由前缀
    options.UseGeneralRoutePrefix("api/vpp");
});
```

### 前端配置

在 `frontend/src/config/apiConfig.ts` 中配置 API 前缀：

```typescript
// API route prefix - all API endpoints will be prefixed with this
export const API_PREFIX = '/api/vpp';

// Function to update axios base URL
export const updateAxiosBaseUrl = (baseUrl: string) => {
  // Set the base URL for all axios requests (including API prefix)
  axios.defaults.baseURL = `${normalizedUrl}${API_PREFIX}`;
};
```

## 🎯 优势

### 1. 版本控制
- 可以轻松添加版本号：`/api/v1`, `/api/v2`
- 支持多版本 API 共存

### 2. 命名空间隔离
- 区分不同的 API 模块：`/api/vpp`, `/api/admin`, `/api/public`
- 便于权限控制和路由管理

### 3. 反向代理友好
- 便于 Nginx/Apache 配置
- 支持微服务架构

### 4. 清晰的 URL 结构
- 一眼就能识别这是 API 端点
- 符合 RESTful 最佳实践

## 🔄 修改路由前缀

### 修改为其他前缀

如果需要修改为其他前缀（例如 `/api/v1`），只需修改两处：

**1. 后端 - Program.cs**
```csharp
options.UseGeneralRoutePrefix("api/v1");  // 修改这里
```

**2. 前端 - apiConfig.ts**
```typescript
export const API_PREFIX = '/api/v1';  // 修改这里
```

### 移除路由前缀

如果不需要路由前缀，可以：

**1. 后端 - Program.cs**
```csharp
// 注释掉或删除这行
// options.UseGeneralRoutePrefix("api/vpp");
```

**2. 前端 - apiConfig.ts**
```typescript
export const API_PREFIX = '';  // 设置为空字符串
```

## 📝 控制器路由配置

控制器中的路由配置保持简洁：

```csharp
[ApiController]
[Route("tasks")]  // 只需要指定控制器名称
[Authorize]
public class TasksController : ControllerBase
{
    [HttpGet]  // GET /api/vpp/tasks
    public async Task<IActionResult> GetTasks() { }
    
    [HttpPost]  // POST /api/vpp/tasks
    public async Task<IActionResult> CreateTask() { }
    
    [HttpGet("{id}")]  // GET /api/vpp/tasks/{id}
    public async Task<IActionResult> GetTask(string id) { }
}
```

全局前缀会自动添加到所有控制器路由前面。

## 🧪 测试

### 使用测试脚本

```bash
cd backend
./test-api.sh
```

测试脚本已更新为使用新的路由前缀。

### 使用 curl

```bash
# 注册用户
curl -X POST http://localhost:5000/api/vpp/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"test","email":"test@example.com","password":"Test123!"}'

# 登录
curl -X POST http://localhost:5000/api/vpp/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"Test123!"}'

# 获取任务列表（需要 token）
curl -X GET http://localhost:5000/api/vpp/tasks \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### 使用 Swagger

访问 http://localhost:5000/swagger 查看所有 API 端点。

Swagger UI 会自动显示完整的路由路径（包含 `/api/vpp` 前缀）。

## 🔍 路由实现原理

### MvcOptionsExtensions

使用 ASP.NET Core 的 `IApplicationModelConvention` 接口实现全局路由前缀：

```csharp
public class RoutePrefixConvention : IApplicationModelConvention
{
    private readonly AttributeRouteModel _routePrefix;

    public void Apply(ApplicationModel application)
    {
        foreach (var controller in application.Controllers)
        {
            // 为每个控制器添加路由前缀
            foreach (var selectorModel in controller.Selectors)
            {
                selectorModel.AttributeRouteModel = 
                    AttributeRouteModel.CombineAttributeRouteModel(
                        _routePrefix,
                        selectorModel.AttributeRouteModel);
            }
        }
    }
}
```

这种方式的优点：
- ✅ 不需要修改每个控制器
- ✅ 集中管理路由前缀
- ✅ 易于维护和修改
- ✅ 符合 DRY 原则

## 📚 相关文件

- `backend/DoNow.Api/Program.cs` - 路由前缀配置
- `backend/DoNow.Api/Extensions/MvcOptionsExtensions.cs` - 路由前缀实现
- `frontend/src/config/apiConfig.ts` - 前端 API 配置
- `backend/test-api.sh` - API 测试脚本

## 🔗 参考资料

- [ASP.NET Core Routing](https://docs.microsoft.com/en-us/aspnet/core/fundamentals/routing)
- [Application Model Conventions](https://docs.microsoft.com/en-us/aspnet/core/mvc/controllers/application-model)
- [RESTful API Design Best Practices](https://restfulapi.net/)

---

**最后更新**: 2026-01-21
