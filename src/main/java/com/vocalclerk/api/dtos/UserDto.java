package com.vocalclerk.api.dtos;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * DTO for user data.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserDto {
    
    private UUID id;
    private String username;
    private String email;
    private LocalDateTime createdAt;
    private LocalDateTime lastLoginAt;
    private UserSettingsDto settings;
}