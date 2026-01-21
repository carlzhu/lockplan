namespace VocalClerk.Domain.Entities;

public class RawInput
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string Content { get; set; } = string.Empty;
    public InputType InputType { get; set; } = InputType.TEXT;
    public string UserId { get; set; } = string.Empty;
    public User? User { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public bool Processed { get; set; } = false;

    public ICollection<Task> Tasks { get; set; } = new List<Task>();
    public AIProcessingResult? ProcessingResult { get; set; }
}
