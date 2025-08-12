package com.vocalclerk.application.services;

import com.vocalclerk.api.dtos.JwtAuthResponse;
import com.vocalclerk.api.dtos.LoginRequest;
import com.vocalclerk.api.dtos.RegisterRequest;
import com.vocalclerk.api.dtos.UserDto;
import com.vocalclerk.api.dtos.UserSettingsDto;
import com.vocalclerk.application.interfaces.IAuthService;
import com.vocalclerk.domain.entities.User;
import com.vocalclerk.domain.entities.UserSettings;
import com.vocalclerk.infrastructure.repositories.UserRepository;
import com.vocalclerk.infrastructure.security.JwtTokenProvider;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

/**
 * Implementation of the authentication service interface.
 */
@Service
public class AuthService implements IAuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider tokenProvider;
    
    @Value("${jwt.expiration}")
    private long jwtExpirationMs;

    @Autowired
    public AuthService(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            AuthenticationManager authenticationManager,
            JwtTokenProvider tokenProvider) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.authenticationManager = authenticationManager;
        this.tokenProvider = tokenProvider;
    }

    @Override
    @Transactional
    public UserDto register(RegisterRequest registerRequest) {
        // Check if username is already taken
        if (userRepository.existsByUsername(registerRequest.getUsername())) {
            throw new IllegalArgumentException("Username is already taken");
        }
        
        // Check if email is already taken
        if (userRepository.existsByEmail(registerRequest.getEmail())) {
            throw new IllegalArgumentException("Email is already taken");
        }
        
        // Create new user
        User user = new User();
        user.setUsername(registerRequest.getUsername());
        user.setEmail(registerRequest.getEmail());
        user.setPasswordHash(passwordEncoder.encode(registerRequest.getPassword()));
        user.setCreatedAt(LocalDateTime.now());
        user.setLastLoginAt(LocalDateTime.now());
        
        // Create default user settings
        UserSettings settings = new UserSettings();
        settings.setUser(user);
        settings.setDarkMode(false);
        settings.setNotificationsEnabled(true);
        settings.setPreferredLanguage("en");
        settings.setAiModel("ollama");
        settings.setBiometricAuthEnabled(false);
        settings.setDataBackupEnabled(true);
        settings.setReminderLeadTime(15);
        
        user.setSettings(settings);
        
        User savedUser = userRepository.save(user);
        
        return convertToDto(savedUser);
    }

    @Override
    public JwtAuthResponse login(LoginRequest loginRequest) {
        // Try to find user by username or email to determine the correct identifier to use
        String loginIdentifier = loginRequest.getUsername();
        User user = userRepository.findByUsername(loginIdentifier)
                .orElse(null);
        
        if (user == null) {
            // If not found by username, check if it's an email
            user = userRepository.findByEmail(loginIdentifier)
                    .orElse(null);
        }
        
        // Authenticate with the appropriate identifier
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        user != null ? user.getUsername() : loginIdentifier, // Always use username for authentication
                        loginRequest.getPassword()
                )
        );
        
        SecurityContextHolder.getContext().setAuthentication(authentication);
        
        String jwt = tokenProvider.generateToken(authentication);
        
        // Get the authenticated user
        // Note: We don't need to update last login time here as it's handled by JwtAuthenticationFilter
        String username = authentication.getName();
        User authenticatedUser = userRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        
        return new JwtAuthResponse(
                jwt,
                "Bearer",
                jwtExpirationMs / 1000,
                convertToDto(authenticatedUser)
        );
    }

    @Override
    public JwtAuthResponse refreshToken(String refreshToken) {
        // Validate the refresh token
        if (!tokenProvider.validateToken(refreshToken)) {
            throw new IllegalArgumentException("Invalid refresh token");
        }
        
        // Get username from token
        String username = tokenProvider.getUsernameFromToken(refreshToken);
        
        // Get user
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        
        // Create authentication object
        Authentication authentication = tokenProvider.getAuthentication(refreshToken);
        
        // Generate new token
        String newToken = tokenProvider.generateToken(authentication);
        
        return new JwtAuthResponse(
                newToken,
                "Bearer",
                jwtExpirationMs / 1000,
                convertToDto(user)
        );
    }
    
    /**
     * Converts a User entity to a UserDto.
     *
     * @param user The user entity
     * @return The user DTO
     */
    private UserDto convertToDto(User user) {
        UserDto userDto = new UserDto();
        userDto.setId(user.getId());
        userDto.setUsername(user.getUsername());
        userDto.setEmail(user.getEmail());
        userDto.setCreatedAt(user.getCreatedAt());
        userDto.setLastLoginAt(user.getLastLoginAt());
        
        if (user.getSettings() != null) {
            UserSettingsDto settingsDto = new UserSettingsDto();
            settingsDto.setId(user.getSettings().getId());
            settingsDto.setDarkMode(user.getSettings().isDarkMode());
            settingsDto.setNotificationsEnabled(user.getSettings().isNotificationsEnabled());
            settingsDto.setPreferredLanguage(user.getSettings().getPreferredLanguage());
            settingsDto.setAiModel(user.getSettings().getAiModel());
            settingsDto.setBiometricAuthEnabled(user.getSettings().isBiometricAuthEnabled());
            settingsDto.setDataBackupEnabled(user.getSettings().isDataBackupEnabled());
            settingsDto.setReminderLeadTime(user.getSettings().getReminderLeadTime());
            
            userDto.setSettings(settingsDto);
        }
        
        return userDto;
    }
}