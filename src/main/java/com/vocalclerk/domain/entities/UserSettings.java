package com.vocalclerk.domain.entities;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

/**
 * Entity representing user settings in the system.
 */
@Entity
@Table(name = "user_settings")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserSettings {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    
    @OneToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;
    
    @Column(nullable = false)
    private boolean darkMode = false;
    
    @Column(nullable = false)
    private boolean notificationsEnabled = true;
    
    @Column(nullable = false)
    private String preferredLanguage = "en";
    
    @Column(nullable = false)
    private String aiModel = "ollama"; // ollama or qianwen
    
    @Column(nullable = false)
    private boolean biometricAuthEnabled = false;
    
    @Column(nullable = false)
    private boolean dataBackupEnabled = true;
    
    @Column(nullable = false)
    private int reminderLeadTime = 15; // minutes before task due time
}