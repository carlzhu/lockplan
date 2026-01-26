namespace DoNow.Domain.Entities;

/// <summary>
/// 项目状态变更历史
/// </summary>
public class ItemStatusHistory
{
    /// <summary>
    /// 历史记录 ID
    /// </summary>
    public long Id { get; set; }
    
    /// <summary>
    /// 关联的项目 ID
    /// </summary>
    public long ItemId { get; set; }
    
    /// <summary>
    /// 关联的项目
    /// </summary>
    public Item? Item { get; set; }
    
    /// <summary>
    /// 旧状态
    /// </summary>
    public ItemStatus? OldStatus { get; set; }
    
    /// <summary>
    /// 新状态
    /// </summary>
    public ItemStatus NewStatus { get; set; }
    
    /// <summary>
    /// 变更说明/备注
    /// </summary>
    public string? Comment { get; set; }
    
    /// <summary>
    /// 变更时间
    /// </summary>
    public DateTime ChangedAt { get; set; } = DateTime.UtcNow;
    
    /// <summary>
    /// 变更人 ID
    /// </summary>
    public string UserId { get; set; } = string.Empty;
    
    /// <summary>
    /// 变更人
    /// </summary>
    public User? User { get; set; }
}
