package com.vocalclerk.api.dtos;

import com.vocalclerk.domain.entities.TaskPriority;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * DTO for creating a new task.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class CreateTaskDto {
    
    @NotBlank(message = "Title is required")
    @Size(min = 1, max = 255, message = "Title must be between 1 and 255 characters")
    private String title;
    
    @Size(max = 1000, message = "Description cannot exceed 1000 characters")
    private String description;
    
    private LocalDateTime dueDate;
    
    private LocalDateTime reminderTime;
    
    private TaskPriority priority = TaskPriority.MEDIUM;
    
    private UUID categoryId;
    
    private List<String> tags;
    
    private String originalInput;
}