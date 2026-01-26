namespace DoNow.Application.DTOs;

public class AIEnhanceRequest
{
    public string Description { get; set; } = string.Empty;
    public string Type { get; set; } = "task"; // "task" or "event"
    public bool GenerateTitle { get; set; } = false;
}
