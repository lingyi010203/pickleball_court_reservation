package com.pickleball_backend.pickleball.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.ToString;
import java.time.LocalDateTime;

@Entity
@Data
@Table(name = "joinrequest")
public class JoinRequest {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Enumerated(EnumType.STRING)
    private Status status = Status.PENDING; // PENDING, APPROVED, REJECTED

    @Column(name = "request_date", nullable = false)
    private LocalDateTime requestDate;

    @PrePersist
    public void prePersist() {
        if (this.requestDate == null) {
            this.requestDate = LocalDateTime.now();
        }
    }

    @Column(name = "request_time")
    private java.time.LocalDateTime requestTime;

    @ManyToOne
    @JoinColumn(name = "member_id")
    @ToString.Exclude
    private Member member;

    @ManyToOne
    @JoinColumn(name = "match_id", nullable = false)
    @ToString.Exclude
    private FriendlyMatch friendlyMatch;

    public enum Status {
        PENDING, APPROVED, REJECTED
    }
}