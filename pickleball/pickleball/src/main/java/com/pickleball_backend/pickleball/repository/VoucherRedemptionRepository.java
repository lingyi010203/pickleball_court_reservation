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
    @Query("SELECT vr FROM VoucherRedemption vr WHERE vr.expiryDate < :currentDate AND vr.status = 'active'")
    List<VoucherRedemption> findExpiredRedemptions(@Param("currentDate") LocalDate currentDate);
    
    // Count active redemptions by user
    long countByUserIdAndStatus(Integer userId, String status);
} 