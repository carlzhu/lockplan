package com.vocalclerk.application.interfaces;

import com.vocalclerk.api.dtos.CreateTaskDto;
import com.vocalclerk.api.dtos.TaskDto;
import com.vocalclerk.api.dtos.UpdateTaskDto;

import java.util.List;
import java.util.UUID;

/**
 * Interface for task service operations.
 */
public interface ITaskService {
    
    /**
     * Get all tasks for the current user.
     *
     * @return List of task DTOs
     */
    List<TaskDto> getAllTasks();
    
    /**
     * Get tasks for the current user filtered by completion status.
     *
     * @param completed Whether to get completed or incomplete tasks
     * @return List of task DTOs
     */
    List<TaskDto> getTasksByCompletionStatus(boolean completed);
    
    /**
     * Get tasks for the current user in a specific category.
     *
     * @param categoryId The category ID
     * @return List of task DTOs
     */
    List<TaskDto> getTasksByCategory(String categoryId);
    
    /**
     * Get a specific task by ID.
     *
     * @param taskId The task ID
     * @return The task DTO
     */
    TaskDto getTaskById(String taskId);
    
    /**
     * Create a new task.
     *
     * @param createTaskDto The task creation data
     * @return The created task DTO
     */
    TaskDto createTask(CreateTaskDto createTaskDto);
    
    /**
     * Update an existing task.
     *
     * @param taskId The task ID
     * @param updateTaskDto The task update data
     * @return The updated task DTO
     */
    TaskDto updateTask(String taskId, UpdateTaskDto updateTaskDto);
    
    /**
     * Delete a task.
     *
     * @param taskId The task ID
     */
    void deleteTask(String taskId);
    
    /**
     * Mark a task as completed.
     *
     * @param taskId The task ID
     * @return The updated task DTO
     */
    TaskDto markTaskAsCompleted(String taskId);
    
    /**
     * Mark a task as not completed.
     *
     * @param taskId The task ID
     * @return The updated task DTO
     */
    TaskDto markTaskAsNotCompleted(String taskId);
    
    /**
     * Process raw input text to create tasks.
     *
     * @param inputText The raw input text
     * @return List of created task DTOs
     */
    List<TaskDto> processRawInputText(String inputText);
    
    /**
     * Get tasks due today.
     *
     * @return List of task DTOs
     */
    List<TaskDto> getTasksDueToday();
}