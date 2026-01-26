namespace DoNow.Application.DTOs;

/// <summary>
/// 项目状态变更历史 DTO
/// </summary>
public class ItemStatusHistoryDto
{
    public long Id { get; set; }
    public long ItemId { get; set; }
    public string? OldStatus { get; set; }
    public string NewStatus { get; set; } = string.Empty;
    public string? Comment { get; set; }
    public string ChangedAt { get; set; } = string.Empty;
    public string UserId { get; set; } = string.Empty;
}

/// <summary>
/// 更改状态请求 DTO
/// </summary>
public class ChangeStatusDto
{
    public string Status { get; set; } = string.Empty; // Todo, InProgress, Completed, OnHold, Cancelled
    public string? Comment { get; set; }
}
