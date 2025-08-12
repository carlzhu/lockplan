package com.vocalclerk.api.dtos;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for user settings data.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserSettingsDto {
    
    private Long id;
    private boolean darkMode;
    private boolean notificationsEnabled;
    private String preferredLanguage;
    private String aiModel;
    private boolean biometricAuthEnabled;
    private boolean dataBackupEnabled;
    private int reminderLeadTime;
}