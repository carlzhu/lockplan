package com.vocalclerk.api.dto;

/**
 * Data Transfer Object for user settings
 */
public class UserSettingsDTO {
    private Long id;
    private String username;
    private String aiModel;
    private Boolean darkMode;
    private Boolean notificationsEnabled;
    private String preferredLanguage;
    private Boolean biometricAuthEnabled;
    private Boolean dataBackupEnabled;
    private Integer reminderLeadTime;

    public UserSettingsDTO() {
    }

    public UserSettingsDTO(String aiModel) {
        this.aiModel = aiModel;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getAiModel() {
        return aiModel;
    }

    public void setAiModel(String aiModel) {
        this.aiModel = aiModel;
    }

    public Boolean getDarkMode() {
        return darkMode;
    }

    public void setDarkMode(Boolean darkMode) {
        this.darkMode = darkMode;
    }

    public Boolean getNotificationsEnabled() {
        return notificationsEnabled;
    }

    public void setNotificationsEnabled(Boolean notificationsEnabled) {
        this.notificationsEnabled = notificationsEnabled;
    }

    public String getPreferredLanguage() {
        return preferredLanguage;
    }

    public void setPreferredLanguage(String preferredLanguage) {
        this.preferredLanguage = preferredLanguage;
    }

    public Boolean getBiometricAuthEnabled() {
        return biometricAuthEnabled;
    }

    public void setBiometricAuthEnabled(Boolean biometricAuthEnabled) {
        this.biometricAuthEnabled = biometricAuthEnabled;
    }

    public Boolean getDataBackupEnabled() {
        return dataBackupEnabled;
    }

    public void setDataBackupEnabled(Boolean dataBackupEnabled) {
        this.dataBackupEnabled = dataBackupEnabled;
    }

    public Integer getReminderLeadTime() {
        return reminderLeadTime;
    }

    public void setReminderLeadTime(Integer reminderLeadTime) {
        this.reminderLeadTime = reminderLeadTime;
    }
}
