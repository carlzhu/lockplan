# 锁事计划 App 技术架构设计

## 1. 系统架构概览

"锁事计划"应用采用前后端分离的架构设计，以支持跨平台部署和良好的扩展性。

```
┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐
│                 │      │                 │      │                 │
│  客户端应用层    │◄────►│  后端服务层     │◄────►│  AI处理层       │
│  (React Native) │      │  (C# WebAPI)    │      │ (Ollama/通义千问)│
│                 │      │                 │      │                 │
└─────────────────┘      └─────────────────┘      └─────────────────┘
        ▲                        ▲                        ▲
        │                        │                        │
        ▼                        ▼                        ▼
┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐
│                 │      │                 │      │                 │
│  本地存储       │      │  云端数据库     │      │  外部服务集成   │
│  (SQLite)       │      │  (SQL Server)   │      │  (日历/通知等)  │
│                 │      │                 │      │                 │
└─────────────────┘      └─────────────────┘      └─────────────────┘
```

## 2. 前端架构 (React Native)

### 2.1 技术栈
- **核心框架**: React Native
- **状态管理**: Redux/Context API
- **导航**: React Navigation
- **UI组件库**: React Native Paper/Native Base
- **本地存储**: AsyncStorage/SQLite
- **网络请求**: Axios/Fetch API

### 2.2 模块结构
```
src/
├── assets/            # 图片、字体等静态资源
├── components/        # 可复用UI组件
│   ├── common/        # 通用组件
│   ├── forms/         # 表单相关组件
│   └── layout/        # 布局组件
├── navigation/        # 导航配置
├── screens/           # 应用屏幕
│   ├── home/          # 首页相关屏幕
│   ├── tasks/         # 任务管理相关屏幕
│   ├── categories/    # 分类管理相关屏幕
│   └── settings/      # 设置相关屏幕
├── services/          # 服务层
│   ├── api/           # API调用
│   ├── storage/       # 本地存储
│   └── ai/            # AI处理服务
├── store/             # 状态管理
│   ├── actions/       # Redux actions
│   ├── reducers/      # Redux reducers
│   └── selectors/     # Redux selectors
├── utils/             # 工具函数
│   ├── formatters/    # 格式化工具
│   ├── validators/    # 验证工具
│   └── helpers/       # 辅助函数
└── App.js             # 应用入口
```

### 2.3 关键组件设计

#### 2.3.1 快速输入组件
- 支持文本和语音输入
- 实时显示识别状态
- 提供输入建议和自动完成

#### 2.3.2 任务列表组件
- 虚拟列表优化，支持大量数据
- 拖拽排序功能
- 滑动操作（完成、删除、编辑）

#### 2.3.3 提醒组件
- 本地通知集成
- 日历事件集成
- 自定义提醒设置界面

## 3. 后端架构 (C# WebAPI)

### 3.1 技术栈
- **框架**: ASP.NET Core
- **ORM**: Entity Framework Core
- **数据库**: SQL Server/PostgreSQL
- **认证**: JWT/OAuth 2.0
- **API文档**: Swagger
- **日志**: Serilog

### 3.2 模块结构
```
Backend/
├── API/                  # API层
│   ├── Controllers/      # API控制器
│   ├── Filters/          # API过滤器
│   ├── Middleware/       # 中间件
│   └── DTOs/             # 数据传输对象
├── Application/          # 应用服务层
│   ├── Services/         # 业务服务
│   ├── Interfaces/       # 服务接口
│   └── Mappers/          # 对象映射
├── Domain/               # 领域层
│   ├── Entities/         # 领域实体
│   ├── Enums/            # 枚举定义
│   └── ValueObjects/     # 值对象
├── Infrastructure/       # 基础设施层
│   ├── Data/             # 数据访问
│   │   ├── Repositories/ # 仓储实现
│   │   ├── Context/      # 数据库上下文
│   │   └── Migrations/   # 数据库迁移
│   ├── AI/               # AI服务集成
│   │   ├── Ollama/       # Ollama集成
│   │   └── Qianwen/      # 通义千问集成
│   ├── ExternalServices/ # 外部服务集成
│   └── Security/         # 安全相关
└── Tests/                # 测试项目
```

### 3.3 API设计

#### 3.3.1 认证API
- `/api/auth/register` - 用户注册
- `/api/auth/login` - 用户登录
- `/api/auth/refresh` - 刷新令牌

#### 3.3.2 任务API
- `/api/tasks` - 获取/创建任务
- `/api/tasks/{id}` - 获取/更新/删除特定任务
- `/api/tasks/batch` - 批量操作任务
- `/api/tasks/search` - 搜索任务

#### 3.3.3 分类API
- `/api/categories` - 获取/创建分类
- `/api/categories/{id}` - 获取/更新/删除特定分类

#### 3.3.4 AI处理API
- `/api/ai/process` - 处理文本/语音输入
- `/api/ai/extract` - 从文本中提取任务
- `/api/ai/suggest` - 获取智能建议

## 4. AI处理层

### 4.1 本地AI处理 (Ollama)
- 部署在用户设备上的轻量级模型
- 支持基本的文本分析和任务提取
- 离线工作能力

### 4.2 云端AI处理 (通义千问)
- 更强大的自然语言理解能力
- 复杂场景下的上下文理解
- 持续学习和改进

