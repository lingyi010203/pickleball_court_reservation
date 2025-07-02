// Registration.java
package com.pickleball_backend.pickleball.entity;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Data
@Table(name = "registration")
public class Registration {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Integer id;

    // Fix: Change referencedColumnName to "user_id"
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "member_id", referencedColumnName = "user_id")
    private Member member;
}