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
 * Implementation of AIProcessor using Qianwen.
 */
@Service
public class QianwenAIProcessor implements AIProcessor {

    private static final Logger logger = LoggerFactory.getLogger(QianwenAIProcessor.class);
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;
    
    @Value("${ai.qianwen.url}")
    private String qianwenUrl;
    
    @Value("${ai.qianwen.apiKey}")
    private String apiKey;

    public QianwenAIProcessor() {
        this.restTemplate = new RestTemplate();
        this.objectMapper = new ObjectMapper();
    }

    @Override
    public List<Map<String, Object>> processInput(String inputText) {
        try {
            String prompt = buildPrompt(inputText);
            String response = callQianwenAPI(prompt);
            return parseResponse(response);
        } catch (Exception e) {
            logger.error("Error processing input with Qianwen", e);
            return fallbackProcessing(inputText);
        }
    }

    /**
     * Builds the prompt for the Qianwen API.
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
     * Calls the Qianwen API.
     *
     * @param prompt The prompt to send
     * @return The API response
     */
    private String callQianwenAPI(String prompt) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("Authorization", "Bearer " + apiKey);

        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("model", "qwen-max");
        
        Map<String, Object> message = new HashMap<>();
        message.put("role", "user");
        message.put("content", prompt);
        
        List<Map<String, Object>> messages = new ArrayList<>();
        messages.add(message);
        
        requestBody.put("messages", messages);
        requestBody.put("temperature", 0.2);
        requestBody.put("top_p", 0.8);

        HttpEntity<Map<String, Object>> request = new HttpEntity<>(requestBody, headers);
        ResponseEntity<Map> response = restTemplate.postForEntity(qianwenUrl, request, Map.class);
        
        Map<String, Object> responseBody = response.getBody();
        Map<String, Object> choices = (Map<String, Object>) ((List<?>) responseBody.get("choices")).get(0);
        Map<String, Object> responseMessage = (Map<String, Object>) choices.get("message");
        
        return (String) responseMessage.get("content");
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
            logger.error("Error parsing Qianwen response", e);
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