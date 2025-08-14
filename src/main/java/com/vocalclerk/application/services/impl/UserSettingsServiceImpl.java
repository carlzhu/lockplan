package com.vocalclerk.application.services.impl;

import com.vocalclerk.api.dto.UserSettingsDTO;
import com.vocalclerk.application.services.UserSettingsService;
import com.vocalclerk.domain.entities.User;
import com.vocalclerk.domain.entities.UserSettings;
import com.vocalclerk.infrastructure.repositories.UserRepository;
import com.vocalclerk.infrastructure.repositories.UserSettingsRepository;
import jakarta.persistence.EntityManager;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

/**
 * Implementation of the UserSettingsService
 */
@Service
public class UserSettingsServiceImpl implements UserSettingsService {

    private static final Logger logger = LoggerFactory.getLogger(UserSettingsServiceImpl.class);
    
    @Autowired
    private UserSettingsRepository userSettingsRepository;
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private EntityManager entityManager;
    
    /**
     * Initialize the service and clean up any duplicate settings
     */
    @jakarta.annotation.PostConstruct
    public void init() {
        try {
            logger.info("Initializing UserSettingsService and checking for duplicate settings");
            // Run cleanup in a separate transaction
            cleanupDuplicateSettings();
        } catch (Exception e) {
            logger.error("Error during initialization: {}", e.getMessage(), e);
        }
    }
    
    /**
     * Clean up duplicate UserSettings records
     */
    @Transactional
    public void cleanupDuplicateSettings() {
        logger.info("Checking for duplicate UserSettings records");
        
        try {
            // Get all users
            List<User> users = userRepository.findAll();
            
            for (User user : users) {
                try {
                    String username = user.getUsername();
                    
                    // Make sure the user has settings with the correct username
                    if (user.getSettings() != null) {
                        UserSettings settings = user.getSettings();
                        if (!username.equals(settings.getUsername())) {
                            logger.info("Updating username in settings for user {}", username);
                            settings.setUsername(username);
                            userSettingsRepository.save(settings);
                        }
                    }
                } catch (Exception e) {
                    logger.error("Error processing user {}: {}", user.getId(), e.getMessage());
                    // Continue with next user
                }
            }
            
            logger.info("Settings cleanup completed");
        } catch (Exception e) {
            logger.error("Error cleaning up settings: {}", e.getMessage(), e);
        }
    }
    
    @Override
    @Transactional
    public UserSettingsDTO updateAiModel(String username, String aiModel) {
        logger.info("Updating AI model for user {} to {}", username, aiModel);
        
        try {
            // Find existing settings or create new ones
            Optional<UserSettings> existingSettings = userSettingsRepository.findByUsername(username);
            
            UserSettings settings;
            if (existingSettings.isPresent()) {
                logger.info("Found existing settings by username for {}", username);
                settings = existingSettings.get();
                
                // Check if there are duplicate settings for this user
                User user = userRepository.findByUsername(username).orElse(null);
                if (user != null && user.getSettings() != null && !user.getSettings().getId().equals(settings.getId())) {
                    logger.warn("Found duplicate settings for user {}. Using the one linked to the user entity.", username);
                    settings = user.getSettings();
                    // Update username to ensure it can be found next time
                    settings.setUsername(username);
                }
                
                settings.setAiModel(aiModel);
            } else {
                logger.info("No settings found by username for {}", username);
                // Try to find user
                User user = userRepository.findByUsername(username).orElse(null);
                
                if (user != null && user.getSettings() != null) {
                    // If user has settings but they weren't found by username, use those
                    logger.info("Using existing settings from user entity for {}", username);
                    settings = user.getSettings();
                    settings.setUsername(username); // Update username to ensure it can be found next time
                    settings.setAiModel(aiModel);
                } else {
                    // Create new settings
                    logger.info("Creating new settings for user {}", username);
                    settings = new UserSettings();
                    settings.setUsername(username);
                    settings.setAiModel(aiModel);
                    
                    // Set default values for other fields
                    settings.setDarkMode(false);
                    settings.setNotificationsEnabled(true);
                    settings.setPreferredLanguage("en");
                    settings.setBiometricAuthEnabled(false);
                    settings.setDataBackupEnabled(true);
                    settings.setReminderLeadTime(15);
                    
                    // Link to user if found
                    if (user != null) {
                        settings.setUser(user);
                        user.setSettings(settings); // Ensure bidirectional relationship
                        userRepository.save(user);
                    }
                }
            }
            
            // Save the settings
            logger.info("Saving settings to database");
            settings = userSettingsRepository.save(settings);
            logger.info("Settings saved successfully with ID: {}", settings.getId());
            
            // Return the updated settings as DTO
            return convertToDTO(settings);
        } catch (Exception e) {
            logger.error("Error updating AI model for user {}: {}", username, e.getMessage(), e);
            throw e;
        }
    }
    
