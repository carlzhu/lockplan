package com.vocalclerk.infrastructure.security;

import com.vocalclerk.domain.entities.User;
import com.vocalclerk.infrastructure.repositories.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

/**
 * Component for accessing the current authenticated user.
 */
@Component
public class CurrentUser {

    private final UserRepository userRepository;

    @Autowired
    public CurrentUser(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    /**
     * Gets the current authenticated user.
     *
     * @return The user entity
     * @throws IllegalStateException if no user is authenticated or the user is not found
     */
    public User getUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new IllegalStateException("No authenticated user found");
        }

        String username = authentication.getName();
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalStateException("User not found: " + username));
    }

    /**
     * Gets the current authenticated user's ID.
     *
     * @return The user ID
     */
    public String getUserId() {
        return getUser().getId().toString();
    }
}