namespace DoNow.Domain.Entities;

public class Tag
{
    public long Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string UserId { get; set; } = string.Empty;
    public User? User { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<TaskTag> TaskTags { get; set; } = new List<TaskTag>();
}
