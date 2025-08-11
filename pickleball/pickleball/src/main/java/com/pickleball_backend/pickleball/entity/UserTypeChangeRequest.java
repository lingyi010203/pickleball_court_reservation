package com.pickleball_backend.pickleball.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "user_type_change_request")
public class UserTypeChangeRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "current_user_type", nullable = false)
    private String currentUserType;

    @Column(name = "requested_user_type", nullable = false)
    private String requestedUserType;

    @Column(name = "request_reason")
    private String requestReason;

    @Column(name = "request_status", nullable = false)
    @Enumerated(EnumType.STRING)
    private RequestStatus status;

    @Column(name = "admin_notes")
    private String adminNotes;

    @Column(name = "processed_by")
    private String processedBy;

    @Column(name = "processed_at")
    private LocalDateTime processedAt;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (status == null) {
            status = RequestStatus.PENDING;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public enum RequestStatus {
        PENDING,
        APPROVED,
        REJECTED,
        CANCELLED
    }
}