    @Override
    public UserSettingsDTO getAiModel(String username) {
        logger.info("Getting AI model for user {}", username);
        
        try {
            // Find existing settings by username
            Optional<UserSettings> existingSettings = userSettingsRepository.findByUsername(username);
            
            // If found by username, return those settings
            if (existingSettings.isPresent()) {
                logger.info("Found settings by username for {}", username);
                return convertToDTO(existingSettings.get());
            }
            
            // If not found by username, try to get from user entity
            User user = userRepository.findByUsername(username).orElse(null);
            if (user != null && user.getSettings() != null) {
                logger.info("Found settings from user entity for {}", username);
                
                // Update the username field to ensure it can be found next time
                UserSettings settings = user.getSettings();
                settings.setUsername(username);
                userSettingsRepository.save(settings);
                
                return convertToDTO(settings);
            }
            
            // Return default settings
            logger.info("No settings found for user {}, returning defaults", username);
            UserSettingsDTO dto = new UserSettingsDTO("qianwen");
            dto.setDarkMode(false);
            dto.setNotificationsEnabled(true);
            dto.setPreferredLanguage("en");
            dto.setBiometricAuthEnabled(false);
            dto.setDataBackupEnabled(true);
            dto.setReminderLeadTime(15);
            return dto;
        } catch (Exception e) {
            logger.error("Error getting AI model for user {}: {}", username, e.getMessage(), e);
            
            // Return default settings in case of error
            UserSettingsDTO dto = new UserSettingsDTO("qianwen");
            dto.setDarkMode(false);
            dto.setNotificationsEnabled(true);
            dto.setPreferredLanguage("en");
            dto.setBiometricAuthEnabled(false);
            dto.setDataBackupEnabled(true);
            dto.setReminderLeadTime(15);
            return dto;
        }
    }
    
    @Override
    @Transactional
    public UserSettingsDTO updateSettings(String username, UserSettingsDTO settingsDTO) {
        logger.info("Updating all settings for user {}: {}", username, settingsDTO);
        
        try {
            // Find existing settings or create new ones
            Optional<UserSettings> existingSettings = userSettingsRepository.findByUsername(username);
            
            UserSettings settings;
            if (existingSettings.isPresent()) {
                logger.info("Found existing settings for user {}", username);
                settings = existingSettings.get();
                
                // Check if there are duplicate settings for this user
                User user = userRepository.findByUsername(username).orElse(null);
                if (user != null && user.getSettings() != null && !user.getSettings().getId().equals(settings.getId())) {
                    logger.warn("Found duplicate settings for user {}. Using the one linked to the user entity.", username);
                    settings = user.getSettings();
                }
            } else {
                logger.info("Creating new settings for user {}", username);
                // Try to find user
                User user = userRepository.findByUsername(username)
                        .orElse(null);
                
                if (user == null) {
                    logger.warn("User not found: {}", username);
                } else if (user.getSettings() != null) {
                    // If user has settings but they weren't found by username, use those
                    logger.info("Using existing settings from user entity for {}", username);
                    settings = user.getSettings();
                    // Update username to ensure it can be found next time
                    settings.setUsername(username);
                    return updateSettings(username, settingsDTO); // Retry with corrected data
                }
                
                settings = new UserSettings();
                settings.setUsername(username);
                
                // Link to user if found
                if (user != null) {
                    settings.setUser(user);
                    user.setSettings(settings); // Ensure bidirectional relationship
                    userRepository.save(user);
                }
            }
            
            // Update all fields from DTO
            if (settingsDTO.getAiModel() != null) {
                logger.debug("Updating AI model to: {}", settingsDTO.getAiModel());
                settings.setAiModel(settingsDTO.getAiModel());
            }
            
            if (settingsDTO.getDarkMode() != null) {
                logger.debug("Updating dark mode to: {}", settingsDTO.getDarkMode());
                settings.setDarkMode(settingsDTO.getDarkMode());
            }
            
            if (settingsDTO.getNotificationsEnabled() != null) {
                logger.debug("Updating notifications enabled to: {}", settingsDTO.getNotificationsEnabled());
                settings.setNotificationsEnabled(settingsDTO.getNotificationsEnabled());
            }
            
            if (settingsDTO.getPreferredLanguage() != null) {
                logger.debug("Updating preferred language to: {}", settingsDTO.getPreferredLanguage());
                settings.setPreferredLanguage(settingsDTO.getPreferredLanguage());
            }
            
            if (settingsDTO.getBiometricAuthEnabled() != null) {
                logger.debug("Updating biometric auth to: {}", settingsDTO.getBiometricAuthEnabled());
                settings.setBiometricAuthEnabled(settingsDTO.getBiometricAuthEnabled());
            }
            
            if (settingsDTO.getDataBackupEnabled() != null) {
                logger.debug("Updating data backup to: {}", settingsDTO.getDataBackupEnabled());
                settings.setDataBackupEnabled(settingsDTO.getDataBackupEnabled());
            }
            
            if (settingsDTO.getReminderLeadTime() != null) {
                logger.debug("Updating reminder lead time to: {}", settingsDTO.getReminderLeadTime());
                settings.setReminderLeadTime(settingsDTO.getReminderLeadTime());
            }
            
            // Save the settings
            logger.info("Saving settings to database");
            settings = userSettingsRepository.save(settings);
            logger.info("Settings saved successfully with ID: {}", settings.getId());
            
            // Return the updated settings as DTO
            UserSettingsDTO result = convertToDTO(settings);
            logger.info("Returning updated settings: {}", result);
            return result;
        } catch (Exception e) {
            logger.error("Error updating settings for user {}: {}", username, e.getMessage(), e);
            throw e;
        }
    }
    
