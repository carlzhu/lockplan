package com.vocalclerk.api.controllers;

import com.vocalclerk.api.dtos.CreateTaskDto;
import com.vocalclerk.api.dtos.TaskDto;
import com.vocalclerk.api.dtos.UpdateTaskDto;
import com.vocalclerk.application.interfaces.ITaskService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * REST controller for task operations.
 */
@RestController
@RequestMapping("/tasks")
@Tag(name = "Tasks", description = "Task management endpoints")
public class TasksController {

    private final ITaskService taskService;

    @Autowired
    public TasksController(ITaskService taskService) {
        this.taskService = taskService;
    }

    @GetMapping
    @Operation(summary = "Get all tasks", description = "Retrieves all tasks for the current user")
    public ResponseEntity<List<TaskDto>> getAllTasks(
            @RequestParam(required = false) Boolean completed) {
        List<TaskDto> tasks;
        if (completed != null) {
            tasks = taskService.getTasksByCompletionStatus(completed);
        } else {
            tasks = taskService.getAllTasks();
        }
        return ResponseEntity.ok(tasks);
    }

    @GetMapping("/category/{categoryId}")
    @Operation(summary = "Get tasks by category", description = "Retrieves tasks in a specific category")
    public ResponseEntity<List<TaskDto>> getTasksByCategory(@PathVariable String categoryId) {
        List<TaskDto> tasks = taskService.getTasksByCategory(categoryId);
        return ResponseEntity.ok(tasks);
    }

    @GetMapping("/today")
    @Operation(summary = "Get tasks due today", description = "Retrieves tasks that are due today")
    public ResponseEntity<List<TaskDto>> getTasksDueToday() {
        List<TaskDto> tasks = taskService.getTasksDueToday();
        return ResponseEntity.ok(tasks);
    }

    @GetMapping("/{taskId}")
    @Operation(summary = "Get task by ID", description = "Retrieves a specific task by its ID")
    public ResponseEntity<TaskDto> getTaskById(@PathVariable String taskId) {
        TaskDto task = taskService.getTaskById(taskId);
        return ResponseEntity.ok(task);
    }

    @PostMapping
    @Operation(summary = "Create task", description = "Creates a new task")
    public ResponseEntity<TaskDto> createTask(@Valid @RequestBody CreateTaskDto createTaskDto) {
        TaskDto createdTask = taskService.createTask(createTaskDto);
        return new ResponseEntity<>(createdTask, HttpStatus.CREATED);
    }

    @PutMapping("/{taskId}")
    @Operation(summary = "Update task", description = "Updates an existing task")
    public ResponseEntity<TaskDto> updateTask(
            @PathVariable String taskId,
            @Valid @RequestBody UpdateTaskDto updateTaskDto) {
        TaskDto updatedTask = taskService.updateTask(taskId, updateTaskDto);
        return ResponseEntity.ok(updatedTask);
    }

    @DeleteMapping("/{taskId}")
    @Operation(summary = "Delete task", description = "Deletes a task")
    public ResponseEntity<Void> deleteTask(@PathVariable String taskId) {
        taskService.deleteTask(taskId);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{taskId}/complete")
    @Operation(summary = "Mark task as completed", description = "Marks a task as completed")
    public ResponseEntity<TaskDto> markTaskAsCompleted(@PathVariable String taskId) {
        TaskDto updatedTask = taskService.markTaskAsCompleted(taskId);
        return ResponseEntity.ok(updatedTask);
    }

    @PatchMapping("/{taskId}/incomplete")
    @Operation(summary = "Mark task as not completed", description = "Marks a task as not completed")
    public ResponseEntity<TaskDto> markTaskAsNotCompleted(@PathVariable String taskId) {
        TaskDto updatedTask = taskService.markTaskAsNotCompleted(taskId);
        return ResponseEntity.ok(updatedTask);
    }

    @PostMapping("/process")
    @Operation(summary = "Process raw input", description = "Processes raw input text to create tasks")
    public ResponseEntity<List<TaskDto>> processRawInput(@RequestBody String inputText) {
        List<TaskDto> createdTasks = taskService.processRawInputText(inputText);
        return new ResponseEntity<>(createdTasks, HttpStatus.CREATED);
    }
}