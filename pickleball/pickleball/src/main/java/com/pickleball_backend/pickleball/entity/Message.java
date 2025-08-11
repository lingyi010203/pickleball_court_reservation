package com.pickleball_backend.pickleball.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.ToString;
import java.time.LocalDateTime;

@Entity
@Data
@NoArgsConstructor // 添加无参构造器
@Table(name = "message")
public class Message {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sender_id", referencedColumnName = "id", nullable = false)
    @ToString.Exclude
    private User sender;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "receiver_id", referencedColumnName = "id")
    @ToString.Exclude
    private User receiver;
    


    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    @Column(name = "image_url")
    private String imageUrl;

    @Column(nullable = false)
    private LocalDateTime timestamp = LocalDateTime.now();

    private boolean delivered = false;

    @Column(name = "is_read")
    private boolean read;

    @Column(name = "conversation_id", nullable = false)
    private String conversationId;

    @PrePersist
    private void generateConversationId() {
        // 增强 null 检查
        if (sender == null) {
            throw new IllegalStateException("Sender cannot be null");
        }

        if (receiver == null) {
            throw new IllegalStateException("Receiver cannot be null");
        }

        if (sender.getId() == null) {
            throw new IllegalStateException("Sender ID cannot be null");
        }

        if (receiver.getId() == null) {
            throw new IllegalStateException("Receiver ID cannot be null");
        }

        int minId = Math.min(sender.getId(), receiver.getId());
        int maxId = Math.max(sender.getId(), receiver.getId());
        this.conversationId = minId + "-" + maxId;
    }
}