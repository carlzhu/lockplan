package com.vocalclerk.domain.entities;

import jakarta.persistence.*;

/**
 * Entity for storing user settings
 */
@Entity
@Table(name = "user_settings")
public class UserSettings {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne
    @JoinColumn(name = "user_id")
    private User user;
    
    @Column(name = "username", unique = true)
    private String username;
    
    @Column(name = "dark_mode")
    private boolean darkMode;
    
    @Column(name = "notifications_enabled")
    private boolean notificationsEnabled;
    
    @Column(name = "preferred_language")
    private String preferredLanguage;
    
    @Column(name = "ai_model")
    private String aiModel;
    
    @Column(name = "biometric_auth_enabled")
    private boolean biometricAuthEnabled;
    
    @Column(name = "data_backup_enabled")
    private boolean dataBackupEnabled;
    
    @Column(name = "reminder_lead_time")
    private int reminderLeadTime;
    
    // Default constructor
    public UserSettings() {
    }
    
    // Constructor with fields
    public UserSettings(String username, String aiModel) {
        this.username = username;
        this.aiModel = aiModel;
    }
    
    // Getters and setters
    public Long getId() {
        return id;
    }
    
    public void setId(Long id) {
        this.id = id;
    }
    
    public User getUser() {
        return user;
    }
    
    public void setUser(User user) {
        this.user = user;
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
    
    public boolean isDarkMode() {
        return darkMode;
    }
    
    public void setDarkMode(boolean darkMode) {
        this.darkMode = darkMode;
    }
    
    public boolean isNotificationsEnabled() {
        return notificationsEnabled;
    }
    
    public void setNotificationsEnabled(boolean notificationsEnabled) {
        this.notificationsEnabled = notificationsEnabled;
    }
    
    public String getPreferredLanguage() {
        return preferredLanguage;
    }
    
    public void setPreferredLanguage(String preferredLanguage) {
        this.preferredLanguage = preferredLanguage;
    }
    
    public boolean isBiometricAuthEnabled() {
        return biometricAuthEnabled;
    }
    
    public void setBiometricAuthEnabled(boolean biometricAuthEnabled) {
        this.biometricAuthEnabled = biometricAuthEnabled;
    }
    
    public boolean isDataBackupEnabled() {
        return dataBackupEnabled;
    }
    
    public void setDataBackupEnabled(boolean dataBackupEnabled) {
        this.dataBackupEnabled = dataBackupEnabled;
    }
    
    public int getReminderLeadTime() {
        return reminderLeadTime;
    }
    
    public void setReminderLeadTime(int reminderLeadTime) {
        this.reminderLeadTime = reminderLeadTime;
    }
}
