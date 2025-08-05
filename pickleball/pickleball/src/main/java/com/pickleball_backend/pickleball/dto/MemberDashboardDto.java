package com.pickleball_backend.pickleball.dto;

import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class MemberDashboardDto {
    private String tierName;
    private int tierPointBalance;  // 改名為更明確的名稱
    private int rewardPointBalance;  // 新增 reward points 字段
    private String benefits;
    private List<VoucherDto> redeemableVouchers;
    private int minPoints;  // Add this
    private int maxPoints;  // Add this
}