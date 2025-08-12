package com.vocalclerk.domain.entities;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * Entity representing a user in the system.
 * Includes account security features like failed login tracking and account locking.
 */
@Entity
@Table(name = "users")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class User {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    
    @Column(nullable = false, unique = true)
    private String username;
    
    @Column(nullable = false, unique = true)
    private String email;
    
    @Column(nullable = false)
    private String passwordHash;
    
    @Column(nullable = false)
    private LocalDateTime createdAt;
    
    @Column(nullable = false)
    private LocalDateTime lastLoginAt;
    
    @Column(nullable = false)
    private int failedLoginAttempts = 0;
    
    @Column(nullable = true)
    private LocalDateTime lockedUntil;
    
    @Column(nullable = false)
    private boolean accountLocked = false;
    
    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Task> tasks = new ArrayList<>();
    
    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Category> categories = new ArrayList<>();
    
    @OneToOne(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    private UserSettings settings;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        lastLoginAt = LocalDateTime.now();
        failedLoginAttempts = 0;
        accountLocked = false;
    }
    
    /**
     * Increments the failed login attempts counter and locks the account if necessary.
     * 
     * @param maxAttempts The maximum number of allowed failed attempts
     * @param lockDurationMinutes The duration in minutes for which the account should be locked
     * @return true if the account is now locked, false otherwise
     */
    public boolean registerFailedLogin(int maxAttempts, int lockDurationMinutes) {
        failedLoginAttempts++;
        
        if (failedLoginAttempts >= maxAttempts) {
            accountLocked = true;
            lockedUntil = LocalDateTime.now().plusMinutes(lockDurationMinutes);
            return true;
        }
        
        return false;
    }
    
    /**
     * Resets the failed login attempts counter.
     */
    public void resetFailedLoginAttempts() {
        failedLoginAttempts = 0;
    }
    
    /**
     * Checks if the account is currently locked.
     * 
     * @return true if the account is locked, false otherwise
     */
    public boolean isAccountLocked() {
        if (accountLocked && lockedUntil != null) {
            // If lock duration has expired, unlock the account
            if (LocalDateTime.now().isAfter(lockedUntil)) {
                accountLocked = false;
                lockedUntil = null;
                return false;
            }
            return true;
        }
        return false;
    }
    
    /**
     * Gets the remaining lock time in minutes.
     * 
     * @return The remaining lock time in minutes, or 0 if the account is not locked
     */
    public long getRemainingLockTimeMinutes() {
        if (!accountLocked || lockedUntil == null) {
            return 0;
        }
        
        LocalDateTime now = LocalDateTime.now();
        if (now.isAfter(lockedUntil)) {
            return 0;
        }
        
        return java.time.Duration.between(now, lockedUntil).toMinutes();
    }
}