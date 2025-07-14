package com.pickleball_backend.pickleball.entity;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Entity
@Table(name = "membershiptier")
@Data
@NoArgsConstructor
public class MembershipTier {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    private String benefits;

    @Column(name = "tier_name") // 映射到 tier_name 列
    private String tierName; // 改为 String 类型

    @Column(name = "min_points")
    private int minPoints;

    @Column(name = "max_points")
    private int maxPoints;

    private boolean active;
}