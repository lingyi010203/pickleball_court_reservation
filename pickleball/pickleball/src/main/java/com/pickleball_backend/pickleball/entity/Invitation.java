package com.pickleball_backend.pickleball.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.ToString;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Data
@Table(name = "invitations")
public class Invitation {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    private String email;
    private String role;
    private String token = UUID.randomUUID().toString();
    private LocalDateTime createdAt = LocalDateTime.now();
    private LocalDateTime expiresAt = LocalDateTime.now().plusDays(7);
    private boolean used = false;

    @ManyToOne
    @JoinColumn(name = "admin_id")
    @ToString.Exclude
    private Admin createdBy;
}
