package com.vocalclerk.application.services;

import com.vocalclerk.api.dtos.CreateTaskDto;
import com.vocalclerk.api.dtos.TaskDto;
import com.vocalclerk.api.dtos.UpdateTaskDto;
import com.vocalclerk.application.interfaces.ITaskService;
import com.vocalclerk.domain.entities.*;
import com.vocalclerk.infrastructure.ai.AIProcessor;
import com.vocalclerk.infrastructure.repositories.CategoryRepository;
import com.vocalclerk.infrastructure.repositories.RawInputRepository;
import com.vocalclerk.infrastructure.repositories.TagRepository;
import com.vocalclerk.infrastructure.repositories.TaskRepository;
import com.vocalclerk.infrastructure.security.CurrentUser;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Implementation of the task service interface.
 */
@Service
public class TaskService implements ITaskService {

    private final TaskRepository taskRepository;
    private final CategoryRepository categoryRepository;
    private final TagRepository tagRepository;
    private final RawInputRepository rawInputRepository;
    private final CurrentUser currentUser;
    private final AIProcessor aiProcessor;

    @Autowired
    public TaskService(
            TaskRepository taskRepository,
            CategoryRepository categoryRepository,
            TagRepository tagRepository,
            RawInputRepository rawInputRepository,
            CurrentUser currentUser,
            AIProcessor aiProcessor) {
        this.taskRepository = taskRepository;
        this.categoryRepository = categoryRepository;
        this.tagRepository = tagRepository;
        this.rawInputRepository = rawInputRepository;
        this.currentUser = currentUser;
        this.aiProcessor = aiProcessor;
    }

    @Override
    public List<TaskDto> getAllTasks() {
        User user = currentUser.getUser();
        List<Task> tasks = taskRepository.findByUserOrderByDueDateAscCreatedAtDesc(user);
        return tasks.stream().map(this::convertToDto).collect(Collectors.toList());
    }

    @Override
    public List<TaskDto> getTasksByCompletionStatus(boolean completed) {
        User user = currentUser.getUser();
        List<Task> tasks = taskRepository.findByUserAndIsCompletedOrderByDueDateAscCreatedAtDesc(user, completed);
        return tasks.stream().map(this::convertToDto).collect(Collectors.toList());
    }

    @Override
    public List<TaskDto> getTasksByCategory(UUID categoryId) {
        User user = currentUser.getUser();
        Category category = categoryRepository.findByIdAndUser(categoryId, user)
                .orElseThrow(() -> new IllegalArgumentException("Category not found"));
        List<Task> tasks = taskRepository.findByCategoryAndUserOrderByDueDateAscCreatedAtDesc(category, user);
        return tasks.stream().map(this::convertToDto).collect(Collectors.toList());
    }

    @Override
    public TaskDto getTaskById(UUID taskId) {
        User user = currentUser.getUser();
        Task task = taskRepository.findByIdAndUser(taskId, user)
                .orElseThrow(() -> new IllegalArgumentException("Task not found"));
        return convertToDto(task);
    }

    @Override
    @Transactional
    public TaskDto createTask(CreateTaskDto createTaskDto) {
        User user = currentUser.getUser();
        
        Task task = new Task();
        task.setTitle(createTaskDto.getTitle());
        task.setDescription(createTaskDto.getDescription());
        task.setDueDate(createTaskDto.getDueDate());
        task.setReminderTime(createTaskDto.getReminderTime());
        task.setPriority(createTaskDto.getPriority());
        task.setUser(user);
        task.setOriginalInput(createTaskDto.getOriginalInput());
        
        if (createTaskDto.getCategoryId() != null) {
            Category category = categoryRepository.findByIdAndUser(createTaskDto.getCategoryId(), user)
                    .orElseThrow(() -> new IllegalArgumentException("Category not found"));
            task.setCategory(category);
        } else {
            // Use default category if none specified
            Category defaultCategory = categoryRepository.findByUserAndIsDefault(user, true)
                    .orElseGet(() -> {
                        Category newDefault = new Category();
                        newDefault.setName("General");
                        newDefault.setColor("#808080");
                        newDefault.setIcon("folder");
                        newDefault.setUser(user);
                        newDefault.setDefault(true);
                        return categoryRepository.save(newDefault);
                    });
            task.setCategory(defaultCategory);
        }
        
        Task savedTask = taskRepository.save(task);
        
        // Process tags
        if (createTaskDto.getTags() != null && !createTaskDto.getTags().isEmpty()) {
            processTags(savedTask, createTaskDto.getTags());
        }
        
        return convertToDto(savedTask);
    }

