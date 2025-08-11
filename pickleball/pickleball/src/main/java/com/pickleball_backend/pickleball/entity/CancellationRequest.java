package com.pickleball_backend.pickleball.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.ToString;
import java.time.LocalDateTime;

@Entity
@Data
@Table(name = "cancellation_request")
public class CancellationRequest {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;
    private Integer approvedBy;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "booking_id", nullable = false)
    @ToString.Exclude
    private Booking booking;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "session_id")
    @ToString.Exclude
    private ClassSession session;

    private String reason;

    @Column(name = "request_date", nullable = false)
    private LocalDateTime requestDate;

    @Column(nullable = false, length = 50)
    private String status; // PENDING, APPROVED, REJECTED

    @Column(name = "admin_remark")
    private String adminRemark;

    @Column(name = "initiated_by_coach")
    private Boolean initiatedByCoach;
}