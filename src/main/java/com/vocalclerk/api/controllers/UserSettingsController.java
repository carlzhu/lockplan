package com.vocalclerk.api.controllers;

import com.vocalclerk.api.dto.UserSettingsDTO;
import com.vocalclerk.application.services.UserSettingsService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

/**
 * Controller for handling user settings
 */
@RestController
@RequestMapping("/api/user/settings")
public class UserSettingsController {

    private static final Logger logger = LoggerFactory.getLogger(UserSettingsController.class);
    
    @Autowired
    private UserSettingsService userSettingsService;

    /**
     * Check if the settings endpoint is available
     * This is used by the frontend to determine if it should try to update settings
     */
    @GetMapping("/check")
    public ResponseEntity<Void> checkEndpoint() {
        logger.info("Settings endpoint check");
        return ResponseEntity.ok().build();
    }

    /**
     * Update the AI model setting for the current user
     */
    @PostMapping("/ai-model")
    public ResponseEntity<UserSettingsDTO> updateAiModel(
            @RequestBody UserSettingsDTO settingsDTO,
            Authentication authentication) {
        
        String username = authentication.getName();
        logger.info("Updating AI model for user {}: {}", username, settingsDTO.getAiModel());
        
        UserSettingsDTO updatedSettings = userSettingsService.updateAiModel(username, settingsDTO.getAiModel());
        return ResponseEntity.ok(updatedSettings);
    }

    /**
     * Get the current AI model setting for the user
     */
    @GetMapping("/ai-model")
    public ResponseEntity<UserSettingsDTO> getAiModel(Authentication authentication) {
        String username = authentication.getName();
        logger.info("Getting AI model for user {}", username);
        
        UserSettingsDTO settings = userSettingsService.getAiModel(username);
        return ResponseEntity.ok(settings);
    }
}