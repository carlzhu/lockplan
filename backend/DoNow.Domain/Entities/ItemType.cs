namespace DoNow.Domain.Entities;

/// <summary>
/// 项目类型枚举
/// </summary>
public enum ItemType
{
    /// <summary>
    /// 任务 - 需要完成的待办事项
    /// </summary>
    Task = 0,
    
    /// <summary>
    /// 事件 - 时间点发生的事情
    /// </summary>
    Event = 1,
    
    /// <summary>
    /// 项目 - 包含多个任务的大型项目（未来扩展）
    /// </summary>
    Project = 2,
    
    /// <summary>
    /// 笔记 - 记录信息（未来扩展）
    /// </summary>
    Note = 3
}
