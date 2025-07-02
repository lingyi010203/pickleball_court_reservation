package com.pickleball_backend.pickleball.service;

import com.pickleball_backend.pickleball.dto.MessageDto;
import com.pickleball_backend.pickleball.dto.MessageResponseDto;
import com.pickleball_backend.pickleball.entity.*;
import com.pickleball_backend.pickleball.repository.*;
import org.hibernate.Hibernate;
import lombok.extern.slf4j.Slf4j;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;


import java.util.List;
import java.util.stream.Collectors;
import java.util.Comparator;
import java.util.Map;
import java.util.Objects;

@Service
public class MessageService {
    private final MessageRepository messageRepository;
    private final UserRepository userRepository;
    private final FriendshipService friendshipService;
    private static final Logger logger = LoggerFactory.getLogger(MessageService.class);

    @Autowired
    public MessageService(MessageRepository messageRepository,
                          UserRepository userRepository,
                          FriendshipService friendshipService) {
        this.messageRepository = messageRepository;
        this.userRepository = userRepository;
        this.friendshipService = friendshipService;
    }

    @Autowired
    private EmailService emailService; // Add this if not present

    @Transactional
    public MessageDto sendMessage(String senderUsername, String recipientUsername, String content, String imageUrl) {
        User sender = userRepository.findByUsernameCaseInsensitive(senderUsername)
                .orElseThrow(() -> new IllegalArgumentException("Sender not found: " + senderUsername));
        User recipient = userRepository.findByUsernameCaseInsensitive(recipientUsername)
                .orElseThrow(() -> new IllegalArgumentException("Receiver not found: " + recipientUsername));

        // Ensure friendship
        if (!friendshipService.areFriends(sender.getId(), recipient.getId())) {
            throw new SecurityException("You can only message friends");
        }

        Message message = new Message();
        message.setSender(sender);
        message.setReceiver(recipient);
        message.setContent(content);
        message.setImageUrl(imageUrl); // Ensure imageUrl is set

        // Rely on @PrePersist to generate conversationId
        Message savedMessage = messageRepository.save(message);

        // Send email notification to recipient
        if (recipient.getEmail() != null && !recipient.getEmail().isEmpty()) {
            String preview = (content != null && !content.isEmpty()) ? content : "[Image]";
            emailService.sendMessageNotification(
                recipient.getEmail(),
                senderUsername,
                preview
            );
        }

        return convertToDto(savedMessage);
    }

