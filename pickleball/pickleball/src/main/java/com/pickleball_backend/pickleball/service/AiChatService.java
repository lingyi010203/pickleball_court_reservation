package com.pickleball_backend.pickleball.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Thin wrapper around Groq Chat Completions API.
 * Returns null when API is not configured or on any error, allowing caller to fallback gracefully.
 */
@Service
public class AiChatService {
    private static final Logger log = LoggerFactory.getLogger(AiChatService.class);
    private final String apiKey;
    private final String baseUrl;
    private final String model;
    private final ObjectMapper objectMapper;
    private final HttpClient httpClient;

    public AiChatService(
            @Value("${groq.api.key:${GROQ_API_KEY:}}") String apiKey,
            @Value("${groq.base-url:https://api.groq.com/openai/v1}") String baseUrl,
            @Value("${groq.model:llama3-8b-8192}") String model,
            ObjectMapper objectMapper
    ) {
        this.apiKey = apiKey == null ? "" : apiKey.trim();
        this.baseUrl = baseUrl == null ? "https://api.groq.com/openai/v1" : baseUrl.trim();
        this.model = model == null ? "llama3-8b-8192" : model.trim();
        this.objectMapper = objectMapper;
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(15))
                .build();
        
        // Debug logging
        log.info("AiChatService initialized - API Key: {} (length: {}), Base URL: {}, Model: {}", 
                apiKey == null ? "null" : (apiKey.length() > 10 ? apiKey.substring(0, 10) + "..." : apiKey),
                apiKey == null ? 0 : apiKey.length(),
                this.baseUrl, this.model);
    }

    public String askSupportAssistant(String username, String question) {
        log.info("askSupportAssistant called - username: {}, question: {}, apiKey empty: {}", username, question, apiKey.isEmpty());
        if (apiKey.isEmpty()) {
            log.warn("Groq API key is empty, returning null for fallback");
            return null; // Not configured; let caller fallback
        }
        try {
            Map<String, Object> body = new HashMap<>();
            body.put("model", model);
            body.put("temperature", 0.2);

            // System prompt to align responses with product context
            Map<String, String> sys = new HashMap<>();
            sys.put("role", "system");
            sys.put("content", "You are a helpful, concise support assistant for the Pickleball Court Reservation app. " +
                    "Answer in the user's language when obvious. Use markdown for structure. " +
                    "If account-specific actions are needed, describe clear next steps.");

            Map<String, String> usr = new HashMap<>();
            usr.put("role", "user");
            usr.put("content", String.format("User: %s\nQuestion: %s", username, question));

            body.put("messages", List.of(sys, usr));

            String json = objectMapper.writeValueAsString(body);
            HttpRequest.Builder builder = HttpRequest.newBuilder()
                    .uri(URI.create(baseUrl.endsWith("/") ? baseUrl + "chat/completions" : baseUrl + "/chat/completions"))
                    .timeout(Duration.ofSeconds(30))
                    .header("Content-Type", "application/json")
                    .header("User-Agent", "pickleball-helpdesk/1.0")
                    .POST(HttpRequest.BodyPublishers.ofString(json, StandardCharsets.UTF_8));

            // Use Bearer authentication for Groq API
            builder.header("Authorization", "Bearer " + apiKey);

            HttpRequest request = builder.build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8));
            if (response.statusCode() >= 200 && response.statusCode() < 300) {
                JsonNode root = objectMapper.readTree(response.body());
                JsonNode choices = root.path("choices");
                if (choices.isArray() && choices.size() > 0) {
                    JsonNode content = choices.get(0).path("message").path("content");
                    if (content.isTextual()) {
                        return content.asText();
                    }
                }
            } else {
                // Log non-2xx for easier troubleshooting
                String truncated = response.body() == null ? "" : response.body();
                if (truncated.length() > 500) truncated = truncated.substring(0, 500) + "...";
                log.warn("Groq request failed. status={} body={}", response.statusCode(), truncated);
            }
        } catch (Exception e) {
            log.warn("Groq request error", e);
        }
        return null;
    }
}

