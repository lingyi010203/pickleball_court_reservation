package com.pickleball_backend.pickleball.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Collections;
import java.util.List;

@RestController
@RequestMapping("/api/chat")
public class ConversationController {
    @GetMapping("/conversations")
    public ResponseEntity<List<Object>> getConversations(Authentication authentication) {
        // Return an empty list for now
        return ResponseEntity.ok(Collections.emptyList());
    }
}
