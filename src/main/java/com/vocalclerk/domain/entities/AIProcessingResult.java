package com.vocalclerk.domain.entities;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Entity representing the result of AI processing on a raw input.
 */
@Entity
@Table(name = "ai_processing_results")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class AIProcessingResult {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    
    @OneToOne
    @JoinColumn(name = "raw_input_id", nullable = false)
    private RawInput rawInput;
    
    @Column(name = "processed_content", length = 5000)
    private String processedContent;
    
    @Column(name = "extracted_entities", length = 2000)
    private String extractedEntities;
    
    @Column(name = "processing_time_ms")
    private Long processingTimeMs;
    
    @Column(name = "ai_model_used", nullable = false)
    private String aiModelUsed;
    
    @Column(name = "confidence_score")
    private Double confidenceScore;
    
    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}