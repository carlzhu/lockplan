package com.vocalclerk.infrastructure.ai;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;

/**
 * Configuration for AI processors.
 */
@Configuration
public class AIProcessorConfig {

    @Bean
    @Primary
    public AIProcessor defaultAIProcessor() {
        // For simplicity, we'll use a simple implementation that doesn't require external services
        return new AIProcessor() {
            @Override
            public java.util.List<java.util.Map<String, Object>> processInput(String inputText) {
                java.util.List<java.util.Map<String, Object>> result = new java.util.ArrayList<>();
                java.util.Map<String, Object> task = new java.util.HashMap<>();
                
                // Create a simple task from the input
                task.put("title", inputText.length() > 100 ? inputText.substring(0, 97) + "..." : inputText);
                task.put("description", inputText);
                task.put("priority", "MEDIUM");
                task.put("category", "General");
                
                // Add some tags based on content
                java.util.List<String> tags = new java.util.ArrayList<>();
                if (inputText.toLowerCase().contains("meeting")) {
                    tags.add("meeting");
                }
                if (inputText.toLowerCase().contains("work")) {
                    tags.add("work");
                }
                if (inputText.toLowerCase().contains("idea")) {
                    tags.add("idea");
                }
                task.put("tags", tags);
                
                result.add(task);
                return result;
            }
        };
    }
}