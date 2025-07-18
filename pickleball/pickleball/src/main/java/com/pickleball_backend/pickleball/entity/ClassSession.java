package com.pickleball_backend.pickleball.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Data
@Table(name = "classsession")
public class ClassSession {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private String status; // AVAILABLE, BOOKED, CANCELLED, COMPLETED
    private String note;

    @Column(name = "slot_type")
    private String slotType; // COACH_AVAILABILITY or REGULAR_BOOKING

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @ManyToOne
    @JoinColumn(name = "coach_id")
    private User coach;

    @ManyToOne
    @JoinColumn(name = "court_id")
    private Court court;

    @ManyToOne
    @JoinColumn(name = "player_id")
    private User player;

    @OneToOne
    @JoinColumn(name = "payment_id") // 這個欄位名要和你的資料庫一致
    private Payment payment;

    @OneToOne(mappedBy = "session", cascade = CascadeType.ALL)
    private CancellationRequest cancellationRequest;

}