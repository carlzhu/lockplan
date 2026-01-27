using DoNow.Application.DTOs;

namespace DoNow.Application.Interfaces;

/// <summary>
/// 项目服务接口
/// </summary>
public interface IItemService
{
    /// <summary>
    /// 获取用户的所有项目
    /// </summary>
    Task<IEnumerable<ItemDto>> GetAllAsync(string? type = null, string? status = null, bool includeSubItems = false, bool topLevelOnly = false);
    
    /// <summary>
    /// 根据 ID 获取项目
    /// </summary>
    Task<ItemDto?> GetByIdAsync(long id, bool includeSubItems = false);
    
    /// <summary>
    /// 创建项目
    /// </summary>
    Task<ItemDto> CreateAsync(CreateItemDto dto);
    
    /// <summary>
    /// 更新项目
    /// </summary>
    Task<ItemDto> UpdateAsync(long id, UpdateItemDto dto);
    
    /// <summary>
    /// 删除项目
    /// </summary>
    Task DeleteAsync(long id);
    
    /// <summary>
    /// 标记任务为已完成
    /// </summary>
    Task<ItemDto> MarkAsCompletedAsync(long id);
    
    /// <summary>
    /// 标记任务为未完成
    /// </summary>
    Task<ItemDto> MarkAsNotCompletedAsync(long id);
    
    /// <summary>
    /// 获取项目的子项目
    /// </summary>
    Task<IEnumerable<ItemDto>> GetSubItemsAsync(long parentId);
    
    /// <summary>
    /// 为项目添加子项目
    /// </summary>
    Task<ItemDto> AddSubItemAsync(long parentId, CreateItemDto dto);
    
    /// <summary>
    /// 更改项目状态
    /// </summary>
    Task<ItemDto> ChangeStatusAsync(long id, ChangeStatusDto dto);
    
    /// <summary>
    /// 获取项目的状态变更历史
    /// </summary>
    Task<IEnumerable<ItemStatusHistoryDto>> GetStatusHistoryAsync(long id);
}
