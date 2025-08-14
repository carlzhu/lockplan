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
        return "你是一个任务提取助手，请从以下文本中提取任务信息，并按照指定格式返回JSON数组。\n\n" +
                "请提取以下信息：\n" +
                "1. 任务标题：简洁明了地概括任务\n" +
                "2. 任务描述：详细说明任务内容\n" +
                "3. 截止日期：如果文本中提到了具体日期或时间，请转换为ISO格式的日期时间；如果没有明确提到，则设置为当前时间后24小时\n" +
                "4. 提醒时间：如果文本中提到了提醒时间，请转换为ISO格式；如果没有明确提到，则设置为截止日期前15分钟\n" +
                "5. 优先级：根据文本内容判断任务优先级（LOW、MEDIUM、HIGH、URGENT）\n" +
                "6. 分类：根据任务内容确定适当的分类\n" +
                "7. 标签：提取相关的关键词作为标签\n\n" +
                
                "返回格式必须是一个JSON数组，每个任务是一个对象，结构如下：\n" +
                "[\n" +
                "  {\n" +
                "    \"title\": \"任务标题\",\n" +
                "    \"description\": \"任务详细描述\",\n" +
                "    \"dueDate\": \"YYYY-MM-DDThh:mm:ss\",\n" +
                "    \"reminderTime\": \"YYYY-MM-DDThh:mm:ss\",\n" +
                "    \"priority\": \"LOW|MEDIUM|HIGH|URGENT\",\n" +
                "    \"category\": \"分类名称\",\n" +
                "    \"tags\": [\"标签1\", \"标签2\"]\n" +
                "  }\n" +
                "]\n\n" +
                
                "请只返回JSON数组，不要包含其他解释文本。\n\n" +
                "文本: " + inputText;
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
        
        // Create a message with the prompt
        Map<String, Object> message = new HashMap<>();
        message.put("role", "user");
        message.put("content", prompt);
        
        // Add message to messages array
        List<Map<String, Object>> messages = new ArrayList<>();
        messages.add(message);
        
        // Add messages to request body - this is required by Qianwen API
        requestBody.put("messages", messages);
        
        // Set parameters for better task extraction
        requestBody.put("temperature", 0.2);
        requestBody.put("top_p", 0.8);
        
        logger.debug("Sending request to Qianwen API: {}", requestBody);

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
            logger.debug("Raw response from Qianwen: {}", response);
            
            // Clean up the response to extract just the JSON array
            String cleanedResponse = response.trim();
            
            // Handle markdown code blocks that might be in the response
            if (cleanedResponse.contains("```json")) {
                int startIndex = cleanedResponse.indexOf("```json") + 7;
                int endIndex = cleanedResponse.indexOf("```", startIndex);
                if (endIndex > startIndex) {
                    cleanedResponse = cleanedResponse.substring(startIndex, endIndex).trim();
                }
            } else if (cleanedResponse.contains("```")) {
                int startIndex = cleanedResponse.indexOf("```") + 3;
                int endIndex = cleanedResponse.indexOf("```", startIndex);
                if (endIndex > startIndex) {
                    cleanedResponse = cleanedResponse.substring(startIndex, endIndex).trim();
                }
            }
            
            // Find the JSON array in the cleaned response
            int startIndex = cleanedResponse.indexOf('[');
            int endIndex = cleanedResponse.lastIndexOf(']') + 1;
            
            if (startIndex >= 0 && endIndex > startIndex) {
                String jsonArray = cleanedResponse.substring(startIndex, endIndex);
                logger.debug("Extracted JSON array: {}", jsonArray);
                return objectMapper.readValue(jsonArray, new TypeReference<List<Map<String, Object>>>() {});
            } else {
                logger.warn("Could not find JSON array in response: {}", cleanedResponse);
                return fallbackProcessing(cleanedResponse);
            }
        } catch (JsonProcessingException e) {
            logger.error("Error parsing Qianwen response", e);
            return fallbackProcessing(response);
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
        String title = inputText.length() > 100 ? inputText.substring(0, 97) + "..." : inputText;
        
        // Clean up the title if it contains markdown or code formatting
        title = title.replaceAll("```.*?```", "").trim();
        title = title.replaceAll("[\\[\\]{}\"']", "").trim();
        
        task.put("title", title);
        task.put("description", inputText);
        
        // Set due date to tomorrow
        java.time.LocalDateTime tomorrow = java.time.LocalDateTime.now().plusDays(1);
        task.put("dueDate", tomorrow.toString());
        
        // Set reminder time to 15 minutes before due date
        task.put("reminderTime", tomorrow.minusMinutes(15).toString());
        
        task.put("priority", "MEDIUM");
        task.put("category", "General");
        
        // Extract potential tags from the input text
        List<String> tags = new ArrayList<>();
        String[] words = inputText.split("\\s+");
        for (String word : words) {
            if (word.length() > 4 && Character.isUpperCase(word.charAt(0))) {
                tags.add(word.replaceAll("[^a-zA-Z0-9]", ""));
            }
        }
        if (!tags.isEmpty()) {
            task.put("tags", tags.subList(0, Math.min(tags.size(), 3)));
        }
        
        result.add(task);
        return result;
    }
}