package com.pickleball_backend.pickleball.entity;

import jakarta.persistence.*;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.LocalDate;

@Entity
@Table(name = "voucher_redemption")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class VoucherRedemption {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;
    
    @Column(name = "voucher_id", nullable = false)
    private Integer voucherId;
    
    @Column(name = "user_id", nullable = false)
    private Integer userId;
    
    @Column(name = "redemption_date", nullable = false)
    private LocalDate redemptionDate;
    
    @Column(name = "expiry_date")
    private LocalDate expiryDate;

    @Column(name = "status", nullable = false)
    private String status;  // Changed from enum to String
    
    // Relationships
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "voucher_id", insertable = false, updatable = false)
    private Voucher voucher;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", insertable = false, updatable = false)
    private User user;
} 