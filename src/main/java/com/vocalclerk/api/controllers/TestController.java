package com.vocalclerk.api.controllers;

import com.vocalclerk.domain.entities.TaskPriority;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

/**
 * Controller for testing API functionality.
 */
@RestController
@RequestMapping("/test")
public class TestController {

    /**
     * Test endpoint for debugging request issues.
     */
    @PostMapping("/echo")
    public ResponseEntity<Map<String, Object>> echoRequest(@RequestBody Map<String, Object> requestBody) {
        Map<String, Object> response = new HashMap<>(requestBody);
        response.put("received", true);
        response.put("timestamp", System.currentTimeMillis());
        
        // If priority is included, try to parse it as an enum
        if (requestBody.containsKey("priority")) {
            try {
                TaskPriority priority = TaskPriority.valueOf(requestBody.get("priority").toString());
                response.put("priorityValid", true);
                response.put("priorityEnum", priority.name());
            } catch (Exception e) {
                response.put("priorityValid", false);
                response.put("priorityError", e.getMessage());
                response.put("validValues", TaskPriority.values());
            }
        }
        
        return ResponseEntity.ok(response);
    }
    
    /**
     * Test endpoint that accepts a priority enum directly.
     */
    @GetMapping("/priority/{priority}")
    public ResponseEntity<Map<String, Object>> testPriority(@PathVariable TaskPriority priority) {
        Map<String, Object> response = new HashMap<>();
        response.put("receivedPriority", priority);
        response.put("priorityName", priority.name());
        return ResponseEntity.ok(response);
    }
}