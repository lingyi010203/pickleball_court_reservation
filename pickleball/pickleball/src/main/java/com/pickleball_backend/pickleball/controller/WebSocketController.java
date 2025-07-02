package com.pickleball_backend.pickleball.controller;

import com.pickleball_backend.pickleball.dto.MessageDto;
import com.pickleball_backend.pickleball.service.MessageService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.util.List;
import java.util.Map;
import java.security.Principal;
import com.pickleball_backend.pickleball.entity.Message;
import com.pickleball_backend.pickleball.repository.MessageRepository;

@Controller
public class WebSocketController {
    private final SimpMessagingTemplate messagingTemplate;
    private final MessageService messageService;
    private final MessageRepository messageRepository;

    @Autowired
    public WebSocketController(SimpMessagingTemplate messagingTemplate,
                               MessageService messageService,
                               MessageRepository messageRepository) {
        this.messagingTemplate = messagingTemplate;
        this.messageService = messageService;
        this.messageRepository = messageRepository;
    }

    @MessageMapping("/chat.send")
    public void sendMessage(@Payload MessageDto messageDto) {
        // Add image handling
        if (messageDto.getImageUrl() != null) {
            messageDto.setContent(""); // Clear content if image is present
        }

        MessageDto savedMessageDto = messageService.sendMessage(
                messageDto.getSenderUsername(),
                messageDto.getRecipientUsername(),
                messageDto.getContent(),
                messageDto.getImageUrl()
        );

        // Send to both parties
        messagingTemplate.convertAndSendToUser(
                savedMessageDto.getRecipientUsername(),
                "/queue/messages",
                savedMessageDto
        );
        messagingTemplate.convertAndSendToUser(
                savedMessageDto.getSenderUsername(),
                "/queue/messages",
                savedMessageDto
        );
    }

    @MessageMapping("/chat.delivered")
    public void markMessagesDelivered(@Payload List<Integer> messageIds, Principal principal) {
        messageService.markMessagesAsDelivered(messageIds);
        for (Integer id : messageIds) {
            Message message = messageRepository.findById(id).orElse(null);
            if (message != null) {
                String senderUsername = message.getSender().getUserAccount().getUsername();
                messagingTemplate.convertAndSendToUser(
                    senderUsername,
                    "/queue/messages",
                    Map.of("type", "delivered", "messageId", id)
                );
            }
        }
    }

    @MessageMapping("/chat.read")
    public void markMessagesRead(@Payload List<Integer> messageIds, Principal principal) {
        messageService.markMessagesAsRead(messageIds);
        // 你可以查出每個 message 的 sender，然後通知 sender
        for (Integer id : messageIds) {
            Message message = messageRepository.findById(id).orElse(null);
            if (message != null) {
                String senderUsername = message.getSender().getUserAccount().getUsername();
                messagingTemplate.convertAndSendToUser(
                    senderUsername,
                    "/queue/messages",
                    // 你可以自訂一個 DTO，告訴前端這些 messageId 已讀
                    Map.of("type", "read", "messageId", id)
                );
            }
        }
    }
}