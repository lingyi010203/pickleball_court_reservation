package com.pickleball_backend.pickleball.dto;

import com.pickleball_backend.pickleball.entity.MembershipTier;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;


@Data
@NoArgsConstructor
@AllArgsConstructor
public class TierDto {
    private int id;
    private String tierName; // 改为 String 类型
    private String benefits;
    private int minPoints;
    private int maxPoints;
    private boolean active;

}