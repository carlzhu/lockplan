using VocalClerk.Domain.Entities;

namespace VocalClerk.Application.DTOs;

public class UpdateEventDto
{
    public string? Title { get; set; }
    public string? Description { get; set; }
    public EventCategory? Category { get; set; }
    public DateTime? EventTime { get; set; }
    public string? Severity { get; set; }
    public List<string>? Tags { get; set; }
}
