package com.vocalclerk.application.services.impl;

import com.vocalclerk.api.dto.UserSettingsDTO;
import com.vocalclerk.application.services.UserSettingsService;
import com.vocalclerk.domain.entities.User;
import com.vocalclerk.domain.entities.UserSettings;
import com.vocalclerk.infrastructure.repositories.UserRepository;
import com.vocalclerk.infrastructure.repositories.UserSettingsRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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
    
    @Override
    @Transactional
    public UserSettingsDTO updateAiModel(String username, String aiModel) {
        logger.info("Updating AI model for user {} to {}", username, aiModel);
        
        // Find existing settings or create new ones
        Optional<UserSettings> existingSettings = userSettingsRepository.findByUsername(username);
        
        UserSettings settings;
        if (existingSettings.isPresent()) {
            settings = existingSettings.get();
            settings.setAiModel(aiModel);
        } else {
            // Try to find user
            User user = userRepository.findByUsername(username)
                    .orElse(null);
            
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
            }
        }
        
        // Save the settings
        settings = userSettingsRepository.save(settings);
        
        // Return the updated settings as DTO
        return convertToDTO(settings);
    }
    
    @Override
    public UserSettingsDTO getAiModel(String username) {
        logger.info("Getting AI model for user {}", username);
        
        // Find existing settings or return default
        Optional<UserSettings> existingSettings = userSettingsRepository.findByUsername(username);
        
        if (existingSettings.isPresent()) {
            return convertToDTO(existingSettings.get());
        } else {
            // Return default settings
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
}
