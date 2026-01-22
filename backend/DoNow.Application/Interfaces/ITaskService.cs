using DoNow.Application.DTOs;

namespace DoNow.Application.Interfaces;

public interface ITaskService
{
    Task<List<TaskDto>> GetAllTasksAsync();
    Task<List<TaskDto>> GetTasksByCompletionStatusAsync(bool completed);
    Task<List<TaskDto>> GetTasksByCategoryAsync(long categoryId);
    Task<TaskDto> GetTaskByIdAsync(long taskId);
    Task<TaskDto> CreateTaskAsync(CreateTaskDto createTaskDto);
    Task<TaskDto> UpdateTaskAsync(long taskId, UpdateTaskDto updateTaskDto);
    Task DeleteTaskAsync(long taskId);
    Task<TaskDto> MarkTaskAsCompletedAsync(long taskId);
    Task<TaskDto> MarkTaskAsNotCompletedAsync(long taskId);
    Task<List<TaskDto>> ProcessRawInputTextAsync(string inputText);
    Task<List<TaskDto>> GetTasksDueTodayAsync();
}
