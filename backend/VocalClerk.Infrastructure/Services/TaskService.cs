using Microsoft.EntityFrameworkCore;
using VocalClerk.Application.DTOs;
using VocalClerk.Application.Interfaces;
using VocalClerk.Domain.Entities;
using VocalClerk.Infrastructure.Data;
using VocalClerk.Infrastructure.Security;

namespace VocalClerk.Infrastructure.Services;

public class TaskService : ITaskService
{
    private readonly VocalClerkDbContext _context;
    private readonly CurrentUserService _currentUserService;

    public TaskService(VocalClerkDbContext context, CurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task<List<TaskDto>> GetAllTasksAsync()
    {
        var user = await _currentUserService.GetUserAsync();
        var tasks = await _context.Tasks
            .Include(t => t.Category)
            .Include(t => t.Tags).ThenInclude(tt => tt.Tag)
            .Where(t => t.UserId == user.Id)
            .OrderBy(t => t.DueDate)
            .ThenByDescending(t => t.CreatedAt)
            .ToListAsync();

        return tasks.Select(ConvertToDto).ToList();
    }

    public async Task<List<TaskDto>> GetTasksByCompletionStatusAsync(bool completed)
    {
        var user = await _currentUserService.GetUserAsync();
        var tasks = await _context.Tasks
            .Include(t => t.Category)
            .Include(t => t.Tags).ThenInclude(tt => tt.Tag)
            .Where(t => t.UserId == user.Id && t.IsCompleted == completed)
            .OrderBy(t => t.DueDate)
            .ThenByDescending(t => t.CreatedAt)
            .ToListAsync();

        return tasks.Select(ConvertToDto).ToList();
    }

    public async Task<List<TaskDto>> GetTasksByCategoryAsync(long categoryId)
    {
        var user = await _currentUserService.GetUserAsync();
        var tasks = await _context.Tasks
            .Include(t => t.Category)
            .Include(t => t.Tags).ThenInclude(tt => tt.Tag)
            .Where(t => t.UserId == user.Id && t.CategoryId == categoryId)
            .OrderBy(t => t.DueDate)
            .ThenByDescending(t => t.CreatedAt)
            .ToListAsync();

        return tasks.Select(ConvertToDto).ToList();
    }

    public async Task<TaskDto> GetTaskByIdAsync(long taskId)
    {
        var user = await _currentUserService.GetUserAsync();
        var task = await _context.Tasks
            .Include(t => t.Category)
            .Include(t => t.Tags).ThenInclude(tt => tt.Tag)
            .FirstOrDefaultAsync(t => t.Id == taskId && t.UserId == user.Id);

        if (task == null)
        {
            throw new ArgumentException("Task not found");
        }

        return ConvertToDto(task);
    }

    public async Task<TaskDto> CreateTaskAsync(CreateTaskDto createTaskDto)
    {
        var user = await _currentUserService.GetUserAsync();

        var task = new Domain.Entities.Task
        {
            Title = createTaskDto.Title,
            Description = createTaskDto.Description,
            DueDate = createTaskDto.DueDate,
            ReminderTime = createTaskDto.ReminderTime,
            Priority = createTaskDto.Priority,
            UserId = user.Id,
            OriginalInput = createTaskDto.OriginalInput,
            CreatedAt = DateTime.UtcNow
        };

        if (createTaskDto.CategoryId.HasValue)
        {
            task.CategoryId = createTaskDto.CategoryId.Value;
        }
        else
        {
            var defaultCategory = await _context.Categories
                .FirstOrDefaultAsync(c => c.UserId == user.Id && c.IsDefault);

            if (defaultCategory == null)
            {
                defaultCategory = new Category
                {
                    Name = "General",
                    Color = "#808080",
                    Icon = "folder",
                    UserId = user.Id,
                    IsDefault = true,
                    CreatedAt = DateTime.UtcNow
                };
                _context.Categories.Add(defaultCategory);
                await _context.SaveChangesAsync();
            }

            task.CategoryId = defaultCategory.Id;
        }

        _context.Tasks.Add(task);
        await _context.SaveChangesAsync();

        if (createTaskDto.Tags != null && createTaskDto.Tags.Any())
        {
            await ProcessTagsAsync(task, createTaskDto.Tags, user.Id);
        }

        return await GetTaskByIdAsync(task.Id);
    }

    public async Task<TaskDto> UpdateTaskAsync(long taskId, UpdateTaskDto updateTaskDto)
    {
        var user = await _currentUserService.GetUserAsync();
        var task = await _context.Tasks
            .FirstOrDefaultAsync(t => t.Id == taskId && t.UserId == user.Id);

        if (task == null)
        {
            throw new ArgumentException("Task not found");
        }

        if (updateTaskDto.Title != null)
            task.Title = updateTaskDto.Title;

        if (updateTaskDto.Description != null)
            task.Description = updateTaskDto.Description;

        if (updateTaskDto.DueDate.HasValue)
            task.DueDate = updateTaskDto.DueDate;

        if (updateTaskDto.ReminderTime.HasValue)
            task.ReminderTime = updateTaskDto.ReminderTime;

        if (updateTaskDto.Completed.HasValue)
        {
            if (updateTaskDto.Completed.Value && !task.IsCompleted)
                task.MarkAsCompleted();
            else if (!updateTaskDto.Completed.Value && task.IsCompleted)
                task.MarkAsNotCompleted();
        }

        if (updateTaskDto.Priority.HasValue)
            task.Priority = updateTaskDto.Priority.Value;

        if (updateTaskDto.CategoryId.HasValue)
            task.CategoryId = updateTaskDto.CategoryId;

        if (updateTaskDto.Tags != null)
        {
            var existingTags = await _context.TaskTags.Where(tt => tt.TaskId == taskId).ToListAsync();
            _context.TaskTags.RemoveRange(existingTags);
            await ProcessTagsAsync(task, updateTaskDto.Tags, user.Id);
        }

        await _context.SaveChangesAsync();

        return await GetTaskByIdAsync(taskId);
    }

    public async System.Threading.Tasks.Task DeleteTaskAsync(long taskId)
    {
        var user = await _currentUserService.GetUserAsync();
        var task = await _context.Tasks
            .FirstOrDefaultAsync(t => t.Id == taskId && t.UserId == user.Id);

        if (task == null)
        {
            throw new ArgumentException("Task not found");
        }

        _context.Tasks.Remove(task);
        await _context.SaveChangesAsync();
    }

    public async Task<TaskDto> MarkTaskAsCompletedAsync(long taskId)
    {
        var user = await _currentUserService.GetUserAsync();
        var task = await _context.Tasks
            .FirstOrDefaultAsync(t => t.Id == taskId && t.UserId == user.Id);

        if (task == null)
        {
            throw new ArgumentException("Task not found");
        }

        task.MarkAsCompleted();
        await _context.SaveChangesAsync();

        return await GetTaskByIdAsync(taskId);
    }

    public async Task<TaskDto> MarkTaskAsNotCompletedAsync(long taskId)
    {
        var user = await _currentUserService.GetUserAsync();
        var task = await _context.Tasks
            .FirstOrDefaultAsync(t => t.Id == taskId && t.UserId == user.Id);

        if (task == null)
        {
            throw new ArgumentException("Task not found");
        }

        task.MarkAsNotCompleted();
        await _context.SaveChangesAsync();

        return await GetTaskByIdAsync(taskId);
    }

    public async Task<List<TaskDto>> ProcessRawInputTextAsync(string inputText)
    {
        var user = await _currentUserService.GetUserAsync();
        
        // Simplified AI processing - in production, integrate with actual AI service
        var tasks = new List<Domain.Entities.Task>
        {
            new Domain.Entities.Task
            {
                Title = inputText.Length > 100 ? inputText.Substring(0, 100) : inputText,
                Description = inputText,
                Priority = TaskPriority.MEDIUM,
                UserId = user.Id,
                OriginalInput = inputText,
                CreatedAt = DateTime.UtcNow
            }
        };

        var defaultCategory = await _context.Categories
            .FirstOrDefaultAsync(c => c.UserId == user.Id && c.IsDefault);

        if (defaultCategory == null)
        {
            defaultCategory = new Category
            {
                Name = "General",
                Color = "#808080",
                Icon = "folder",
                UserId = user.Id,
                IsDefault = true,
                CreatedAt = DateTime.UtcNow
            };
            _context.Categories.Add(defaultCategory);
            await _context.SaveChangesAsync();
        }

        foreach (var task in tasks)
        {
            task.CategoryId = defaultCategory.Id;
            _context.Tasks.Add(task);
        }

        await _context.SaveChangesAsync();

        return tasks.Select(ConvertToDto).ToList();
    }

    public async Task<List<TaskDto>> GetTasksDueTodayAsync()
    {
        var user = await _currentUserService.GetUserAsync();
        var today = DateTime.UtcNow.Date;
        var tomorrow = today.AddDays(1);

        var tasks = await _context.Tasks
            .Include(t => t.Category)
            .Include(t => t.Tags).ThenInclude(tt => tt.Tag)
            .Where(t => t.UserId == user.Id && 
                       t.DueDate.HasValue && 
                       t.DueDate.Value >= today && 
                       t.DueDate.Value < tomorrow &&
                       !t.IsCompleted)
            .OrderBy(t => t.DueDate)
            .ToListAsync();

        return tasks.Select(ConvertToDto).ToList();
    }

    private async System.Threading.Tasks.Task ProcessTagsAsync(Domain.Entities.Task task, List<string> tagNames, string userId)
    {
        foreach (var tagName in tagNames)
        {
            var tag = await _context.Tags
                .FirstOrDefaultAsync(t => t.Name == tagName && t.UserId == userId);

            if (tag == null)
            {
                tag = new Tag
                {
                    Name = tagName,
                    UserId = userId,
                    CreatedAt = DateTime.UtcNow
                };
                _context.Tags.Add(tag);
                await _context.SaveChangesAsync();
            }

            var taskTag = new TaskTag
            {
                TaskId = task.Id,
                TagId = tag.Id
            };
            _context.TaskTags.Add(taskTag);
        }

        await _context.SaveChangesAsync();
    }

    private TaskDto ConvertToDto(Domain.Entities.Task task)
    {
        return new TaskDto
        {
            Id = task.Id,
            Title = task.Title,
            Description = task.Description,
            DueDate = task.DueDate,
            ReminderTime = task.ReminderTime,
            Completed = task.IsCompleted,
            Priority = task.Priority,
            CategoryId = task.CategoryId,
            CategoryName = task.Category?.Name,
            CreatedAt = task.CreatedAt,
            CompletedAt = task.CompletedAt,
            Tags = task.Tags?.Select(tt => tt.Tag?.Name ?? "").Where(n => !string.IsNullOrEmpty(n)).ToList() ?? new List<string>()
        };
    }
}
