package com.vocalclerk.application.interfaces;

import com.vocalclerk.api.dtos.JwtAuthResponse;
import com.vocalclerk.api.dtos.LoginRequest;
import com.vocalclerk.api.dtos.RegisterRequest;
import com.vocalclerk.api.dtos.UserDto;

/**
 * Interface for authentication service operations.
 */
public interface IAuthService {
    
    /**
     * Registers a new user.
     *
     * @param registerRequest The registration request
     * @return The created user DTO
     */
    UserDto register(RegisterRequest registerRequest);
    
    /**
     * Authenticates a user and generates a JWT token.
     * The user can be authenticated using either username or email.
     *
     * @param loginRequest The login request containing username/email and password
     * @return The JWT authentication response with token and user details
     */
    JwtAuthResponse login(LoginRequest loginRequest);
    
    /**
     * Refreshes an expired JWT token.
     *
     * @param refreshToken The refresh token
     * @return The new JWT authentication response
     */
    JwtAuthResponse refreshToken(String refreshToken);
}