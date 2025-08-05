package com.pickleball_backend.pickleball.repository;

import com.pickleball_backend.pickleball.entity.VoucherRedemption;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface VoucherRedemptionRepository extends JpaRepository<VoucherRedemption, Integer> {
    
    // Find all redemptions by user ID
    List<VoucherRedemption> findByUserIdOrderByRedemptionDateDesc(Integer userId);
    
    // Find active redemptions by user ID
    List<VoucherRedemption> findByUserIdAndStatusOrderByRedemptionDateDesc(Integer userId, String status);
    
    // Find redemptions by voucher ID and user ID
    List<VoucherRedemption> findByVoucherIdAndUserId(Integer voucherId, Integer userId);
    
    // Check if user has already redeemed a specific voucher
    boolean existsByVoucherIdAndUserId(Integer voucherId, Integer userId);
    
    // Find expired redemptions
    @Query("SELECT vr FROM VoucherRedemption vr WHERE vr.expiryDate < :currentDate AND vr.status = :status")
    List<VoucherRedemption> findExpiredRedemptions(@Param("currentDate") LocalDate currentDate, @Param("status") String status);
    
    // Count active redemptions by user
    long countByUserIdAndStatus(Integer userId, String status);
    
    // Find redemptions by status
    List<VoucherRedemption> findByStatus(String status);
    
    // Find redemptions by user ID and multiple statuses (for active and restored vouchers)
    @Query("SELECT vr FROM VoucherRedemption vr WHERE vr.userId = :userId AND vr.status IN (:statuses) ORDER BY vr.redemptionDate DESC")
    List<VoucherRedemption> findByUserIdAndStatusInOrderByRedemptionDateDesc(@Param("userId") Integer userId, @Param("statuses") List<String> statuses);
} 