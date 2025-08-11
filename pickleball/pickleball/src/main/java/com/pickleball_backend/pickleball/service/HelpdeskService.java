package com.pickleball_backend.pickleball.service;

import com.pickleball_backend.pickleball.entity.HelpdeskQuery;
import com.pickleball_backend.pickleball.entity.User;
import com.pickleball_backend.pickleball.repository.HelpdeskQueryRepository;
import com.pickleball_backend.pickleball.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class HelpdeskService {
    private final HelpdeskQueryRepository queryRepository;
    private final EmailService emailService;
    private final String adminEmail;
    private final UserRepository userRepository;
    private final AiChatService aiChatService;

    @Autowired
    public HelpdeskService(HelpdeskQueryRepository queryRepository,
                           EmailService emailService,
                           @Value("${app.admin.email}") String adminEmail,
                           UserRepository userRepository,
                           AiChatService aiChatService) {
        this.queryRepository = queryRepository;
        this.emailService = emailService;
        this.adminEmail = adminEmail;
        this.userRepository = userRepository;
        this.aiChatService = aiChatService;
    }

    public HelpdeskQuery processQuery(String username, String question) {
        String aiResponse = null;
        // Try AI first; fallback to static response when not configured or on error
        try {
            aiResponse = aiChatService.askSupportAssistant(username, question);
        } catch (Exception ignored) {
        }
        if (aiResponse == null || aiResponse.isBlank()) {
            aiResponse = getFallbackResponse(question);
        }

        HelpdeskQuery query = new HelpdeskQuery();
        query.setUsername(username);
        query.setQuestion(question);
        query.setAiResponse(aiResponse);
        query.setEscalated(false);

        return queryRepository.save(query);
    }

    private String getFallbackResponse(String question) {
        if (question == null) return "Please enter your question.";
        String q = question.toLowerCase();
        if (q.contains("booking")) {
            return "You can manage bookings in 'My Bookings'. Cancellations allowed up to 24 hours before.";
        } else if (q.contains("membership")) {
            return "We offer Bronze, Silver, Gold tiers with court discounts & priority booking.";
        } else if (q.contains("payment")) {
            return "Pay via credit cards/e-wallets securely. View history in Wallet section.";
        }
        return "Could you provide more details about your question?";
    }

    public void escalateToHumanSupport(Long queryId) {
        HelpdeskQuery query = queryRepository.findById(queryId)
                .orElseThrow(() -> new RuntimeException("Query not found"));

        query.setEscalated(true);
        queryRepository.save(query);

        // Send email to admin
        String subject = "Helpdesk Escalation: Query #" + queryId;
        String content = "User: " + query.getUsername() + "\n\n" +
                "Question: " + query.getQuestion() + "\n\n" +
                "Please handle this support request.";

        emailService.sendEmail(adminEmail, subject, content);

        // Send notification to the user
        User user = userRepository.findByUsername(query.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"));
        String userEmail = user.getEmail();

        String userSubject = "Your helpdesk query has been escalated";
        String userContent = "Dear " + user.getName() + ",\n\n" +
                "Your helpdesk query has been escalated to human support. Our team will contact you soon.\n\n" +
                "Question: " + query.getQuestion();

        emailService.sendEmail(userEmail, userSubject, userContent);
    }

    public void escalateForm(String username, String topic, String message) {
        // 1. Save to DB if needed
        // 2. Send email to admin (and user if needed)
        // Example:
        String adminEmail = "admin@example.com";
        String subject = "New Escalation from " + username + " [" + topic + "]";
        String content = "User: " + username + "\\nTopic: " + topic + "\\nMessage: " + message;
        emailService.sendEmail(adminEmail, subject, content);
        // Optionally send confirmation to user
    }

    public List<HelpdeskQuery> getQueriesByUsername(String username) {
        return queryRepository.findByUsername(username);
    }
}