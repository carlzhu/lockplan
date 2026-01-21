using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using VocalClerk.Application.DTOs;
using VocalClerk.Application.Interfaces;

namespace VocalClerk.Api.Controllers;

[ApiController]
[Route("tasks")]
[Authorize]
public class TasksController : ControllerBase
{
    private readonly ITaskService _taskService;

    public TasksController(ITaskService taskService)
    {
        _taskService = taskService;
    }

    [HttpGet]
    public async Task<ActionResult<List<TaskDto>>> GetAllTasks([FromQuery] bool? completed)
    {
        try
        {
            var tasks = completed.HasValue
                ? await _taskService.GetTasksByCompletionStatusAsync(completed.Value)
                : await _taskService.GetAllTasksAsync();
            return Ok(tasks);
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpGet("category/{categoryId}")]
    public async Task<ActionResult<List<TaskDto>>> GetTasksByCategory(long categoryId)
    {
        try
        {
            var tasks = await _taskService.GetTasksByCategoryAsync(categoryId);
            return Ok(tasks);
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpGet("today")]
    public async Task<ActionResult<List<TaskDto>>> GetTasksDueToday()
    {
        try
        {
            var tasks = await _taskService.GetTasksDueTodayAsync();
            return Ok(tasks);
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpGet("{taskId}")]
    public async Task<ActionResult<TaskDto>> GetTaskById(long taskId)
    {
        try
        {
            var task = await _taskService.GetTaskByIdAsync(taskId);
            return Ok(task);
        }
        catch (ArgumentException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }

    [HttpPost]
    public async Task<ActionResult<TaskDto>> CreateTask([FromBody] CreateTaskDto createTaskDto)
    {
        try
        {
            var task = await _taskService.CreateTaskAsync(createTaskDto);
            return CreatedAtAction(nameof(GetTaskById), new { taskId = task.Id }, task);
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPut("{taskId}")]
    public async Task<ActionResult<TaskDto>> UpdateTask(long taskId, [FromBody] UpdateTaskDto updateTaskDto)
    {
        try
        {
            var task = await _taskService.UpdateTaskAsync(taskId, updateTaskDto);
            return Ok(task);
        }
        catch (ArgumentException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }

    [HttpDelete("{taskId}")]
    public async Task<ActionResult> DeleteTask(long taskId)
    {
        try
        {
            await _taskService.DeleteTaskAsync(taskId);
            return NoContent();
        }
        catch (ArgumentException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }

    [HttpPatch("{taskId}/complete")]
    public async Task<ActionResult<TaskDto>> MarkTaskAsCompleted(long taskId)
    {
        try
        {
            var task = await _taskService.MarkTaskAsCompletedAsync(taskId);
            return Ok(task);
        }
        catch (ArgumentException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }

    [HttpPatch("{taskId}/incomplete")]
    public async Task<ActionResult<TaskDto>> MarkTaskAsNotCompleted(long taskId)
    {
        try
        {
            var task = await _taskService.MarkTaskAsNotCompletedAsync(taskId);
            return Ok(task);
        }
        catch (ArgumentException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }

    [HttpPost("process")]
    public async Task<ActionResult<List<TaskDto>>> ProcessRawInput([FromBody] string inputText)
    {
        try
        {
            var tasks = await _taskService.ProcessRawInputTextAsync(inputText);
            return CreatedAtAction(nameof(GetAllTasks), tasks);
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }
}
