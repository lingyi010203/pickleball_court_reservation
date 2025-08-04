package com.pickleball_backend.pickleball.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "member")
@Getter
@Setter
@NoArgsConstructor
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
public class Member {
    @Id
    @Column(name = "user_id")
    private Integer id;

    @Column(name = "point_balance", nullable = false, columnDefinition = "int default 0")
    private int pointBalance = 0;

    @OneToMany(mappedBy = "member", cascade = CascadeType.ALL)
    private List<Voucher> vouchers = new ArrayList<>();

    @Column(name = "credit_earned", columnDefinition = "DECIMAL(10,2) DEFAULT 0.00")
    private Double creditEarned = 0.00;

    @Column(name = "internal_credit", columnDefinition = "DECIMAL(10,2) DEFAULT 0.00")
    private Double internalCredit = 0.00;

    @OneToOne
    @MapsId
    @JoinColumn(name = "user_id")
    @JsonIgnoreProperties({"member", "userAccount", "sentMessages", "receivedMessages", "coachSessions"})
    private User user;

    @ManyToOne
    @JoinColumn(name = "tier_id")
    private MembershipTier tier;

    @OneToOne(mappedBy = "member", cascade = CascadeType.ALL)
    private Wallet wallet;

    @OneToMany(mappedBy = "member", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Registration> registrations = new ArrayList<>();

    @OneToMany(mappedBy = "organizer")
    private List<FriendlyMatch> organizedMatches;

    @OneToMany(mappedBy = "member")
    private List<JoinRequest> joinRequests;
}