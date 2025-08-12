package com.vocalclerk.infrastructure.repositories;

import com.vocalclerk.domain.entities.Tag;
import com.vocalclerk.domain.entities.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Repository for Tag entity operations.
 */
@Repository
public interface TagRepository extends JpaRepository<Tag, UUID> {
    
    /**
     * Find a tag by ID and user.
     *
     * @param id The tag ID
     * @param user The user
     * @return Optional containing the tag if found
     */
    Optional<Tag> findByIdAndUser(UUID id, User user);
    
    /**
     * Find tags by user.
     *
     * @param user The user
     * @return List of tags
     */
    List<Tag> findByUser(User user);
    
    /**
     * Find a tag by name and user.
     *
     * @param name The tag name
     * @param user The user
     * @return Optional containing the tag if found
     */
    Optional<Tag> findByNameAndUser(String name, User user);
}