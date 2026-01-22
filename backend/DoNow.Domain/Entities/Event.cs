namespace DoNow.Domain.Entities;

public class Event
{
    public long Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public EventCategory Category { get; set; } = EventCategory.NORMAL;
    public DateTime? EventTime { get; set; }
    public string? Severity { get; set; } // low, medium, high, critical
    public string UserId { get; set; } = string.Empty;
    public User? User { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
    
    public ICollection<EventTag> Tags { get; set; } = new List<EventTag>();
}
