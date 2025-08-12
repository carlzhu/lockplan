package com.vocalclerk.infrastructure.repositories;

import com.vocalclerk.domain.entities.Category;
import com.vocalclerk.domain.entities.Task;
import com.vocalclerk.domain.entities.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Repository for Task entity operations.
 */
@Repository
public interface TaskRepository extends JpaRepository<Task, String> {
    
    /**
     * Find a task by ID and user.
     *
     * @param id The task ID
     * @param user The user
     * @return Optional containing the task if found
     */
    Optional<Task> findByIdAndUser(String id, User user);
    
    /**
     * Find tasks by user ordered by due date and creation date.
     *
     * @param user The user
     * @return List of tasks
     */
    List<Task> findByUserOrderByDueDateAscCreatedAtDesc(User user);
    
    /**
     * Find tasks by user and completion status ordered by due date and creation date.
     *
     * @param user The user
     * @param isCompleted The completion status
     * @return List of tasks
     */
    List<Task> findByUserAndIsCompletedOrderByDueDateAscCreatedAtDesc(User user, boolean isCompleted);
    
    /**
     * Find tasks by category and user ordered by due date and creation date.
     *
     * @param category The category
     * @param user The user
     * @return List of tasks
     */
    List<Task> findByCategoryAndUserOrderByDueDateAscCreatedAtDesc(Category category, User user);
    
    /**
     * Find tasks by user and due date between a range and completion status ordered by due date.
     *
     * @param user The user
     * @param start The start date-time
     * @param end The end date-time
     * @param isCompleted The completion status
     * @return List of tasks
     */
    List<Task> findByUserAndDueDateBetweenAndIsCompletedOrderByDueDateAsc(
            User user, LocalDateTime start, LocalDateTime end, boolean isCompleted);
}