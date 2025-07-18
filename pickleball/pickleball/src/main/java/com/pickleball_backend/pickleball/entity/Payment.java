package com.pickleball_backend.pickleball.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDate;

@Entity
@Data
@Table(name = "payment")
public class Payment {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(nullable = false, columnDefinition = "double(5,2)")
    private double amount;

    @Column(name = "payment_date")
    private java.time.LocalDateTime paymentDate;

    @Column(name = "refund_date")
    private java.time.LocalDateTime refundDate;

    @Column(name = "status", length = 50)
    private String status = "COMPLETED";

    @Column(name = "payment_type", length = 20)
    private String paymentType;

    @Column(name = "payment_method", length = 50)
    private String paymentMethod;

    @Column(name = "transaction_id", length = 50)
    private String transactionId;

    @OneToOne(mappedBy = "payment")
    private Booking booking;

    @OneToOne(mappedBy = "payment")
    private ClassSession session;
}