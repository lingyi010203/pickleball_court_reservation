package com.pickleball_backend.pickleball.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.ToString;
import java.time.LocalDateTime;
import java.io.Serializable;

@Entity
@Data
@Table(name = "eventregistration")
public class EventRegistration {
    @Id
    @Column(name = "registration_id")
    private Integer registrationId;

    @Column(name = "registration_date")
    private LocalDateTime registrationDate;

    @Column(name = "payment_status")
    private String paymentStatus;

    @Column(name = "fee_amount")
    private Double feeAmount;

    @Column(name = "status")
    private String status; // e.g., REGISTERED, CANCELLED

    @ManyToOne
    @JoinColumn(name = "user_id")
    @ToString.Exclude
    private User user;

    @ManyToOne
    @JoinColumn(name = "event_id")
    @ToString.Exclude
    private Event event;
}