    @Override
    public UserSettingsDTO getSettings(String username) {
        logger.info("Getting all settings for user {}", username);
        
        try {
            // Find existing settings by username
            Optional<UserSettings> existingSettings = userSettingsRepository.findByUsername(username);
            
            // If found by username, return those settings
            if (existingSettings.isPresent()) {
                logger.info("Found settings by username for {}", username);
                return convertToDTO(existingSettings.get());
            }
            
            // If not found by username, try to get from user entity
            User user = userRepository.findByUsername(username).orElse(null);
            if (user != null && user.getSettings() != null) {
                logger.info("Found settings from user entity for {}", username);
                
                // Update the username field to ensure it can be found next time
                UserSettings settings = user.getSettings();
                settings.setUsername(username);
                userSettingsRepository.save(settings);
                
                return convertToDTO(settings);
            }
            
            // If no settings found, return default settings
            logger.info("No settings found for user {}, returning defaults", username);
            UserSettingsDTO dto = new UserSettingsDTO("qianwen");
            dto.setUsername(username);
            dto.setDarkMode(false);
            dto.setNotificationsEnabled(true);
            dto.setPreferredLanguage("en");
            dto.setBiometricAuthEnabled(false);
            dto.setDataBackupEnabled(true);
            dto.setReminderLeadTime(15);
            return dto;
        } catch (Exception e) {
            logger.error("Error getting settings for user {}: {}", username, e.getMessage(), e);
            
            // Return default settings in case of error
            UserSettingsDTO dto = new UserSettingsDTO("qianwen");
            dto.setUsername(username);
            dto.setDarkMode(false);
            dto.setNotificationsEnabled(true);
            dto.setPreferredLanguage("en");
            dto.setBiometricAuthEnabled(false);
            dto.setDataBackupEnabled(true);
            dto.setReminderLeadTime(15);
            return dto;
        }
    }
    
    /**
     * Convert entity to DTO
     */
    private UserSettingsDTO convertToDTO(UserSettings settings) {
        UserSettingsDTO dto = new UserSettingsDTO(settings.getAiModel());
        dto.setId(settings.getId());
        dto.setUsername(settings.getUsername());
        dto.setDarkMode(settings.isDarkMode());
        dto.setNotificationsEnabled(settings.isNotificationsEnabled());
        dto.setPreferredLanguage(settings.getPreferredLanguage());
        dto.setBiometricAuthEnabled(settings.isBiometricAuthEnabled());
        dto.setDataBackupEnabled(settings.isDataBackupEnabled());
        dto.setReminderLeadTime(settings.getReminderLeadTime());
        return dto;
    }
    
    /**
     * Get user settings safely, handling potential duplicate records
     * 
     * @param username The username to get settings for
     * @return The user settings, or null if not found
     */
    private UserSettings getUserSettingsSafely(String username) {
        try {
            // Try to get from user entity first (most reliable)
            User user = userRepository.findByUsername(username).orElse(null);
            if (user != null && user.getSettings() != null) {
                UserSettings settings = user.getSettings();
                // Update username if needed
                if (!username.equals(settings.getUsername())) {
                    settings.setUsername(username);
                    userSettingsRepository.save(settings);
                }
                return settings;
            }
            
            // Try to get by username
            try {
                Optional<UserSettings> existingSettings = userSettingsRepository.findByUsername(username);
                if (existingSettings.isPresent()) {
                    return existingSettings.get();
                }
            } catch (Exception e) {
                logger.warn("Error finding settings by username {}: {}", username, e.getMessage());
                // This might be the duplicate key exception, try another approach
            }
            
            // If we get here, no settings were found
            return null;
        } catch (Exception e) {
            logger.error("Error getting settings for user {}: {}", username, e.getMessage(), e);
            return null;
        }
    }
}
