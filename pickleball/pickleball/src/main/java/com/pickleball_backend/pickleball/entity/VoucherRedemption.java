package com.pickleball_backend.pickleball.entity;

import jakarta.persistence.*;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.LocalDate;

@Entity
@Table(name = "voucher_redemption")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class VoucherRedemption {
    
    // Status constants
    public static final String STATUS_ACTIVE = "ACTIVE";
    public static final String STATUS_USED = "USED";
    public static final String STATUS_PENDING_REFUND = "PENDING_REFUND";
    public static final String STATUS_RESTORED = "RESTORED";
    
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