package com.vocalclerk.api.dtos;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for user login requests.
 * The usernameOrEmail field accepts either a username or an email address.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class LoginRequest {
    
    @NotBlank(message = "Username or email is required")
    private String username; // This field accepts either username or email
    
    @NotBlank(message = "Password is required")
    private String password;
    
    /**
     * Gets the username or email.
     * 
     * @return The username or email
     */
    public String getUsername() {
        return username;
    }
    
    /**
     * Sets the username or email.
     * 
     * @param username The username or email
     */
    public void setUsername(String username) {
        this.username = username;
    }
    
    /**
     * Alias for getUsername() to make the API more intuitive.
     * 
     * @return The username or email
     */
    public String getUsernameOrEmail() {
        return username;
    }
    
    /**
     * Alias for setUsername() to make the API more intuitive.
     * 
     * @param usernameOrEmail The username or email
     */
    public void setUsernameOrEmail(String usernameOrEmail) {
        this.username = usernameOrEmail;
    }
}
