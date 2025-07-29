package com.pickleball_backend.pickleball.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonManagedReference;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "user")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(nullable = false, unique = true)
    private UUID uuid = UUID.randomUUID();

    private String name;
    private String gender;
    private String email;
    private String phone;

    private LocalDate dob;

    @Column(name = "user_type")
    private String userType;

    @Column(name = "requested_user_type")
    private String requestedUserType;

    private LocalDateTime createdAt = LocalDateTime.now();
    private LocalDateTime updatedAt = LocalDateTime.now();

    @Column(name = "bookings_made")
    private int bookingsMade;

    @Column(name = "booking_hours")
    private double bookingHours;

    @Column(name = "sumos_joined")
    private int sumosJoined;

    @Column(name = "amount_spent")
    private double amountSpent;

    @OneToOne(mappedBy = "user", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private Member member;

    @OneToOne(mappedBy = "user", cascade = CascadeType.ALL, fetch = FetchType.EAGER)
    private UserAccount userAccount;

    public String getProfileImage() {
        return (userAccount != null) ? userAccount.getProfileImage() : null;
    }



    @OneToMany(mappedBy = "sender", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<Message> sentMessages;

    @OneToMany(mappedBy = "receiver", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<Message> receivedMessages;

    @OneToMany(mappedBy = "coach", cascade = CascadeType.ALL)
    @JsonIgnore // 或 @JsonBackReference
    private List<ClassSession> coachSessions;
}