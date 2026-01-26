using Microsoft.EntityFrameworkCore;
using DoNow.Application.DTOs;
using DoNow.Application.Interfaces;
using DoNow.Domain.Entities;
using DoNow.Infrastructure.Data;
using DoNow.Infrastructure.Security;

namespace DoNow.Infrastructure.Services;

public class ItemService : IItemService
{
    private readonly DoNowDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public ItemService(DoNowDbContext context, ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async System.Threading.Tasks.Task<IEnumerable<ItemDto>> GetAllAsync(string? type = null, bool includeSubItems = false, bool topLevelOnly = false)
    {
        var userId = _currentUserService.GetUserId();
        var query = _context.Items
            .Where(i => i.UserId == userId);

        // 按类型筛选
        if (!string.IsNullOrEmpty(type))
        {
            if (Enum.TryParse<ItemType>(type, true, out var itemType))
            {
                query = query.Where(i => i.Type == itemType);
            }
        }

        // 只获取顶层项目
        if (topLevelOnly)
        {
            query = query.Where(i => i.ParentId == null);
        }

        // 包含子项目
        if (includeSubItems)
        {
            query = query.Include(i => i.SubItems)
                         .ThenInclude(s => s.Tags)
                         .ThenInclude(t => t.Tag);
        }

        query = query.Include(i => i.Tags)
                     .ThenInclude(t => t.Tag);

        var items = await query.OrderByDescending(i => i.CreatedAt).ToListAsync();
        return items.Select(MapToDto);
    }

    public async System.Threading.Tasks.Task<ItemDto?> GetByIdAsync(long id, bool includeSubItems = false)
    {
        var userId = _currentUserService.GetUserId();
        var query = _context.Items
            .Where(i => i.Id == id && i.UserId == userId);

        if (includeSubItems)
        {
            query = query.Include(i => i.SubItems)
                         .ThenInclude(s => s.Tags)
                         .ThenInclude(t => t.Tag);
        }

        query = query.Include(i => i.Tags)
                     .ThenInclude(t => t.Tag);

        var item = await query.FirstOrDefaultAsync();
        return item == null ? null : MapToDto(item);
    }

    public async System.Threading.Tasks.Task<ItemDto> CreateAsync(CreateItemDto dto)
    {
        var userId = _currentUserService.GetUserId();

        // 解析类型
        if (!Enum.TryParse<ItemType>(dto.Type, true, out var itemType))
        {
            itemType = ItemType.Task;
        }

        var item = new Item
        {
            Title = dto.Title,
            Description = dto.Description,
            Type = itemType,
            DueDate = ParseDateTime(dto.DueDate),
            EventTime = ParseDateTime(dto.EventTime),
            ReminderTime = ParseDateTime(dto.ReminderTime),
            Priority = dto.Priority,
            Category = dto.Category,
            ParentId = dto.ParentId,
            UserId = userId,
            OriginalInput = dto.OriginalInput,
            CreatedAt = DateTime.UtcNow
        };

        _context.Items.Add(item);
        await _context.SaveChangesAsync();

        // 处理标签
        if (dto.Tags != null && dto.Tags.Any())
        {
            await AddTagsToItemAsync(item.Id, dto.Tags);
        }

        return (await GetByIdAsync(item.Id))!;
    }

    public async System.Threading.Tasks.Task<ItemDto> UpdateAsync(long id, UpdateItemDto dto)
    {
        var userId = _currentUserService.GetUserId();
        var item = await _context.Items
            .FirstOrDefaultAsync(i => i.Id == id && i.UserId == userId);

        if (item == null)
        {
            throw new KeyNotFoundException($"Item with ID {id} not found");
        }

        // 更新字段
        if (dto.Title != null) item.Title = dto.Title;
        if (dto.Description != null) item.Description = dto.Description;
        if (dto.DueDate != null) item.DueDate = ParseDateTime(dto.DueDate);
        if (dto.EventTime != null) item.EventTime = ParseDateTime(dto.EventTime);
        if (dto.ReminderTime != null) item.ReminderTime = ParseDateTime(dto.ReminderTime);
        if (dto.IsCompleted.HasValue)
        {
            if (dto.IsCompleted.Value)
            {
                item.MarkAsCompleted();
            }
            else
            {
                item.MarkAsNotCompleted();
            }
        }
        if (dto.Priority != null) item.Priority = dto.Priority;
        if (dto.Category != null) item.Category = dto.Category;
        if (dto.ParentId.HasValue) item.ParentId = dto.ParentId;

        item.UpdatedAt = DateTime.UtcNow;

        // 更新标签
        if (dto.Tags != null)
        {
            // 删除旧标签
            var existingTags = await _context.ItemTags
                .Where(it => it.ItemId == id)
                .ToListAsync();
            _context.ItemTags.RemoveRange(existingTags);

            // 添加新标签
            if (dto.Tags.Any())
            {
                await AddTagsToItemAsync(id, dto.Tags);
            }
        }

        await _context.SaveChangesAsync();
        return (await GetByIdAsync(id))!;
    }

    public async System.Threading.Tasks.Task DeleteAsync(long id)
    {
        var userId = _currentUserService.GetUserId();
        var item = await _context.Items
            .Include(i => i.SubItems)
            .FirstOrDefaultAsync(i => i.Id == id && i.UserId == userId);

        if (item == null)
        {
            throw new KeyNotFoundException($"Item with ID {id} not found");
        }

        // 删除所有子项目
        if (item.SubItems != null && item.SubItems.Any())
        {
            _context.Items.RemoveRange(item.SubItems);
        }

        _context.Items.Remove(item);
        await _context.SaveChangesAsync();
    }

    public async System.Threading.Tasks.Task<ItemDto> MarkAsCompletedAsync(long id)
    {
        var userId = _currentUserService.GetUserId();
        var item = await _context.Items
            .FirstOrDefaultAsync(i => i.Id == id && i.UserId == userId);

        if (item == null)
        {
            throw new KeyNotFoundException($"Item with ID {id} not found");
        }

        item.MarkAsCompleted();
        await _context.SaveChangesAsync();

        return (await GetByIdAsync(id))!;
    }

    public async System.Threading.Tasks.Task<ItemDto> MarkAsNotCompletedAsync(long id)
    {
        var userId = _currentUserService.GetUserId();
        var item = await _context.Items
            .FirstOrDefaultAsync(i => i.Id == id && i.UserId == userId);

        if (item == null)
        {
            throw new KeyNotFoundException($"Item with ID {id} not found");
        }

        item.MarkAsNotCompleted();
        await _context.SaveChangesAsync();

        return (await GetByIdAsync(id))!;
    }

    public async System.Threading.Tasks.Task<IEnumerable<ItemDto>> GetSubItemsAsync(long parentId)
    {
        var userId = _currentUserService.GetUserId();
        var subItems = await _context.Items
            .Where(i => i.ParentId == parentId && i.UserId == userId)
            .Include(i => i.Tags)
            .ThenInclude(t => t.Tag)
            .OrderBy(i => i.CreatedAt)
            .ToListAsync();

        return subItems.Select(MapToDto);
    }

    public async System.Threading.Tasks.Task<ItemDto> AddSubItemAsync(long parentId, CreateItemDto dto)
    {
        var userId = _currentUserService.GetUserId();
        
        // 验证父项目存在
        var parent = await _context.Items
            .FirstOrDefaultAsync(i => i.Id == parentId && i.UserId == userId);

        if (parent == null)
        {
            throw new KeyNotFoundException($"Parent item with ID {parentId} not found");
        }

        // 设置父项目 ID
        dto.ParentId = parentId;

        return await CreateAsync(dto);
    }

    // 辅助方法
    private async System.Threading.Tasks.Task AddTagsToItemAsync(long itemId, List<string> tagNames)
    {
        var userId = _currentUserService.GetUserId();

        foreach (var tagName in tagNames)
        {
            var trimmedName = tagName.Trim();
            if (string.IsNullOrEmpty(trimmedName)) continue;

            // 查找或创建标签
            var tag = await _context.Tags
                .FirstOrDefaultAsync(t => t.Name == trimmedName && t.UserId == userId);

            if (tag == null)
            {
                tag = new Tag
                {
                    Name = trimmedName,
                    UserId = userId,
                    CreatedAt = DateTime.UtcNow
                };
                _context.Tags.Add(tag);
                await _context.SaveChangesAsync();
            }

            // 创建关联
            var itemTag = new ItemTag
            {
                ItemId = itemId,
                TagId = tag.Id,
                CreatedAt = DateTime.UtcNow
            };
            _context.ItemTags.Add(itemTag);
        }

        await _context.SaveChangesAsync();
    }

    private DateTime? ParseDateTime(string? dateTimeStr)
    {
        if (string.IsNullOrEmpty(dateTimeStr))
            return null;

        if (DateTime.TryParse(dateTimeStr, out var result))
            return result;

        return null;
    }

    public async System.Threading.Tasks.Task<ItemDto> ChangeStatusAsync(long id, ChangeStatusDto dto)
    {
        var userId = _currentUserService.GetUserId();
        var item = await _context.Items
            .Include(i => i.StatusHistory)
            .FirstOrDefaultAsync(i => i.Id == id && i.UserId == userId);

        if (item == null)
        {
            throw new KeyNotFoundException($"Item with ID {id} not found");
        }

        // 解析状态
        if (!Enum.TryParse<ItemStatus>(dto.Status, true, out var newStatus))
        {
            throw new ArgumentException($"Invalid status: {dto.Status}");
        }

        // 更改状态（会自动创建历史记录）
        item.ChangeStatus(newStatus, dto.Comment);

        await _context.SaveChangesAsync();

        return (await GetByIdAsync(id))!;
    }

    public async System.Threading.Tasks.Task<IEnumerable<ItemStatusHistoryDto>> GetStatusHistoryAsync(long id)
    {
        var userId = _currentUserService.GetUserId();
        
        // 验证项目是否存在且属于当前用户
        var itemExists = await _context.Items
            .AnyAsync(i => i.Id == id && i.UserId == userId);

        if (!itemExists)
        {
            throw new KeyNotFoundException($"Item with ID {id} not found");
        }

        var history = await _context.ItemStatusHistories
            .Where(h => h.ItemId == id)
            .OrderByDescending(h => h.ChangedAt)
            .Select(h => new ItemStatusHistoryDto
            {
                Id = h.Id,
                ItemId = h.ItemId,
                OldStatus = h.OldStatus.HasValue ? h.OldStatus.Value.ToString() : null,
                NewStatus = h.NewStatus.ToString(),
                Comment = h.Comment,
                ChangedAt = h.ChangedAt.ToString("yyyy-MM-dd HH:mm:ss"),
                UserId = h.UserId
            })
            .ToListAsync();

        return history;
    }

    private ItemDto MapToDto(Item item)
    {
        return new ItemDto
        {
            Id = item.Id,
            Title = item.Title,
            Description = item.Description,
            Type = item.Type.ToString().ToLower(),
            DueDate = item.DueDate?.ToString("yyyy-MM-dd HH:mm:ss"),
            EventTime = item.EventTime?.ToString("yyyy-MM-dd HH:mm:ss"),
            ReminderTime = item.ReminderTime?.ToString("yyyy-MM-dd HH:mm:ss"),
            Status = item.Status.ToString(),
            StatusChangedAt = item.StatusChangedAt?.ToString("yyyy-MM-dd HH:mm:ss"),
            IsCompleted = item.IsCompleted,
            CompletedAt = item.CompletedAt?.ToString("yyyy-MM-dd HH:mm:ss"),
            Priority = item.Priority,
            Category = item.Category,
            ParentId = item.ParentId,
            SubItems = item.SubItems?.Select(MapToDto).ToList(),
            Tags = item.Tags?.Select(t => t.Tag.Name).ToList(),
            CreatedAt = item.CreatedAt.ToString("yyyy-MM-dd HH:mm:ss"),
            UpdatedAt = item.UpdatedAt?.ToString("yyyy-MM-dd HH:mm:ss")
        };
    }
}
