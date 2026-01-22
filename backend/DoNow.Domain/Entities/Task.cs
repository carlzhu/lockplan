namespace DoNow.Domain.Entities;

public class Task
{
    public long Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public DateTime? DueDate { get; set; }
    public DateTime? ReminderTime { get; set; }
    public bool IsCompleted { get; set; } = false;
    public TaskPriority Priority { get; set; } = TaskPriority.MEDIUM;
    public long? CategoryId { get; set; }
    public Category? Category { get; set; }
    public string UserId { get; set; } = string.Empty;
    public User? User { get; set; }
    public string? RawInputId { get; set; }
    public RawInput? RawInput { get; set; }
    public string? OriginalInput { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? CompletedAt { get; set; }

    public ICollection<TaskTag> Tags { get; set; } = new List<TaskTag>();

    public void MarkAsCompleted()
    {
        IsCompleted = true;
        CompletedAt = DateTime.UtcNow;
    }

    public void MarkAsNotCompleted()
    {
        IsCompleted = false;
        CompletedAt = null;
    }
}
