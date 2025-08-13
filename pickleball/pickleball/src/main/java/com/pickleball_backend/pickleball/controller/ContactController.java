package com.pickleball_backend.pickleball.controller;

import com.pickleball_backend.pickleball.dto.ContactFormRequest;
import com.pickleball_backend.pickleball.service.EmailService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/contact")
@CrossOrigin(origins = "*")
public class ContactController {

    @Autowired
    private EmailService emailService;

    @PostMapping("/submit")
    public ResponseEntity<?> submitContactForm(@RequestBody ContactFormRequest request) {
        try {
            // 验证请求数据
            if (request.getName() == null || request.getName().trim().isEmpty()) {
                return ResponseEntity.badRequest().body("Name is required");
            }
            if (request.getEmail() == null || request.getEmail().trim().isEmpty()) {
                return ResponseEntity.badRequest().body("Email is required");
            }
            if (request.getSubject() == null || request.getSubject().trim().isEmpty()) {
                return ResponseEntity.badRequest().body("Subject is required");
            }
            if (request.getMessage() == null || request.getMessage().trim().isEmpty()) {
                return ResponseEntity.badRequest().body("Message is required");
            }

            // 发送邮件
            emailService.sendContactFormEmail(
                request.getName(),
                request.getEmail(),
                request.getSubject(),
                request.getMessage()
            );

            return ResponseEntity.ok().body("Message sent successfully");
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body("Failed to send message: " + e.getMessage());
        }
    }
}
