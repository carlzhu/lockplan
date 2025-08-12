package com.vocalclerk.infrastructure.repositories;

import com.vocalclerk.domain.entities.UserSettings;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * Repository for UserSettings entity
 */
@Repository
public interface UserSettingsRepository extends JpaRepository<UserSettings, Long> {
    
    /**
     * Find settings by username
     * 
     * @param username The username to search for
     * @return Optional containing the settings if found
     */
    Optional<UserSettings> findByUsername(String username);
}