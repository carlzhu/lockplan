namespace VocalClerk.Domain.Entities;

public class EventTag
{
    public long EventId { get; set; }
    public Event? Event { get; set; }
    public long TagId { get; set; }
    public Tag? Tag { get; set; }
}