### 4.3 AI处理流程
```
┌───────────┐     ┌───────────┐     ┌───────────┐     ┌───────────┐
│           │     │           │     │           │     │           │
│ 输入预处理 │────►│ 实体识别  │────►│ 意图分析  │────►│ 任务构建  │
│           │     │           │     │           │     │           │
└───────────┘     └───────────┘     └───────────┘     └───────────┘
                                                             │
┌───────────┐     ┌───────────┐     ┌───────────┐           ▼
│           │     │           │     │           │     ┌───────────┐
│ 用户反馈  │◄────│ 结果优化  │◄────│ 上下文融合 │◄────│ 初步结果  │
│           │     │           │     │           │     │           │
└───────────┘     └───────────┘     └───────────┘     └───────────┘
```

### 4.4 关键AI功能
- **命名实体识别**: 识别时间、人物、地点等实体
- **时间表达式解析**: 将自然语言时间转换为结构化时间
- **任务意图识别**: 判断输入内容是否包含任务意图
- **多任务分离**: 从单一输入中分离多个任务
- **上下文理解**: 理解任务之间的关联和依赖关系

## 5. 数据模型设计

### 5.1 核心实体

#### 5.1.1 用户 (User)
```csharp
public class User
{
    public Guid Id { get; set; }
    public string Username { get; set; }
    public string Email { get; set; }
    public string PasswordHash { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime LastLoginAt { get; set; }
    public List<Task> Tasks { get; set; }
    public List<Category> Categories { get; set; }
    public UserSettings Settings { get; set; }
}
```

#### 5.1.2 任务 (Task)
```csharp
public class Task
{
    public Guid Id { get; set; }
    public string Title { get; set; }
    public string Description { get; set; }
    public DateTime? DueDate { get; set; }
    public DateTime? ReminderTime { get; set; }
    public bool IsCompleted { get; set; }
    public TaskPriority Priority { get; set; }
    public Guid CategoryId { get; set; }
    public Category Category { get; set; }
    public Guid UserId { get; set; }
    public User User { get; set; }
    public List<TaskTag> Tags { get; set; }
    public string OriginalInput { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? CompletedAt { get; set; }
}
```

#### 5.1.3 分类 (Category)
```csharp
public class Category
{
    public Guid Id { get; set; }
    public string Name { get; set; }
    public string Color { get; set; }
    public string Icon { get; set; }
    public Guid UserId { get; set; }
    public User User { get; set; }
    public List<Task> Tasks { get; set; }
    public bool IsDefault { get; set; }
}
```

#### 5.1.4 标签 (Tag)
```csharp
public class Tag
{
    public Guid Id { get; set; }
    public string Name { get; set; }
    public Guid UserId { get; set; }
    public User User { get; set; }
    public List<TaskTag> Tasks { get; set; }
}
```

#### 5.1.5 原始输入 (RawInput)
```csharp
public class RawInput
{
    public Guid Id { get; set; }
    public string Content { get; set; }
    public InputType Type { get; set; } // Text, Voice
    public DateTime CreatedAt { get; set; }
    public Guid UserId { get; set; }
    public User User { get; set; }
    public List<Task> GeneratedTasks { get; set; }
    public AIProcessingResult ProcessingResult { get; set; }
}
```

### 5.2 数据库关系图
```
User 1──┐
         │
         ├──* Task *──┐
         │            │
         ├──* Category 1──┘
         │
         ├──* Tag *──┐
         │           │
         └──* RawInput
                     │
                     └──* TaskTag *──┘
```

## 6. 同步与离线功能

### 6.1 数据同步策略
- 增量同步机制
- 冲突解决策略
- 后台同步服务

### 6.2 离线功能支持
- 本地数据存储
- 队列化API请求
- 本地AI处理备选方案

## 7. 安全设计

### 7.1 认证与授权
- JWT令牌认证
- 基于角色的访问控制
- 刷新令牌机制

### 7.2 数据安全
- 传输层加密 (HTTPS)
- 数据库加密敏感字段
- 安全的API密钥管理

### 7.3 隐私保护
- 用户数据隔离
- 数据访问审计
- 符合GDPR等隐私法规

## 8. 扩展性设计

### 8.1 微服务拆分潜力
- 认证服务
- 任务管理服务
- AI处理服务
- 通知服务

### 8.2 API版本控制
- URI版本控制
- 向后兼容策略
- API弃用流程

### 8.3 插件系统
- 插件接口定义
- 插件生命周期管理
- 插件权限控制

## 9. 部署架构

### 9.1 开发环境
- 本地开发环境配置
- Docker开发容器
- 模拟数据生成

### 9.2 测试环境
- 自动化测试配置
- 集成测试环境
- 性能测试环境

### 9.3 生产环境
- 容器化部署 (Docker/Kubernetes)
- 负载均衡配置
- 自动扩缩容策略
- 监控与告警系统

## 10. 监控与运维

### 10.1 日志系统
- 集中式日志收集
- 日志分析与可视化
- 异常监控与告警

### 10.2 性能监控
- API响应时间监控
- 数据库性能监控
- 客户端性能指标收集

### 10.3 用户行为分析
- 使用模式分析
- 功能使用频率统计
- A/B测试支持