package com.pickleball_backend.pickleball.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Data
@Table(name = "payment")
public class Payment {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(nullable = false, columnDefinition = "decimal(10,2)")
    private double amount;

    @Column(name = "payment_date")
    private LocalDateTime paymentDate;

    @Column(name = "refund_date")
    private LocalDateTime refundDate;

    @Column(name = "status", length = 50)
    private String status = "PENDING";  // PENDING, PROCESSING, COMPLETED, FAILED, CANCELLED, REFUNDED

    @Column(name = "payment_type", length = 20)
    private String paymentType;  // TOP_UP, BOOKING, REFUND

    @Column(name = "payment_method", length = 50)
    private String paymentMethod;  // BANK_CARD, BANK_TRANSFER, E_WALLET, WALLET, INTERNAL_CREDIT

    @Column(name = "transaction_id", length = 50)
    private String transactionId;

    @Column(name = "reference_id", length = 50)
    private String referenceId;  // For external payment references

    @Column(name = "failure_reason", length = 500)
    private String failureReason;

    @Column(name = "retry_count", nullable = false)
    private Integer retryCount = 0;

    @Column(name = "max_retries", nullable = false)
    private Integer maxRetries = 3;

    @Column(name = "expires_at")
    private LocalDateTime expiresAt;  // For pending payments

    @Column(name = "processed_at")
    private LocalDateTime processedAt;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "group_booking_id")
    private String groupBookingId; // UUID字串

    @OneToOne(mappedBy = "payment")
    private Booking booking;

    @OneToOne(mappedBy = "payment")
    private ClassSession session;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (paymentDate == null) {
            paymentDate = LocalDateTime.now();
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}