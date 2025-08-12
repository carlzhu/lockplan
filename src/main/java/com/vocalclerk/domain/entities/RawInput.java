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
 * Entity representing a raw input from the user in the system.
 */
@Entity
@Table(name = "raw_inputs")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class RawInput {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    
    @Column(nullable = false, length = 2000)
    private String content;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private InputType type;
    
    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;
    
    @OneToMany(mappedBy = "rawInput", cascade = CascadeType.ALL)
    private List<Task> generatedTasks = new ArrayList<>();
    
    @OneToOne(mappedBy = "rawInput", cascade = CascadeType.ALL, orphanRemoval = true)
    private AIProcessingResult processingResult;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}