namespace DoNow.Application.DTOs;

/// <summary>
/// 项目 DTO
/// </summary>
public class ItemDto
{
    public long Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string Type { get; set; } = "task"; // task, event, project, note
    
    // 时间
    public string? DueDate { get; set; }
    public string? EventTime { get; set; }
    public string? ReminderTime { get; set; }
    
    // 状态
    public string Status { get; set; } = "Todo"; // Todo, InProgress, Completed, OnHold, Cancelled
    public string? StatusChangedAt { get; set; }
    public bool IsCompleted { get; set; }
    public string? CompletedAt { get; set; }
    
    // 优先级/严重程度
    public string? Priority { get; set; }
    
    // 分类
    public string? Category { get; set; }
    
    // 父子关系
    public long? ParentId { get; set; }
    public List<ItemDto>? SubItems { get; set; }
    
    // 标签
    public List<string>? Tags { get; set; }
    
    // 时间戳
    public string CreatedAt { get; set; } = string.Empty;
    public string? UpdatedAt { get; set; }
}
