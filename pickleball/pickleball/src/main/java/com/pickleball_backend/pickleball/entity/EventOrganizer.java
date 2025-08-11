package com.pickleball_backend.pickleball.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.ToString;

@Entity
@Data
@Table(name = "eventorganizer")
public class EventOrganizer {
    @Id
    private Integer id; // Will be set by @MapsId

    @OneToOne(fetch = FetchType.EAGER)
    @MapsId
    @JoinColumn(name = "user_id")
    @ToString.Exclude
    private User user;

    @Column(name = "organizerRating")
    private Double organizerRating;
}
