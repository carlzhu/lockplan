namespace VocalClerk.Domain.Entities;

public class TaskTag
{
    public long TaskId { get; set; }
    public Task? Task { get; set; }
    public long TagId { get; set; }
    public Tag? Tag { get; set; }
}