    @Override
    @Transactional
    public TaskDto updateTask(UUID taskId, UpdateTaskDto updateTaskDto) {
        User user = currentUser.getUser();
        Task task = taskRepository.findByIdAndUser(taskId, user)
                .orElseThrow(() -> new IllegalArgumentException("Task not found"));
        
        if (updateTaskDto.getTitle() != null) {
            task.setTitle(updateTaskDto.getTitle());
        }
        
        if (updateTaskDto.getDescription() != null) {
            task.setDescription(updateTaskDto.getDescription());
        }
        
        if (updateTaskDto.getDueDate() != null) {
            task.setDueDate(updateTaskDto.getDueDate());
        }
        
        if (updateTaskDto.getReminderTime() != null) {
            task.setReminderTime(updateTaskDto.getReminderTime());
        }
        
        if (updateTaskDto.getCompleted() != null) {
            if (updateTaskDto.getCompleted() && !task.isCompleted()) {
                task.markAsCompleted();
            } else if (!updateTaskDto.getCompleted() && task.isCompleted()) {
                task.markAsNotCompleted();
            }
        }
        
        if (updateTaskDto.getPriority() != null) {
            task.setPriority(updateTaskDto.getPriority());
        }
        
        if (updateTaskDto.getCategoryId() != null) {
            Category category = categoryRepository.findByIdAndUser(updateTaskDto.getCategoryId(), user)
                    .orElseThrow(() -> new IllegalArgumentException("Category not found"));
            task.setCategory(category);
        }
        
        Task updatedTask = taskRepository.save(task);
        
        // Update tags if provided
        if (updateTaskDto.getTags() != null) {
            // Remove existing task-tag relationships
            updatedTask.getTags().clear();
            
            // Process new tags
            processTags(updatedTask, updateTaskDto.getTags());
        }
        
        return convertToDto(updatedTask);
    }

    @Override
    @Transactional
    public void deleteTask(UUID taskId) {
        User user = currentUser.getUser();
        Task task = taskRepository.findByIdAndUser(taskId, user)
                .orElseThrow(() -> new IllegalArgumentException("Task not found"));
        taskRepository.delete(task);
    }

    @Override
    @Transactional
    public TaskDto markTaskAsCompleted(UUID taskId) {
        User user = currentUser.getUser();
        Task task = taskRepository.findByIdAndUser(taskId, user)
                .orElseThrow(() -> new IllegalArgumentException("Task not found"));
        task.markAsCompleted();
        Task updatedTask = taskRepository.save(task);
        return convertToDto(updatedTask);
    }

    @Override
    @Transactional
    public TaskDto markTaskAsNotCompleted(UUID taskId) {
        User user = currentUser.getUser();
        Task task = taskRepository.findByIdAndUser(taskId, user)
                .orElseThrow(() -> new IllegalArgumentException("Task not found"));
        task.markAsNotCompleted();
        Task updatedTask = taskRepository.save(task);
        return convertToDto(updatedTask);
    }

    @Override
    @Transactional
    public List<TaskDto> processRawInputText(String inputText) {
        User user = currentUser.getUser();
        
        // Save raw input
        RawInput rawInput = new RawInput();
        rawInput.setContent(inputText);
        rawInput.setType(InputType.TEXT);
        rawInput.setUser(user);
        RawInput savedRawInput = rawInputRepository.save(rawInput);
        
        // Process with AI
        long startTime = System.currentTimeMillis();
        List<Map<String, Object>> extractedTasks = aiProcessor.processInput(inputText);
        long processingTime = System.currentTimeMillis() - startTime;
        
        // Save AI processing result
        AIProcessingResult result = new AIProcessingResult();
        result.setRawInput(savedRawInput);
        result.setProcessedContent(extractedTasks.toString());
        result.setAiModelUsed(user.getSettings().getAiModel());
        result.setProcessingTimeMs(processingTime);
        result.setConfidenceScore(0.85); // Example value
        
        // Create tasks from AI results
        List<Task> createdTasks = new ArrayList<>();
        for (Map<String, Object> taskData : extractedTasks) {
            Task task = new Task();
            task.setTitle((String) taskData.get("title"));
            task.setDescription((String) taskData.getOrDefault("description", ""));
            
            if (taskData.containsKey("dueDate")) {
                task.setDueDate(parseDateTime((String) taskData.get("dueDate")));
            }
            
            if (taskData.containsKey("reminderTime")) {
                task.setReminderTime(parseDateTime((String) taskData.get("reminderTime")));
            }
            
            if (taskData.containsKey("priority")) {
                String priorityStr = (String) taskData.get("priority");
                task.setPriority(TaskPriority.valueOf(priorityStr.toUpperCase()));
            } else {
                task.setPriority(TaskPriority.MEDIUM);
            }
            
            task.setUser(user);
            task.setOriginalInput(inputText);
            
            // Handle category
            String categoryName = (String) taskData.getOrDefault("category", "General");
            Category category = categoryRepository.findByNameAndUser(categoryName, user)
                    .orElseGet(() -> {
                        Category newCategory = new Category();
                        newCategory.setName(categoryName);
                        newCategory.setColor(generateRandomColor());
                        newCategory.setIcon("folder");
                        newCategory.setUser(user);
                        return categoryRepository.save(newCategory);
                    });
            task.setCategory(category);
            
            Task savedTask = taskRepository.save(task);
            
            // Handle tags
            if (taskData.containsKey("tags")) {
                @SuppressWarnings("unchecked")
                List<String> tagNames = (List<String>) taskData.get("tags");
                processTags(savedTask, tagNames);
            }
            
            createdTasks.add(savedTask);
        }
        
        // Update raw input with generated tasks
        savedRawInput.setGeneratedTasks(createdTasks);
        rawInputRepository.save(savedRawInput);
        
        return createdTasks.stream().map(this::convertToDto).collect(Collectors.toList());
    }

