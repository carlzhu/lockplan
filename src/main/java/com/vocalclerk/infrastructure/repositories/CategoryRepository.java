package com.vocalclerk.infrastructure.repositories;

import com.vocalclerk.domain.entities.Category;
import com.vocalclerk.domain.entities.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Repository for Category entity operations.
 */
@Repository
public interface CategoryRepository extends JpaRepository<Category, UUID> {
    
    /**
     * Find a category by ID and user.
     *
     * @param id The category ID
     * @param user The user
     * @return Optional containing the category if found
     */
    Optional<Category> findByIdAndUser(UUID id, User user);
    
    /**
     * Find categories by user.
     *
     * @param user The user
     * @return List of categories
     */
    List<Category> findByUser(User user);
    
    /**
     * Find a category by name and user.
     *
     * @param name The category name
     * @param user The user
     * @return Optional containing the category if found
     */
    Optional<Category> findByNameAndUser(String name, User user);
    
    /**
     * Find a category by user and default status.
     *
     * @param user The user
     * @param isDefault Whether the category is default
     * @return Optional containing the category if found
     */
    Optional<Category> findByUserAndIsDefault(User user, boolean isDefault);
}