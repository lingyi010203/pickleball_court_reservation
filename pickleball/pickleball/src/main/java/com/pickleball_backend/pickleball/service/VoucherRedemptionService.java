package com.pickleball_backend.pickleball.service;

import com.pickleball_backend.pickleball.dto.VoucherRedemptionDto;
import com.pickleball_backend.pickleball.entity.VoucherRedemption;

import java.util.List;

public interface VoucherRedemptionService {
    
    // Redeem a voucher for the current user
    VoucherRedemptionDto redeemVoucher(Integer voucherId);
    
    // Get all redemptions for the current user
    List<VoucherRedemptionDto> getUserRedemptions();
    
    // Get active redemptions for the current user
    List<VoucherRedemptionDto> getUserActiveRedemptions();
    
    // Use a redeemed voucher
    VoucherRedemptionDto useVoucher(Integer redemptionId);
    
    // Get redemption by ID
    VoucherRedemptionDto getRedemptionById(Integer redemptionId);
    
    // Check if user can redeem a specific voucher
    boolean canRedeemVoucher(Integer voucherId);
    
    // Process expired redemptions (scheduled task)
    void processExpiredRedemptions();
} 