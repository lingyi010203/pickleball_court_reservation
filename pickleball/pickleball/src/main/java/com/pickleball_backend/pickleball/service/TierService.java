package com.pickleball_backend.pickleball.service;

import com.pickleball_backend.pickleball.dto.TierDto;
import com.pickleball_backend.pickleball.dto.VoucherDto;
import com.pickleball_backend.pickleball.entity.MembershipTier;
import com.pickleball_backend.pickleball.entity.Voucher;
import com.pickleball_backend.pickleball.entity.Member;
import java.util.List;

public interface TierService {
    MembershipTier createTier(TierDto tierDto);
    void deleteTier(Integer id);
    MembershipTier addVoucherToTier(String tierName, VoucherDto voucherDto);
    Voucher addGeneralVoucher(VoucherDto voucherDto);
    List<MembershipTier> getAllTiers();
    List<Voucher> getAllVouchers();
    MembershipTier createOrUpdateTier(MembershipTier tier);


    // Add these new methods
    Voucher updateVoucher(Integer voucherId, VoucherDto voucherDto);
    void deleteVoucher(Integer voucherId);
    void toggleTierStatus(Integer tierId, boolean active);
    void recalculateMemberTier(Member member);
}