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

    @Column(name = "max_players")
    private int maxPlayers;

    @Column(name = "current_players")
    private int currentPlayers = 1; // Organizer is first player

    private String skillLevel;

    @Column(columnDefinition = "TEXT")
    private String matchRules;

    private String status = "OPEN"; // OPEN, FULL, CANCELLED

    @Column(name = "start_time")
    private LocalDateTime startTime;

    private String location;

    @ManyToOne
    @JoinColumn(name = "organizer_id")
    private Member organizer;

    @OneToMany(mappedBy = "friendlyMatch", cascade = CascadeType.ALL)
    private List<JoinRequest> joinRequests;
}