package com.pickleball_backend.pickleball.repository;

import com.pickleball_backend.pickleball.entity.WalletTransaction;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface WalletTransactionRepository extends JpaRepository<WalletTransaction, Integer> {
    
    // Find transactions by wallet ID
    Page<WalletTransaction> findByWalletIdOrderByCreatedAtDesc(Integer walletId, Pageable pageable);
    
    // Find transactions by wallet ID and type
    List<WalletTransaction> findByWalletIdAndTransactionTypeOrderByCreatedAtDesc(Integer walletId, String transactionType);
    
    // Find transactions by reference
    List<WalletTransaction> findByReferenceTypeAndReferenceIdOrderByCreatedAtDesc(String referenceType, Integer referenceId);
    
    // Find pending transactions
    List<WalletTransaction> findByStatusOrderByCreatedAtAsc(String status);
    
    // Find transactions within date range
    @Query("SELECT wt FROM WalletTransaction wt WHERE wt.walletId = :walletId AND wt.createdAt BETWEEN :startDate AND :endDate ORDER BY wt.createdAt DESC")
    List<WalletTransaction> findByWalletIdAndDateRange(@Param("walletId") Integer walletId, 
                                                      @Param("startDate") LocalDateTime startDate, 
                                                      @Param("endDate") LocalDateTime endDate);
    
    // Get transaction summary for wallet
    @Query("SELECT SUM(wt.amount) FROM WalletTransaction wt WHERE wt.walletId = :walletId AND wt.transactionType = :type AND wt.status = 'COMPLETED'")
    Double getTransactionSumByType(@Param("walletId") Integer walletId, @Param("type") String type);
} 