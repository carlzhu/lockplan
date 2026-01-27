using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using DoNow.Application.DTOs;
using DoNow.Application.Interfaces;

namespace DoNow.Api.Controllers;

[ApiController]
[Route("items")]
[Authorize]
public class ItemsController : ControllerBase
{
    private readonly IItemService _itemService;
    private readonly ILogger<ItemsController> _logger;

    public ItemsController(IItemService itemService, ILogger<ItemsController> logger)
    {
        _itemService = itemService;
        _logger = logger;
    }

    /// <summary>
    /// 获取所有项目
    /// </summary>
    /// <param name="type">类型筛选 (task, event, project, note)</param>
    /// <param name="status">状态筛选 (Todo, InProgress, Completed, OnHold, Cancelled)</param>
    /// <param name="includeSubItems">是否包含子项目</param>
    /// <param name="topLevelOnly">只获取顶层项目</param>
    [HttpGet]
    public async Task<ActionResult<IEnumerable<ItemDto>>> GetAll(
        [FromQuery] string? type = null,
        [FromQuery] string? status = null,
        [FromQuery] bool includeSubItems = false,
        [FromQuery] bool topLevelOnly = false)
    {
        try
        {
            var items = await _itemService.GetAllAsync(type, status, includeSubItems, topLevelOnly);
            return Ok(items);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting items");
            return StatusCode(500, new { message = "Failed to get items" });
        }
    }

    /// <summary>
    /// 根据 ID 获取项目
    /// </summary>
    [HttpGet("{id}")]
    public async Task<ActionResult<ItemDto>> GetById(long id, [FromQuery] bool includeSubItems = false)
    {
        try
        {
            var item = await _itemService.GetByIdAsync(id, includeSubItems);
            if (item == null)
            {
                return NotFound(new { message = $"Item with ID {id} not found" });
            }
            return Ok(item);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting item {ItemId}", id);
            return StatusCode(500, new { message = "Failed to get item" });
        }
    }

    /// <summary>
    /// 创建项目
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<ItemDto>> Create([FromBody] CreateItemDto dto)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(dto.Title))
            {
                return BadRequest(new { message = "Title is required" });
            }

            var item = await _itemService.CreateAsync(dto);
            return CreatedAtAction(nameof(GetById), new { id = item.Id }, item);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating item");
            return StatusCode(500, new { message = "Failed to create item" });
        }
    }

    /// <summary>
    /// 更新项目
    /// </summary>
    [HttpPut("{id}")]
    public async Task<ActionResult<ItemDto>> Update(long id, [FromBody] UpdateItemDto dto)
    {
        try
        {
            var item = await _itemService.UpdateAsync(id, dto);
            return Ok(item);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating item {ItemId}", id);
            return StatusCode(500, new { message = "Failed to update item" });
        }
    }

    /// <summary>
    /// 删除项目
    /// </summary>
    [HttpDelete("{id}")]
    public async Task<ActionResult> Delete(long id)
    {
        try
        {
            await _itemService.DeleteAsync(id);
            return NoContent();
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting item {ItemId}", id);
            return StatusCode(500, new { message = "Failed to delete item" });
        }
    }

    /// <summary>
    /// 标记任务为已完成
    /// </summary>
    [HttpPost("{id}/complete")]
    public async Task<ActionResult<ItemDto>> MarkAsCompleted(long id)
    {
        try
        {
            var item = await _itemService.MarkAsCompletedAsync(id);
            return Ok(item);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error marking item {ItemId} as completed", id);
            return StatusCode(500, new { message = "Failed to mark item as completed" });
        }
    }

    /// <summary>
    /// 标记任务为未完成
    /// </summary>
    [HttpPost("{id}/uncomplete")]
    public async Task<ActionResult<ItemDto>> MarkAsNotCompleted(long id)
    {
        try
        {
            var item = await _itemService.MarkAsNotCompletedAsync(id);
            return Ok(item);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error marking item {ItemId} as not completed", id);
            return StatusCode(500, new { message = "Failed to mark item as not completed" });
        }
    }

    /// <summary>
    /// 获取项目的子项目
    /// </summary>
    [HttpGet("{id}/subitems")]
    public async Task<ActionResult<IEnumerable<ItemDto>>> GetSubItems(long id)
    {
        try
        {
            var subItems = await _itemService.GetSubItemsAsync(id);
            return Ok(subItems);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting sub-items for item {ItemId}", id);
            return StatusCode(500, new { message = "Failed to get sub-items" });
        }
    }

    /// <summary>
    /// 为项目添加子项目
    /// </summary>
    [HttpPost("{id}/subitems")]
    public async Task<ActionResult<ItemDto>> AddSubItem(long id, [FromBody] CreateItemDto dto)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(dto.Title))
            {
                return BadRequest(new { message = "Title is required" });
            }

            var subItem = await _itemService.AddSubItemAsync(id, dto);
            return CreatedAtAction(nameof(GetById), new { id = subItem.Id }, subItem);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error adding sub-item to item {ItemId}", id);
            return StatusCode(500, new { message = "Failed to add sub-item" });
        }
    }

    /// <summary>
    /// 更改项目状态
    /// </summary>
    [HttpPost("{id}/change-status")]
    public async Task<ActionResult<ItemDto>> ChangeStatus(long id, [FromBody] ChangeStatusDto dto)
    {
        try
        {
            var item = await _itemService.ChangeStatusAsync(id, dto);
            return Ok(item);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error changing status for item {ItemId}", id);
            return StatusCode(500, new { message = "Failed to change status" });
        }
    }

    /// <summary>
    /// 获取项目的状态变更历史
    /// </summary>
    [HttpGet("{id}/status-history")]
    public async Task<ActionResult<IEnumerable<ItemStatusHistoryDto>>> GetStatusHistory(long id)
    {
        try
        {
            var history = await _itemService.GetStatusHistoryAsync(id);
            return Ok(history);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting status history for item {ItemId}", id);
            return StatusCode(500, new { message = "Failed to get status history" });
        }
    }
}
