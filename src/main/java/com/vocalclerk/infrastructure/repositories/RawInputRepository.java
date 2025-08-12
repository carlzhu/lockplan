package com.vocalclerk.infrastructure.repositories;

import com.vocalclerk.domain.entities.RawInput;
import com.vocalclerk.domain.entities.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

/**
 * Repository for RawInput entity operations.
 */
@Repository
public interface RawInputRepository extends JpaRepository<RawInput, UUID> {
    
    /**
     * Find raw inputs by user ordered by creation date.
     *
     * @param user The user
     * @return List of raw inputs
     */
    List<RawInput> findByUserOrderByCreatedAtDesc(User user);
}