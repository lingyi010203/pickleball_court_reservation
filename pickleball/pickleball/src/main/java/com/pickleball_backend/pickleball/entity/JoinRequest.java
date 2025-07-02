package com.pickleball_backend.pickleball.entity;

import jakarta.persistence.*;
import lombok.Data;
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

    @Column(name = "request_date")
    private LocalDateTime requestDate = LocalDateTime.now();

    @ManyToOne
    @JoinColumn(name = "member_id")
    private Member member;

    @ManyToOne
    @JoinColumn(name = "friendly_match_id")
    private FriendlyMatch friendlyMatch;

    public enum Status {
        PENDING, APPROVED, REJECTED
    }
}