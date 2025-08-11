package com.pickleball_backend.pickleball.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserStatisticsDto {
    private Integer userId;
    private String username;
    private String name;
    private String email;
    
    // 基本信息统计
    private String userType;
    private String status;
    private String tier;
    private int pointBalance;
    private LocalDateTime createdAt;
    private LocalDateTime lastLoginAt;
    
    // 活动统计
    private long totalBookings;
    private long completedBookings;
    private long cancelledBookings;
    private long totalSpent;
    private long totalFeedbacks;
    private long totalWarnings;
    private long totalWalletTransactions;
    
    // 时间统计
    private long daysSinceRegistration;
    private long daysSinceLastActivity;
    private long averageBookingsPerMonth;
    
    // 评分统计
    private double averageRating;
    private long totalRatings;
    
    // 钱包统计
    private double currentWalletBalance;
    private double totalWalletDeposits;
    private double totalWalletWithdrawals;
    
    // 会员统计
    private String currentTier;
    private int tierPoints;
    private long tierUpgradeCount;
    private LocalDateTime lastTierUpgrade;
    
    // 系统使用统计
    private long totalLoginCount;
    private LocalDateTime lastBookingDate;
    private LocalDateTime lastFeedbackDate;
    
    // 违规统计
    private long warningCount;
    private long suspensionCount;
    private LocalDateTime lastWarningDate;
    private LocalDateTime lastSuspensionDate;
    
    // 扩展统计信息
    private Map<String, Object> additionalStats;
}
