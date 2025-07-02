package com.pickleball_backend.pickleball.controller;

import com.pickleball_backend.pickleball.dto.ChatMessage;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.time.LocalDateTime;
import java.security.Principal;

@Controller
public class ChatController {
    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    // Public chatroom
    @MessageMapping("/chat.sendMessage")
    @SendTo("/topic/public")
    public ChatMessage sendMessage(ChatMessage message) {
        if (message.getTimestamp() == null) {
            message.setTimestamp(LocalDateTime.now().toString());
        }
        return message;
    }

    // Private chat
    @MessageMapping("/chat.private.{toUsername}")
    public void sendPrivateMessage(@DestinationVariable String toUsername, ChatMessage message, Principal principal) {
        message.setSender(principal.getName());
        if (message.getTimestamp() == null) {
            message.setTimestamp(LocalDateTime.now().toString());
        }
        messagingTemplate.convertAndSendToUser(toUsername, "/queue/messages", message);
    }
}
