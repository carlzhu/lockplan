namespace DoNow.Domain.Entities;

/// <summary>
/// 项目标签关联表
/// </summary>
public class ItemTag
{
    public long ItemId { get; set; }
    public Item Item { get; set; } = null!;
    
    public long TagId { get; set; }
    public Tag Tag { get; set; } = null!;
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
