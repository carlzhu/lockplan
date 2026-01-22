using DoNow.Domain.Entities;

namespace DoNow.Application.DTOs;

public class EventDto
{
    public long Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public EventCategory Category { get; set; }
    public DateTime? EventTime { get; set; }
    public string? Severity { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public List<string> Tags { get; set; } = new();
}
