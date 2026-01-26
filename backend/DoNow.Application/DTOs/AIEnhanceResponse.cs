namespace DoNow.Application.DTOs;

public class AIEnhanceResponse
{
    public string? Title { get; set; }
    public string? EnhancedDescription { get; set; }
    public string? SuggestedDateTime { get; set; }
    public string? SuggestedPriority { get; set; } // "Low", "Medium", "High"
    public string? SuggestedCategory { get; set; }
    public List<string>? SuggestedTags { get; set; }
}
