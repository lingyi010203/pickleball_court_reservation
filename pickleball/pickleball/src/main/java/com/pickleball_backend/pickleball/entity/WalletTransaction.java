package com.pickleball_backend.pickleball.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Data
@Table(name = "wallet_transaction")
public class WalletTransaction {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "wallet_id", nullable = false)
    private Integer walletId;

    @Column(name = "transaction_type", length = 20, nullable = false)
    private String transactionType;  // DEPOSIT, WITHDRAWAL, FREEZE, UNFREEZE, REFUND

    @Column(nullable = false, columnDefinition = "DECIMAL(10,2)")
    private double amount;

    @Column(name = "balance_before", nullable = false, columnDefinition = "DECIMAL(10,2)")
    private double balanceBefore;

    @Column(name = "balance_after", nullable = false, columnDefinition = "DECIMAL(10,2)")
    private double balanceAfter;

    @Column(name = "frozen_before", nullable = false, columnDefinition = "DECIMAL(10,2)")
    private double frozenBefore;

    @Column(name = "frozen_after", nullable = false, columnDefinition = "DECIMAL(10,2)")
    private double frozenAfter;

    @Column(name = "reference_type", length = 20)
    private String referenceType;  // PAYMENT, BOOKING, REFUND, ADMIN_ADJUSTMENT

    @Column(name = "reference_id")
    private Integer referenceId;

    @Column(name = "description", length = 500)
    private String description;

    @Column(name = "status", length = 20, nullable = false)
    private String status = "COMPLETED";  // PENDING, COMPLETED, FAILED, CANCELLED

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "processed_at")
    private LocalDateTime processedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "wallet_id", insertable = false, updatable = false)
    private Wallet wallet;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        if (status.equals("COMPLETED")) {
            processedAt = LocalDateTime.now();
        }
    }
} 