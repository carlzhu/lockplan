package com.vocalclerk.infrastructure.ai;

import com.vocalclerk.domain.entities.User;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

/**
 * Factory for creating AIProcessor instances based on user settings.
 */
@Component
public class AIProcessorFactory {

    private final OllamaAIProcessor ollamaAIProcessor;
    private final QianwenAIProcessor qianwenAIProcessor;

    @Autowired
    public AIProcessorFactory(
            OllamaAIProcessor ollamaAIProcessor,
            QianwenAIProcessor qianwenAIProcessor) {
        this.ollamaAIProcessor = ollamaAIProcessor;
        this.qianwenAIProcessor = qianwenAIProcessor;
    }

    /**
     * Gets the appropriate AIProcessor based on user settings.
     *
     * @param user The user
     * @return The AIProcessor instance
     */
    public AIProcessor getProcessor(User user) {
        String aiModel = user.getSettings().getAiModel();

        return qianwenAIProcessor;

//        if ("qianwen".equalsIgnoreCase(aiModel)) {
//            return qianwenAIProcessor;
//        } else {
//            // Default to Ollama
//            return ollamaAIProcessor;
//        }
    }
}