    public List<MessageResponseDto> getConversation(String username1, String username2) {
        User user1 = userRepository.findByUsernameCaseInsensitive(username1)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + username1));
        User user2 = userRepository.findByUsernameCaseInsensitive(username2)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + username2));

        int minId = Math.min(user1.getId(), user2.getId());
        int maxId = Math.max(user1.getId(), user2.getId());
        String conversationId = minId + "-" + maxId;

        return messageRepository.findByConversationId(conversationId).stream()
                .map(this::convertToResponseDto)
                .collect(Collectors.toList());
    }

    private MessageResponseDto convertToResponseDto(Message message) {
        MessageResponseDto dto = new MessageResponseDto();
        dto.setId(message.getId());
        dto.setContent(message.getContent());
        dto.setTimestamp(message.getTimestamp());
        dto.setDelivered(message.isDelivered());
        dto.setRead(message.isRead());
        dto.setConversationId(message.getConversationId());
        dto.setImageUrl(message.getImageUrl());

        // 处理发送者信息
        processUserInfo(message.getSender(), dto, true);

        // 处理接收者信息
        processUserInfo(message.getReceiver(), dto, false);

        return dto;
    }

    private void processUserInfo(User user, MessageResponseDto dto, boolean isSender) {
        if (user == null) {
            logger.warn("User is null for message: {}", dto.getId());
            return;
        }

        try {
            // 初始化关联实体
            Hibernate.initialize(user);

            // 确保 UserAccount 被加载
            if (user.getUserAccount() != null) {
                Hibernate.initialize(user.getUserAccount());
            }
        } catch (Exception e) {
            logger.error("Error initializing user: {}", e.getMessage());
        }

        if (isSender) {
            // 使用安全的方法获取用户名
            dto.setSenderUsername(getSafeUsername(user));

            // 使用安全的方法获取头像
            dto.setSenderProfileImage(getSafeProfileImage(user));
        } else {
            dto.setReceiverUsername(getSafeUsername(user));
        }
    }

    // 安全获取用户名的方法
    private String getSafeUsername(User user) {
        // 优先从 UserAccount 获取
        if (user.getUserAccount() != null && user.getUserAccount().getUsername() != null) {
            return user.getUserAccount().getUsername();
        }

        // 其次从 User 实体获取
        if (user.getName() != null) {
            return user.getName();
        }

        // 最后从邮箱生成
        if (user.getEmail() != null) {
            return user.getEmail().split("@")[0];
        }

        // 最终回退方案
        return "user" + user.getId();
    }

    // 安全获取头像的方法
    private String getSafeProfileImage(User user) {
        // 优先从 UserAccount 获取
        if (user.getUserAccount() != null && user.getUserAccount().getProfileImage() != null) {
            return user.getUserAccount().getProfileImage();
        }

        // 其次从 User 实体获取
        if (user.getProfileImage() != null) {
            return user.getProfileImage();
        }

        // 默认头像
        return "/default-profile.png";
    }

    @Transactional
    public void markMessagesAsDelivered(List<Integer> messageIds) {
        if (messageIds == null || messageIds.isEmpty()) return;

        List<Message> messages = messageRepository.findAllById(messageIds);
        messages.forEach(message -> message.setDelivered(true));
        messageRepository.saveAll(messages);
    }

    @Transactional
    public void markMessagesAsRead(List<Integer> messageIds) {
        if (messageIds == null || messageIds.isEmpty()) return;

        List<Message> messages = messageRepository.findAllById(messageIds);
        messages.forEach(message -> message.setRead(true));
        messageRepository.saveAll(messages);
    }

    public List<Object> getConversationPreviews(String currentUsername) {
        User currentUser = userRepository.findByUsernameCaseInsensitive(currentUsername)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + currentUsername));

        // Get all conversations for the current user
        List<Message> allMessages = messageRepository.findByUserId(currentUser.getId());
        
        // Group messages by conversation
        Map<String, List<Message>> conversations = allMessages.stream()
                .collect(Collectors.groupingBy(Message::getConversationId));

        return conversations.entrySet().stream()
                .map(entry -> {
                    String conversationId = entry.getKey();
                    List<Message> messages = entry.getValue();
                    
                    // Get the latest message
                    Message latestMessage = messages.stream()
                            .max(Comparator.comparing(Message::getTimestamp))
                            .orElse(null);
                    
                    if (latestMessage == null) return null;
                    
                    // Determine the other user in the conversation
                    User otherUser = latestMessage.getSender().equals(currentUser) 
                            ? latestMessage.getReceiver() 
                            : latestMessage.getSender();
                    
                    // Count unread messages from the other user
                    long unreadCount = messages.stream()
                            .filter(msg -> msg.getReceiver().equals(currentUser) && !msg.isRead())
                            .count();
                    
                    return Map.of(
                            "id", conversationId,
                            "lastMessage", Map.of(
                                    "content", latestMessage.getContent(),
                                    "timestamp", latestMessage.getTimestamp()
                            ),
                            "otherUser", Map.of(
                                    "id", otherUser.getId(),
                                    "username", getSafeUsername(otherUser),
                                    "name", otherUser.getName(),
                                    "profileImage", getSafeProfileImage(otherUser)
                            ),
                            "unreadCount", unreadCount
                    );
                })
                .filter(Objects::nonNull)
                .collect(Collectors.toList());
    }

    private MessageDto convertToDto(Message message) {
        MessageDto dto = new MessageDto();
        dto.setId(message.getId());

        if (message.getSender() != null && message.getSender().getUserAccount() != null) {
            dto.setSenderUsername(message.getSender().getUserAccount().getUsername());
        }

        if (message.getReceiver() != null && message.getReceiver().getUserAccount() != null) {
            dto.setRecipientUsername(message.getReceiver().getUserAccount().getUsername());
        }

        dto.setContent(message.getContent());
        dto.setTimestamp(message.getTimestamp().toString());
        dto.setDelivered(message.isDelivered());
        dto.setRead(message.isRead());
        dto.setConversationId(message.getConversationId());
        dto.setImageUrl(message.getImageUrl());
        return dto;
    }
}