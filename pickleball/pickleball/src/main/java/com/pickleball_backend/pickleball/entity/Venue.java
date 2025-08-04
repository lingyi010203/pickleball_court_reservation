package com.pickleball_backend.pickleball.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import lombok.Data;

import java.util.ArrayList;
import java.util.List;

@Entity
@Data
@Table(name = "venue")
public class Venue {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    private String name;

    private String location;

    @Column(name = "state", length = 100)
    private String state;

    private String description;

    private Boolean isArchived = false;

    @OneToMany(mappedBy = "venue", cascade = CascadeType.ALL)
    @JsonIgnore
    private List<Court> courts = new ArrayList<>();}

