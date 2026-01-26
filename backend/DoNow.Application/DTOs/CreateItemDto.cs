namespace DoNow.Application.DTOs;

/// <summary>
/// 创建项目 DTO
/// </summary>
public class CreateItemDto
{
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string Type { get; set; } = "task"; // task, event, project, note
    
    // 时间
    public string? DueDate { get; set; }
    public string? EventTime { get; set; }
    public string? ReminderTime { get; set; }
    
    // 优先级/严重程度
    public string? Priority { get; set; }
    
    // 分类
    public string? Category { get; set; }
    
    // 父项目
    public long? ParentId { get; set; }
    
    // 标签
    public List<string>? Tags { get; set; }
    
    // 原始输入
    public string? OriginalInput { get; set; }
}
