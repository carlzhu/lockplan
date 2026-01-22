using DoNow.Domain.Entities;

namespace DoNow.Application.DTOs;

public class UpdateTaskDto
{
    public string? Title { get; set; }
    public string? Description { get; set; }
    public DateTime? DueDate { get; set; }
    public DateTime? ReminderTime { get; set; }
    public bool? Completed { get; set; }
    public TaskPriority? Priority { get; set; }
    public long? CategoryId { get; set; }
    public List<string>? Tags { get; set; }
}
