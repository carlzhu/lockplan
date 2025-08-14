package com.vocalclerk.application.services;

import com.vocalclerk.api.dto.UserSettingsDTO;

/**
 * Service for managing user settings
 */
public interface UserSettingsService {
    
    /**
     * Update the AI model setting for a user
     * 
     * @param username The username of the user
     * @param aiModel The AI model to set
     * @return The updated settings
     */
    UserSettingsDTO updateAiModel(String username, String aiModel);
    
    /**
     * Get the current AI model setting for a user
     * 
     * @param username The username of the user
     * @return The current settings
     */
    UserSettingsDTO getAiModel(String username);
    
    /**
     * Update all user settings
     * 
     * @param username The username of the user
     * @param settingsDTO The settings to update
     * @return The updated settings
     */
    UserSettingsDTO updateSettings(String username, UserSettingsDTO settingsDTO);
    
    /**
     * Get all user settings
     * 
     * @param username The username of the user
     * @return The current settings
     */
    UserSettingsDTO getSettings(String username);
}
