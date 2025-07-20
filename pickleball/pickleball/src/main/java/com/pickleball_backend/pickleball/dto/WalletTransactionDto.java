package com.pickleball_backend.pickleball.dto;

import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
public class WalletTransactionDto {
    private Integer walletId;
    private double balance;
    private double frozenBalance;
    private double totalDeposited;
    private double totalSpent;
    private List<TransactionDto> transactions;
    private long totalElements;
    private int totalPages;

    @Data
    @Builder
    public static class TransactionDto {
        private Integer id;
        private String transactionType;
        private double amount;
        private double balanceBefore;
        private double balanceAfter;
        private double frozenBefore;
        private double frozenAfter;
        private String referenceType;
        private Integer referenceId;
        private String description;
        private String status;
        private LocalDateTime createdAt;
        private LocalDateTime processedAt;
    }
} 