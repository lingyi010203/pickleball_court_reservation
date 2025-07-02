package com.pickleball_backend.pickleball.controller;

import com.pickleball_backend.pickleball.dto.MessageDto;
import com.pickleball_backend.pickleball.dto.MessageResponseDto;
import com.pickleball_backend.pickleball.service.MessageService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.util.StringUtils;
import org.springframework.http.HttpStatus;
import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

import java.util.List;

@RestController
@RequestMapping("/api/messages")
public class MessageController {
    private final MessageService messageService;

    @Autowired
    public MessageController(MessageService messageService) {
        this.messageService = messageService;
    }

    // 统一使用 service 方法获取对话
    @GetMapping("/conversation/{username}")
    public ResponseEntity<List<MessageResponseDto>> getConversation(
            Authentication authentication,
            @PathVariable String username) {
        String currentUsername = authentication.getName();
        return ResponseEntity.ok(messageService.getConversation(currentUsername, username));
    }

    // 使用 service 方法获取历史消息
    @GetMapping("/history")
    public ResponseEntity<List<MessageResponseDto>> getMessageHistory(
            Authentication authentication,
            @RequestParam String friendUsername) {
        String currentUsername = authentication.getName();
        return ResponseEntity.ok(messageService.getConversation(currentUsername, friendUsername));
    }

    // 获取对话预览列表
    @GetMapping("/previews")
    public ResponseEntity<List<Object>> getConversationPreviews(Authentication authentication) {
        String currentUsername = authentication.getName();
        return ResponseEntity.ok(messageService.getConversationPreviews(currentUsername));
    }

    // 修复 ID 类型为 Integer
    @PostMapping("/mark-read")
    public ResponseEntity<Void> markMessagesAsRead(@RequestBody List<Integer> messageIds) {
        messageService.markMessagesAsRead(messageIds);
        return ResponseEntity.ok().build();
    }

    // 修复 ID 类型为 Integer
    @PostMapping("/mark-delivered")
    public ResponseEntity<Void> markMessagesAsDelivered(@RequestBody List<Integer> messageIds) {
        messageService.markMessagesAsDelivered(messageIds);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/send")
    public ResponseEntity<MessageDto> sendMessage(
            Authentication authentication,
            @RequestParam String recipient,
            @RequestParam(required = false) String content,
            @RequestParam(required = false) String imageUrl) {
        return ResponseEntity.ok(messageService.sendMessage(
                authentication.getName(),
                recipient,
                content,
                imageUrl
        ));
    }

    @PostMapping("/upload")
    public ResponseEntity<String> uploadImage(@RequestParam("file") MultipartFile file) {
        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body("File is empty");
        }
        try {
            // Create uploads directory if it doesn't exist
            Path uploadPath = Paths.get("uploads").toAbsolutePath().normalize();
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }

            // Generate unique filename
            String originalFilename = StringUtils.cleanPath(file.getOriginalFilename());
            String extension = originalFilename.substring(originalFilename.lastIndexOf("."));
            String filename = UUID.randomUUID().toString() + extension;

            // Save file
            Path filePath = uploadPath.resolve(filename);
            Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

            // Return accessible URL
            return ResponseEntity.ok("/uploads/" + filename);
        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Failed to upload file: " + e.getMessage());
        }
    }
}