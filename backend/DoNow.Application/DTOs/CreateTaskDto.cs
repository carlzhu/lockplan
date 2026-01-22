using DoNow.Domain.Entities;

namespace DoNow.Application.DTOs;

public class CreateTaskDto
{
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public DateTime? DueDate { get; set; }
    public DateTime? ReminderTime { get; set; }
    public TaskPriority Priority { get; set; } = TaskPriority.MEDIUM;
    public long? CategoryId { get; set; }
    public string? OriginalInput { get; set; }
    public List<string>? Tags { get; set; }
}
