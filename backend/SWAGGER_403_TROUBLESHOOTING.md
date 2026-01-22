# Swagger 403 错误故障排除指南

## 🔍 问题描述

浏览器访问 `http://localhost:5000/swagger` 时显示：
```
Access to localhost was denied
You don't have the user rights to view this page.
HTTP ERROR 403
```

## ✅ 验证后端状态

### 1. 确认后端正在运行

```bash
cd backend
./run-dev.sh
```

应该看到类似输出：
```
info: Microsoft.Hosting.Lifetime[14]
      Now listening on: http://localhost:5000
info: Microsoft.Hosting.Lifetime[0]
      Application started. Press Ctrl+C to shut down.
```

### 2. 使用 curl 测试（命令行）

```bash
# 测试 Swagger 首页
curl -v http://localhost:5000/swagger

# 测试 Swagger index.html
curl -v http://localhost:5000/swagger/index.html

# 测试 Swagger JSON
curl http://localhost:5000/swagger/v1/swagger.json
```

**预期结果**:
- `/swagger` 返回 301 重定向到 `swagger/index.html`
- `/swagger/index.html` 返回 200 OK 和 HTML 内容
- `/swagger/v1/swagger.json` 返回 200 OK 和 JSON 内容

如果命令行测试正常，说明后端配置正确，问题在浏览器端。

## 🌐 浏览器端解决方案

### 方案 1：清除浏览器缓存

**Chrome/Edge**:
1. 按 `Cmd+Shift+Delete` (Mac) 或 `Ctrl+Shift+Delete` (Windows)
2. 选择"缓存的图片和文件"
3. 时间范围选择"全部时间"
4. 点击"清除数据"
5. 重新访问 `http://localhost:5000/swagger`

**Safari**:
1. 菜单 -> 开发 -> 清空缓存
2. 或按 `Cmd+Option+E`
3. 重新访问

### 方案 2：使用无痕/隐私模式

**Chrome/Edge**:
- 按 `Cmd+Shift+N` (Mac) 或 `Ctrl+Shift+N` (Windows)
- 在无痕窗口访问 `http://localhost:5000/swagger`

**Safari**:
- 按 `Cmd+Shift+N`
- 在隐私浏览窗口访问

### 方案 3：硬刷新页面

在 Swagger 页面按：
- **Mac**: `Cmd+Shift+R`
- **Windows**: `Ctrl+Shift+R` 或 `Ctrl+F5`

### 方案 4：尝试不同的浏览器

如果 Chrome 不行，尝试：
- Safari
- Firefox
- Edge

### 方案 5：检查浏览器控制台

1. 打开浏览器开发者工具（F12 或 `Cmd+Option+I`）
2. 切换到 Console 标签
3. 刷新页面
4. 查看是否有错误信息

常见错误：
- **CORS 错误**: 检查后端 CORS 配置
- **CSP 错误**: 内容安全策略问题
- **Network 错误**: 网络连接问题

### 方案 6：使用 127.0.0.1 而不是 localhost

有时浏览器对 `localhost` 和 `127.0.0.1` 的处理不同：

```
http://127.0.0.1:5000/swagger
```

### 方案 7：检查浏览器扩展

某些浏览器扩展可能会阻止本地访问：
1. 禁用所有扩展
2. 重新访问 Swagger
3. 如果可以访问，逐个启用扩展找出问题扩展

常见问题扩展：
- 广告拦截器
- 隐私保护扩展
- 安全扩展

## 🔧 后端配置检查

### 检查中间件顺序

在 `Program.cs` 中，中间件顺序应该是：

```csharp
var app = builder.Build();

app.UseCors("AllowAll");        // 1. CORS 必须在最前面

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();            // 2. Swagger
    app.UseSwaggerUI(...);
}

app.UseAuthentication();         // 3. 认证
app.UseAuthorization();          // 4. 授权

app.MapControllers();            // 5. 路由映射

app.Run();
```

### 检查 CORS 配置

```csharp
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});
```

### 检查环境变量

确保运行在开发环境：

```bash
# 检查环境变量
echo $ASPNETCORE_ENVIRONMENT

# 应该输出: Development
```

如果不是，设置环境变量：

```bash
export ASPNETCORE_ENVIRONMENT=Development
```

## 🐛 常见原因和解决方案

### 原因 1：浏览器缓存了旧的 403 响应

**解决方案**: 清除缓存或使用无痕模式

### 原因 2：浏览器安全策略

某些浏览器对 localhost 有特殊的安全策略。

**解决方案**: 
- 使用 `127.0.0.1` 代替 `localhost`
- 使用不同的浏览器

### 原因 3：防火墙或安全软件

**解决方案**:
- 临时禁用防火墙测试
- 检查安全软件设置

### 原因 4：端口被其他程序占用

**检查端口**:
```bash
lsof -i :5000
```

**解决方案**:
- 停止占用端口的程序
- 或修改后端端口

### 原因 5：代理设置

**解决方案**:
- 检查系统代理设置
- 在浏览器中禁用代理

## 📝 验证步骤总结

1. ✅ 确认后端正在运行
2. ✅ 使用 curl 测试（命令行正常）
3. ✅ 清除浏览器缓存
4. ✅ 使用无痕模式
5. ✅ 尝试 `127.0.0.1:5000/swagger`
6. ✅ 尝试不同的浏览器
7. ✅ 检查浏览器控制台错误
8. ✅ 禁用浏览器扩展

## 🎯 快速解决方案

**最快的解决方案（按顺序尝试）**:

1. **硬刷新**: `Cmd+Shift+R` (Mac) 或 `Ctrl+Shift+R` (Windows)
2. **无痕模式**: `Cmd+Shift+N` (Mac) 或 `Ctrl+Shift+N` (Windows)
3. **使用 IP**: `http://127.0.0.1:5000/swagger`
4. **不同浏览器**: 如果用 Chrome，试试 Safari 或 Firefox

## 📞 仍然无法解决？

如果以上方法都不行，请提供以下信息：

1. 操作系统和版本
2. 浏览器和版本
3. curl 测试的完整输出
4. 浏览器控制台的错误信息
5. 后端日志输出

---

**最后更新**: 2026-01-22
