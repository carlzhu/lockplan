package com.vocalclerk.infrastructure.ai;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Implementation of AIProcessor using Ollama.
 */
@Service
public class OllamaAIProcessor implements AIProcessor {

    private static final Logger logger = LoggerFactory.getLogger(OllamaAIProcessor.class);
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;
    
    @Value("${ai.ollama.url:http://localhost:11434/api/generate}")
    private String ollamaUrl;
    
    @Value("${ai.ollama.model:llama2}")
    private String ollamaModel;

    public OllamaAIProcessor() {
        this.restTemplate = new RestTemplate();
        this.objectMapper = new ObjectMapper();
    }

    @Override
    public List<Map<String, Object>> processInput(String inputText) {
        try {
            String prompt = buildPrompt(inputText);
            String response = callOllamaAPI(prompt);
            return parseResponse(response);
        } catch (Exception e) {
            logger.error("Error processing input with Ollama", e);
            return fallbackProcessing(inputText);
        }
    }

    /**
     * Builds the prompt for the Ollama API.
     *
     * @param inputText The raw input text
     * @return The formatted prompt
     */
    private String buildPrompt(String inputText) {
        return "Extract tasks, time information, people, and categories from the following text. " +
                "Return the result as a JSON array where each item is a task with the following structure: " +
                "{\"title\": \"task title\", \"description\": \"task description\", " +
                "\"dueDate\": \"ISO date time\", \"reminderTime\": \"ISO date time\", " +
                "\"priority\": \"LOW|MEDIUM|HIGH|URGENT\", \"category\": \"category name\", " +
                "\"tags\": [\"tag1\", \"tag2\"]}\n\n" +
                "Text: " + inputText;
    }

    /**
     * Calls the Ollama API.
     *
     * @param prompt The prompt to send
     * @return The API response
     */
    private String callOllamaAPI(String prompt) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("model", ollamaModel);
        requestBody.put("prompt", prompt);
        requestBody.put("stream", false);

        HttpEntity<Map<String, Object>> request = new HttpEntity<>(requestBody, headers);
        ResponseEntity<Map> response = restTemplate.postForEntity(ollamaUrl, request, Map.class);
        
        return (String) response.getBody().get("response");
    }

    /**
     * Parses the API response into a list of task maps.
     *
     * @param response The API response
     * @return List of task maps
     */
    private List<Map<String, Object>> parseResponse(String response) {
        try {
            // Extract JSON array from the response
            int startIndex = response.indexOf('[');
            int endIndex = response.lastIndexOf(']') + 1;
            
            if (startIndex >= 0 && endIndex > startIndex) {
                String jsonArray = response.substring(startIndex, endIndex);
                return objectMapper.readValue(jsonArray, new TypeReference<List<Map<String, Object>>>() {});
            } else {
                logger.warn("Could not find JSON array in response: {}", response);
                return new ArrayList<>();
            }
        } catch (JsonProcessingException e) {
            logger.error("Error parsing Ollama response", e);
            return new ArrayList<>();
        }
    }

    /**
     * Fallback processing when the AI processing fails.
     *
     * @param inputText The raw input text
     * @return A simple task list based on the input
     */
    private List<Map<String, Object>> fallbackProcessing(String inputText) {
        List<Map<String, Object>> result = new ArrayList<>();
        Map<String, Object> task = new HashMap<>();
        
        // Create a simple task from the input
        task.put("title", inputText.length() > 100 ? inputText.substring(0, 97) + "..." : inputText);
        task.put("description", inputText);
        task.put("priority", "MEDIUM");
        task.put("category", "General");
        
        result.add(task);
        return result;
    }
}