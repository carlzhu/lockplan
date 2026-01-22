namespace DoNow.Domain.Entities;

public class AIProcessingResult
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string RawInputId { get; set; } = string.Empty;
    public RawInput? RawInput { get; set; }
    public string ProcessedContent { get; set; } = string.Empty;
    public string ModelUsed { get; set; } = string.Empty;
    public DateTime ProcessedAt { get; set; } = DateTime.UtcNow;
    public int ConfidenceScore { get; set; } = 0;
}
