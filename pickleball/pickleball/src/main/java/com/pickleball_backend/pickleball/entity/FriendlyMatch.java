package com.pickleball_backend.pickleball.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Data
@Table(name = "friendlymatch")
public class FriendlyMatch {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "max_players", nullable = false)
    private Integer maxPlayers;

    @Column(name = "current_players")
    private int currentPlayers = 1; // Organizer is first player

    private String skillLevel;

    @Column(columnDefinition = "TEXT")
    private String matchRules;

    private String status = "OPEN"; // OPEN, FULL, CANCELLED

    // 付款狀態：PENDING, PAID, CANCELLED
    @Column(name = "payment_status")
    private String paymentStatus = "PENDING";

    @Column(name = "start_time")
    private LocalDateTime startTime;

    @Column(name = "end_time")
    private LocalDateTime endTime;

    @Column(name = "duration_hours")
    private Integer durationHours;

    @Column(name = "price")
    private Double price;

    private String location;

    @Column(name = "court_id")
    private Integer courtId;

    @ManyToOne
    @JoinColumn(name = "organizer_id")
    private Member organizer;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "booking_id")
    private Booking booking; // 對應已預約的場地

    // 是否為邀請型（由 booking 產生的 invitation）
    @Column(name = "is_invitation")
    private boolean isInvitation = false;

    // 邀請型態（可擴充：FRIENDLY_MATCH_INVITE, TOURNAMENT_INVITE...）
    @Column(name = "invitation_type")
    private String invitationType = "FRIENDLY_MATCH_INVITE";

    @OneToMany(mappedBy = "friendlyMatch", cascade = CascadeType.ALL)
    private List<JoinRequest> joinRequests;

    public void setIsInvitation(boolean isInvitation) {
        this.isInvitation = isInvitation;
    }
}