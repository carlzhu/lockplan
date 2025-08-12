package com.vocalclerk.api.dtos;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for JWT authentication response.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class JwtAuthResponse {
    
    private String accessToken;
    private String tokenType = "Bearer";
    private long expiresIn;
    private UserDto user;
}