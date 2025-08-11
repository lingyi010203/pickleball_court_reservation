package com.pickleball_backend.pickleball.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.ToString;

import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "coach")
@Data
public class Coach {
    @Id
    @Column(name = "user_id")
    private Integer id;

    @OneToOne
    @MapsId
    @JoinColumn(name = "user_id")
    @ToString.Exclude
    private User user;

    @Column(name = "experience_year")
    private Integer experienceYear;

    @ManyToMany
    @JoinTable(
        name = "coach_venue",
        joinColumns = @JoinColumn(name = "coach_id"),
        inverseJoinColumns = @JoinColumn(name = "venue_id")
    )
    @ToString.Exclude
    private Set<Venue> venues = new HashSet<>();
}
