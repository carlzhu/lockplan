namespace DoNow.Application.DTOs;

/// <summary>
/// 更新项目 DTO
/// </summary>
public class UpdateItemDto
{
    public string? Title { get; set; }
    public string? Description { get; set; }
    
    // 时间
    public string? DueDate { get; set; }
    public string? EventTime { get; set; }
    public string? ReminderTime { get; set; }
    
    // 状态
    public bool? IsCompleted { get; set; }
    
    // 优先级/严重程度
    public string? Priority { get; set; }
    
    // 分类
    public string? Category { get; set; }
    
    // 父项目
    public long? ParentId { get; set; }
    
    // 标签
    public List<string>? Tags { get; set; }
}
