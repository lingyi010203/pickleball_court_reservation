package com.pickleball_backend.pickleball.entity;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;

@Entity
@Table(name = "voucher")
@Getter
@Setter
@NoArgsConstructor
@JsonIgnoreProperties("tier")
public class Voucher {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int id;

    @Column(unique = true)
    private String code;

    @Column(name = "tier_id", nullable = false)
    private int tierId;

    @Column(name = "discount_type", nullable = false)
    private String discountType;

    @Column(name = "discount_value", nullable = false)
    private double discountValue;

    @Column(name = "request_points", nullable = false)
    private int requestPoints;

    @Column(name = "expiry_date")
    private LocalDate expiryDate;

    @Column(name = "discount_amount", nullable = false)
    private double discountAmount;

    @Column(name = "user_id")
    private Integer userId;

    @ManyToOne
    @JoinColumn(name = "tier_id", nullable = false, insertable = false, updatable = false)
    @JsonBackReference
    private MembershipTier tier;

    @ManyToOne
    @JoinColumn(name = "user_id", referencedColumnName = "user_id", insertable = false, updatable = false)
    private Member member;
}