    @Override
    public List<TaskDto> getTasksDueToday() {
        User user = currentUser.getUser();
        LocalDateTime startOfDay = LocalDateTime.of(LocalDate.now(), LocalTime.MIN);
        LocalDateTime endOfDay = LocalDateTime.of(LocalDate.now(), LocalTime.MAX);
        List<Task> tasks = taskRepository.findByUserAndDueDateBetweenAndIsCompletedOrderByDueDateAsc(
                user, startOfDay, endOfDay, false);
        return tasks.stream().map(this::convertToDto).collect(Collectors.toList());
    }

    /**
     * Converts a Task entity to a TaskDto.
     *
     * @param task The task entity
     * @return The task DTO
     */
    private TaskDto convertToDto(Task task) {
        TaskDto dto = new TaskDto();
        dto.setId(task.getId());
        dto.setTitle(task.getTitle());
        dto.setDescription(task.getDescription());
        dto.setDueDate(task.getDueDate());
        dto.setReminderTime(task.getReminderTime());
        dto.setCompleted(task.isCompleted());
        dto.setPriority(task.getPriority());
        dto.setCreatedAt(task.getCreatedAt());
        dto.setCompletedAt(task.getCompletedAt());
        
        if (task.getCategory() != null) {
            dto.setCategoryId(task.getCategory().getId());
            dto.setCategoryName(task.getCategory().getName());
        }
        
        List<String> tagNames = task.getTags().stream()
                .map(taskTag -> taskTag.getTag().getName())
                .collect(Collectors.toList());
        dto.setTags(tagNames);
        
        return dto;
    }

    /**
     * Processes tags for a task.
     *
     * @param task The task
     * @param tagNames The tag names
     */
    private void processTags(Task task, List<String> tagNames) {
        User user = currentUser.getUser();
        
        for (String tagName : tagNames) {
            Tag tag = tagRepository.findByNameAndUser(tagName, user)
                    .orElseGet(() -> {
                        Tag newTag = new Tag();
                        newTag.setName(tagName);
                        newTag.setUser(user);
                        return tagRepository.save(newTag);
                    });
            
            TaskTag taskTag = new TaskTag();
            taskTag.setTask(task);
            taskTag.setTag(tag);
            task.getTags().add(taskTag);
        }
        
        taskRepository.save(task);
    }

    /**
     * Parses a date-time string into a LocalDateTime object.
     *
     * @param dateTimeStr The date-time string
     * @return The LocalDateTime object
     */
    private LocalDateTime parseDateTime(String dateTimeStr) {
        // This is a simplified implementation
        // In a real application, you would use a more robust parsing mechanism
        try {
            return LocalDateTime.parse(dateTimeStr);
        } catch (Exception e) {
            return LocalDateTime.now().plusDays(1);
        }
    }

    /**
     * Generates a random color in hex format.
     *
     * @return A random color
     */
    private String generateRandomColor() {
        Random random = new Random();
        int r = random.nextInt(256);
        int g = random.nextInt(256);
        int b = random.nextInt(256);
        return String.format("#%02x%02x%02x", r, g, b);
    }
}