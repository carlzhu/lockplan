package com.vocalclerk.api.controllers;

import com.vocalclerk.api.dtos.JwtAuthResponse;
import com.vocalclerk.api.dtos.LoginRequest;
import com.vocalclerk.api.dtos.RegisterRequest;
import com.vocalclerk.api.dtos.UserDto;
import com.vocalclerk.application.interfaces.IAuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * REST controller for authentication operations.
 */
@RestController
@RequestMapping("/auth")
@Tag(name = "Authentication", description = "Authentication endpoints")
public class AuthController {

    private final IAuthService authService;

    @Autowired
    public AuthController(IAuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    @Operation(summary = "Register user", description = "Registers a new user")
    public ResponseEntity<UserDto> register(@Valid @RequestBody RegisterRequest registerRequest) {
        UserDto userDto = authService.register(registerRequest);
        return new ResponseEntity<>(userDto, HttpStatus.CREATED);
    }

    @PostMapping("/login")
    @Operation(
        summary = "Login user", 
        description = "Authenticates a user with username or email and returns a JWT token"
    )
    public ResponseEntity<JwtAuthResponse> login(@Valid @RequestBody LoginRequest loginRequest) {
        JwtAuthResponse jwtAuthResponse = authService.login(loginRequest);
        return ResponseEntity.ok(jwtAuthResponse);
    }

    @PostMapping("/refresh")
    @Operation(summary = "Refresh token", description = "Refreshes an expired JWT token")
    public ResponseEntity<JwtAuthResponse> refreshToken(@RequestHeader("Authorization") String refreshToken) {
        JwtAuthResponse jwtAuthResponse = authService.refreshToken(refreshToken.substring(7));
        return ResponseEntity.ok(jwtAuthResponse);
    }
}