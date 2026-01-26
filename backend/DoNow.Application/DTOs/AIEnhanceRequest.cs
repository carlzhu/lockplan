namespace DoNow.Application.DTOs;

public class AIEnhanceRequest
{
    public string Text { get; set; } = string.Empty;
    public string? Description { get; set; } // 兼容旧版本
    public string Type { get; set; } = "task"; // "task", "event", "project", "note"
    public bool GenerateTitle { get; set; } = true;
    
    // 获取实际的文本内容（优先使用 Text，然后是 Description）
    public string GetText() => !string.IsNullOrEmpty(Text) ? Text : Description ?? string.Empty;
}
