using DoNow.Domain.Entities;

namespace DoNow.Application.DTOs;

public class TaskDto
{
    public long Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public DateTime? DueDate { get; set; }
    public DateTime? ReminderTime { get; set; }
    public bool Completed { get; set; }
    public TaskPriority Priority { get; set; }
    public long? CategoryId { get; set; }
    public string? CategoryName { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? CompletedAt { get; set; }
    public List<string> Tags { get; set; } = new();
}
