package com.vocalclerk.api.dtos;

import com.vocalclerk.domain.entities.TaskPriority;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * DTO for transferring task data to and from the API.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class TaskDto {
    private String id;
    private String title;
    private String description;
    private LocalDateTime dueDate;
    private LocalDateTime reminderTime;
    private boolean completed;
    private TaskPriority priority;
    private String categoryId;
    private String categoryName;
    private List<String> tags;
    private LocalDateTime createdAt;
    private LocalDateTime completedAt;
}