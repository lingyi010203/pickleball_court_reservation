package com.pickleball_backend.pickleball.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Data
@Table(name = "wallet")
public class Wallet {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(nullable = false, columnDefinition = "DECIMAL(10,2) DEFAULT 0.00")
    private double balance;

    @Column(name = "frozen_balance", nullable = false, columnDefinition = "DECIMAL(10,2) DEFAULT 0.00")
    private double frozenBalance = 0.00;  // For pending bookings

    @Column(name = "total_deposited", nullable = false, columnDefinition = "DECIMAL(10,2) DEFAULT 0.00")
    private double totalDeposited = 0.00;  // Total amount ever deposited

    @Column(name = "total_spent", nullable = false, columnDefinition = "DECIMAL(10,2) DEFAULT 0.00")
    private double totalSpent = 0.00;  // Total amount ever spent

    @Column(name = "last_updated")
    private LocalDateTime lastUpdated;

    @Column(name = "status", length = 20, nullable = false)
    private String status = "ACTIVE";  // ACTIVE, SUSPENDED, CLOSED

    @OneToOne
    @JoinColumn(name = "member_id")
    private Member member;

    @PreUpdate
    @PrePersist
    protected void onUpdate() {
        lastUpdated = LocalDateTime.now();
    }
}