namespace DoNow.Domain.Entities;

/// <summary>
/// 统一的项目实体，可以是任务、事件、项目等
/// </summary>
public class Item
{
    public long Id { get; set; }
    
    /// <summary>
    /// 标题
    /// </summary>
    public string Title { get; set; } = string.Empty;
    
    /// <summary>
    /// 描述
    /// </summary>
    public string? Description { get; set; }
    
    /// <summary>
    /// 项目类型：任务、事件、项目等
    /// </summary>
    public ItemType Type { get; set; } = ItemType.Task;
    
    // ==================== 时间相关 ====================
    
    /// <summary>
    /// 截止日期（主要用于任务）
    /// </summary>
    public DateTime? DueDate { get; set; }
    
    /// <summary>
    /// 事件时间（主要用于事件）
    /// </summary>
    public DateTime? EventTime { get; set; }
    
    /// <summary>
    /// 提醒时间
    /// </summary>
    public DateTime? ReminderTime { get; set; }
    
    // ==================== 状态相关 ====================
    
    /// <summary>
    /// 是否完成（主要用于任务）
    /// </summary>
    public bool IsCompleted { get; set; } = false;
    
    /// <summary>
    /// 完成时间
    /// </summary>
    public DateTime? CompletedAt { get; set; }
    
    // ==================== 优先级/严重程度 ====================
    
    /// <summary>
    /// 优先级/严重程度：Low, Medium, High, Critical
    /// </summary>
    public string? Priority { get; set; }
    
    // ==================== 分类 ====================
    
    /// <summary>
    /// 分类/类别
    /// </summary>
    public string? Category { get; set; }
    
    // ==================== 父子关系 ====================
    
    /// <summary>
    /// 父项目 ID（用于子任务、子事件等）
    /// </summary>
    public long? ParentId { get; set; }
    
    /// <summary>
    /// 父项目
    /// </summary>
    public Item? Parent { get; set; }
    
    /// <summary>
    /// 子项目列表
    /// </summary>
    public ICollection<Item> SubItems { get; set; } = new List<Item>();
    
    // ==================== 标签 ====================
    
    /// <summary>
    /// 标签列表
    /// </summary>
    public ICollection<ItemTag> Tags { get; set; } = new List<ItemTag>();
    
    // ==================== 用户关联 ====================
    
    /// <summary>
    /// 所属用户 ID
    /// </summary>
    public string UserId { get; set; } = string.Empty;
    
    /// <summary>
    /// 所属用户
    /// </summary>
    public User? User { get; set; }
    
    // ==================== 原始输入 ====================
    
    /// <summary>
    /// 原始输入 ID（用于追溯）
    /// </summary>
    public string? RawInputId { get; set; }
    
    /// <summary>
    /// 原始输入
    /// </summary>
    public RawInput? RawInput { get; set; }
    
    /// <summary>
    /// 原始输入文本
    /// </summary>
    public string? OriginalInput { get; set; }
    
    // ==================== 时间戳 ====================
    
    /// <summary>
    /// 创建时间
    /// </summary>
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    /// <summary>
    /// 更新时间
    /// </summary>
    public DateTime? UpdatedAt { get; set; }
    
    // ==================== 业务方法 ====================
    
    /// <summary>
    /// 标记为已完成
    /// </summary>
    public void MarkAsCompleted()
    {
        IsCompleted = true;
        CompletedAt = DateTime.UtcNow;
        UpdatedAt = DateTime.UtcNow;
    }
    
    /// <summary>
    /// 标记为未完成
    /// </summary>
    public void MarkAsNotCompleted()
    {
        IsCompleted = false;
        CompletedAt = null;
        UpdatedAt = DateTime.UtcNow;
    }
    
    /// <summary>
    /// 添加子项目
    /// </summary>
    public void AddSubItem(Item subItem)
    {
        subItem.ParentId = Id;
        subItem.UserId = UserId;
        SubItems.Add(subItem);
        UpdatedAt = DateTime.UtcNow;
    }
    
    /// <summary>
    /// 获取有效时间（优先使用 DueDate，其次 EventTime）
    /// </summary>
    public DateTime? GetEffectiveTime()
    {
        return DueDate ?? EventTime;
    }
    
    /// <summary>
    /// 是否为顶层项目（没有父项目）
    /// </summary>
    public bool IsTopLevel()
    {
        return ParentId == null;
    }
    
    /// <summary>
    /// 是否有子项目
    /// </summary>
    public bool HasSubItems()
    {
        return SubItems != null && SubItems.Any();
    }
}
