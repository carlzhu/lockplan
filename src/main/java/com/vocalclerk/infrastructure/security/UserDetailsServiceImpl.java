package com.vocalclerk.infrastructure.security;

import com.vocalclerk.domain.entities.User;
import com.vocalclerk.infrastructure.repositories.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.LockedException;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Implementation of UserDetailsService for Spring Security.
 * This service loads user-specific data for authentication and authorization.
 */
@Service
public class UserDetailsServiceImpl implements UserDetailsService {

    private final UserRepository userRepository;
    
    @Value("${security.max-failed-attempts:5}")
    private int maxFailedAttempts;
    
    @Value("${security.account-lock-duration:30}")
    private int accountLockDurationMinutes;

    @Autowired
    public UserDetailsServiceImpl(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        // Try to find user by username
        User user = userRepository.findByUsername(username)
                .orElse(null);
        
        // If not found by username, try by email
        if (user == null) {
            user = userRepository.findByEmail(username)
                    .orElseThrow(() -> new UsernameNotFoundException("User not found with username or email: " + username));
        }
        
        // Check if account is locked
        if (user.isAccountLocked()) {
            long remainingLockTime = user.getRemainingLockTimeMinutes();
            throw new LockedException("Account is locked. Please try again in " + remainingLockTime + " minutes.");
        }

        // Create authorities list (roles)
        List<SimpleGrantedAuthority> authorities = new ArrayList<>();
        authorities.add(new SimpleGrantedAuthority("ROLE_USER"));
        
        // Add admin role if username is admin (this is just an example, in a real app you'd have a proper role system)
        if ("admin".equals(user.getUsername())) {
            authorities.add(new SimpleGrantedAuthority("ROLE_ADMIN"));
        }

        return new org.springframework.security.core.userdetails.User(
                user.getUsername(),
                user.getPasswordHash(),
                authorities
        );
    }
    
    /**
     * Updates the last login time for a user and resets failed login attempts.
     * 
     * @param username The username of the user
     */
    @Transactional
    public void updateLastLogin(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("User not found with username: " + username));
        
        user.setLastLoginAt(LocalDateTime.now());
        user.resetFailedLoginAttempts();
        userRepository.save(user);
    }
    
    /**
     * Registers a failed login attempt for a user.
     * 
     * @param username The username of the user
     * @return true if the account is now locked, false otherwise
     */
    @Transactional
    public boolean registerFailedLogin(String username) {
        try {
            User user = userRepository.findByUsername(username)
                    .orElse(null);
            
            if (user == null) {
                user = userRepository.findByEmail(username)
                        .orElse(null);
            }
            
            if (user != null) {
                boolean locked = user.registerFailedLogin(maxFailedAttempts, accountLockDurationMinutes);
                userRepository.save(user);
                return locked;
            }
            
            return false;
        } catch (Exception e) {
            return false;
        }
    }
}
