package com.pickleball_backend.pickleball.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

import java.time.LocalDateTime;

// 显式导入 User 类
import com.pickleball_backend.pickleball.entity.User;

@Entity
@Table(name = "user_warning")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserWarning {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "message", length = 1000)
    private String message;

    @Column(name = "reason", length = 255)
    private String reason;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "delivery_status", length = 32)
    private String deliveryStatus; // SENT, FAILED

    @Column(name = "recipient_email", length = 255)
    private String recipientEmail;

    @Column(name = "target_name", length = 255)
    private String targetName;

    @Column(name = "target_type", length = 50)
    private String targetType;

    @Column(name = "feedback_content", length = 1000)
    private String feedbackContent;

    @Column(name = "feedback_id")
    private Integer feedbackId;

    @Column(name = "feedback_created_at")
    private LocalDateTime feedbackCreatedAt;
}


