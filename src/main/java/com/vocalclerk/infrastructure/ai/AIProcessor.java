package com.vocalclerk.infrastructure.ai;

import java.util.List;
import java.util.Map;

/**
 * Interface for AI processing operations.
 */
public interface AIProcessor {
    
    /**
     * Process raw input text to extract tasks.
     *
     * @param inputText The raw input text
     * @return List of extracted task data as maps
     */
    List<Map<String, Object>> processInput(String inputText);
}