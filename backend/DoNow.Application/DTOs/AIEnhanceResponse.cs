namespace DoNow.Application.DTOs;

public class AIEnhanceResponse
{
    public string? Title { get; set; }
    public string? Description { get; set; }
    public string? EnhancedDescription { get; set; } // 兼容旧版本
    public string? Type { get; set; } // "task", "event", "project", "note"
    public string? Priority { get; set; } // "critical", "high", "medium", "low"
    public string? SuggestedDateTime { get; set; }
    public string? SuggestedPriority { get; set; } // 兼容旧版本
    public string? Category { get; set; }
    public string? SuggestedCategory { get; set; } // 兼容旧版本
    public List<string>? Tags { get; set; }
    public List<string>? SuggestedTags { get; set; } // 兼容旧版本
    public string? DueDate { get; set; }
    public string? EventTime { get; set; }
    
    // 获取实际的描述（优先使用 Description，然后是 EnhancedDescription）
    public string? GetDescription() => Description ?? EnhancedDescription;
    
    // 获取实际的优先级
    public string? GetPriority() => Priority ?? SuggestedPriority;
    
    // 获取实际的分类
    public string? GetCategory() => Category ?? SuggestedCategory;
    
    // 获取实际的标签
    public List<string>? GetTags() => Tags ?? SuggestedTags;
}
