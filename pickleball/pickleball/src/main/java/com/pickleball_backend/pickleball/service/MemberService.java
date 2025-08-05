package com.pickleball_backend.pickleball.service;

import com.pickleball_backend.pickleball.dto.*;
import com.pickleball_backend.pickleball.entity.*;
import com.pickleball_backend.pickleball.exception.*;
import com.pickleball_backend.pickleball.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;
import java.util.ArrayList;

@Service
@RequiredArgsConstructor
public class MemberService {

    private final MemberRepository memberRepository;
    private final MembershipTierRepository tierRepository;
    private final UserAccountRepository userAccountRepository;
    private final VoucherRepository voucherRepository;
    private final WalletRepository walletRepository;
    private final EmailService emailService;
    private final TierService tierService;

    public MemberDashboardDto getMemberDashboard() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        UserAccount account = userAccountRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User account not found"));

        User user = account.getUser();
        Member member = memberRepository.findByUserId(user.getId());

        if (member == null) {
            throw new ResourceNotFoundException("Member not found");
        }

        if (member.getTier() == null) {
            // Try to auto-assign tier first
            tierService.recalculateMemberTier(member);
            member = memberRepository.findByUserId(user.getId()); // Refresh
        }

        if (member.getTier() == null) {
            // 使用字符串查询默认层
            MembershipTier defaultTier = tierRepository.findByTierName("BRONZE");
            if (defaultTier == null) {
                throw new ResourceNotFoundException("Default BRONZE tier not found");
            }
            member.setTier(defaultTier);
            memberRepository.save(member);
        }

        if (member.getWallet() == null) {
            initializeWallet(member.getId()); // Initialize if missing
        }

        // Add debug logging
        System.out.println("=== MemberService Debug ===");
        System.out.println("Member ID: " + member.getId());
        System.out.println("Member Tier ID: " + (member.getTier() != null ? member.getTier().getId() : "NULL"));
        System.out.println("Member Tier Name: " + (member.getTier() != null ? member.getTier().getTierName() : "NULL"));
        System.out.println("Member Point Balance: " + member.getTierPointBalance());

        // Get vouchers for current tier
        List<Voucher> tierVouchers = voucherRepository.findByTierIdAndMemberIsNull(member.getTier().getId());
        
        // Get vouchers with no tier restriction (available to all users)
        List<Voucher> noTierVouchers = voucherRepository.findByTierIsNullAndMemberIsNull();
        
        // Combine both lists
        List<Voucher> allVouchers = new ArrayList<>();
        allVouchers.addAll(tierVouchers);
        allVouchers.addAll(noTierVouchers);
        
        System.out.println("Found " + tierVouchers.size() + " vouchers for tier " + member.getTier().getId());
        System.out.println("Found " + noTierVouchers.size() + " vouchers with no tier restriction");
        System.out.println("Total vouchers: " + allVouchers.size());
        
        allVouchers.forEach(v -> {
            System.out.println("Voucher ID: " + v.getId() + 
                             ", Code: " + v.getCode() + 
                             ", Tier: " + (v.getTier() != null ? v.getTier().getTierName() : "NO TIER") +
                             ", Expiry: " + v.getExpiryDate() + 
                             ", Points: " + v.getRequestPoints());
        });

        List<VoucherDto> redeemableVouchers = allVouchers.stream()
                .filter(v -> {
                    // Handle null or default dates as never expiring
                    if (v.getExpiryDate() == null) {
                        System.out.println("Voucher " + v.getCode() + " has no expiry date - INCLUDED");
                        return true;
                    }
                    if (v.getExpiryDate().equals(LocalDate.of(1970, 1, 1))) {
                        System.out.println("Voucher " + v.getCode() + " has default expiry date - INCLUDED");
                        return true;
                    }
                    
                    boolean isExpired = v.getExpiryDate().isBefore(LocalDate.now());
                    System.out.println("Voucher " + v.getCode() + " expires on " + v.getExpiryDate() + 
                                     ", today is " + LocalDate.now() + ", isExpired: " + isExpired + 
                                     (isExpired ? " - EXCLUDED" : " - INCLUDED"));
                    return !isExpired;
                })
                .map(v -> new VoucherDto(
                        v.getId(),
                        v.getCode(),
                        v.getDiscountValue(),  // Changed from getDiscountAmount()
                        v.getDiscountType(),  // Added discount type
                        v.getRequestPoints(),
                        v.getTier() != null ? v.getTier().getTierName() : null,  // Added tierName
                        v.getExpiryDate()
                ))
                .collect(Collectors.toList());
        
        System.out.println("After filtering by expiry date: " + redeemableVouchers.size() + " vouchers");

        return new MemberDashboardDto(
                member.getTier().getTierName(), // 直接返回字符串值
                member.getTierPointBalance(),
                member.getRewardPointBalance(),  // 新增 reward points
                member.getTier().getBenefits(),
                redeemableVouchers,
                member.getTier().getMinPoints(),
                member.getTier().getMaxPoints()
        );
    }

    public Integer getMemberIdByUsername(String username) {
        UserAccount account = userAccountRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User account not found"));
        Member member = memberRepository.findByUserId(account.getUser().getId());
        return member.getId();
    }

    @Transactional
    public VoucherRedemptionResponse redeemVoucher(Integer voucherId) {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        UserAccount account = userAccountRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User account not found"));

        User user = account.getUser();
        Member member = memberRepository.findByUserId(user.getId());

        if (member == null) {
            throw new ResourceNotFoundException("Member not found");
        }

        if (member.getTier() == null) {
            throw new ValidationException("No tier assigned to member");
        }

        Voucher voucher = voucherRepository.findById(voucherId)
                .orElseThrow(() -> new ResourceNotFoundException("Voucher not found"));

        // Validate voucher
        if (voucher.getTier() != null && voucher.getTier().getId() != null) {
            // Voucher has tier restriction - check if user's tier matches
            if (member.getTier() == null || member.getTier().getId() == null ||
                !voucher.getTier().getId().equals(member.getTier().getId())) {
                throw new ValidationException("Voucher not available for your tier");
            }
        }
        // If voucher.getTier() is null, it means no tier restriction - all users can redeem
        
        if (member.getTierPointBalance() < voucher.getRequestPoints()) {
            throw new ValidationException("Insufficient points");
        }
        if (voucher.getExpiryDate() != null && 
            !voucher.getExpiryDate().equals(LocalDate.of(1970, 1, 1)) && 
            voucher.getExpiryDate().isBefore(LocalDate.now())) {
            throw new ValidationException("Voucher has expired");
        }

        // Deduct points
        member.setTierPointBalance(member.getTierPointBalance() - voucher.getRequestPoints());
        memberRepository.save(member);

        // Recalculate tier
        tierService.recalculateMemberTier(member);

        // Generate unique voucher code
        String uniqueCode = voucher.getCode() + "-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();

        // Create redeemed voucher
        Voucher redeemedVoucher = new Voucher();
        redeemedVoucher.setCode(uniqueCode);
        redeemedVoucher.setDiscountValue(voucher.getDiscountValue());  // Changed from getDiscountAmount()
        redeemedVoucher.setDiscountType(voucher.getDiscountType());    // Added discount type
        redeemedVoucher.setRequestPoints(voucher.getRequestPoints());
        redeemedVoucher.setExpiryDate(voucher.getExpiryDate());
        redeemedVoucher.setTier(voucher.getTier());
        redeemedVoucher.setMember(member);
        voucherRepository.save(redeemedVoucher);

        // Send confirmation email
        emailService.sendVoucherEmail(
                user.getEmail(),
                "Voucher Redemption Confirmation",
                "You redeemed voucher: " + uniqueCode + "\nNew balance: " + member.getTierPointBalance() + " points"
        );

        return new VoucherRedemptionResponse(
                uniqueCode,
                voucher.getExpiryDate(),
                member.getTierPointBalance()
        );
    }

    @Transactional
    public void addPoints(int points) {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        UserAccount account = userAccountRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User account not found"));

        Member member = memberRepository.findByUserId(account.getUser().getId());
        
        // Store old tier for comparison
        String oldTierName = member.getTier() != null ? member.getTier().getTierName() : "NONE";
        
        member.setTierPointBalance(member.getTierPointBalance() + points);
        memberRepository.save(member);

        // Automatic tier upgrade check
        tierService.recalculateMemberTier(member);
        
        // Refresh member data to get updated tier
        member = memberRepository.findByUserId(account.getUser().getId());
        String newTierName = member.getTier() != null ? member.getTier().getTierName() : "NONE";
        
        // Log tier upgrade if it occurred
        if (!oldTierName.equals(newTierName)) {
            // Assuming log is available, otherwise remove this line
            // log.info("Automatic tier upgrade: {} -> {} (Points: {} -> {})", 
            //         oldTierName, newTierName, member.getPointBalance() - points, member.getPointBalance());
        }
    }

    public List<TierDto> getAllAvailableTiers() {
        return tierService.getAllTiers().stream()
                .map(tier -> {
                    TierDto dto = new TierDto();
                    dto.setId(tier.getId());
                    // 直接使用字符串值
                    dto.setTierName(tier.getTierName());
                    dto.setBenefits(tier.getBenefits());
                    dto.setMinPoints(tier.getMinPoints());
                    dto.setMaxPoints(tier.getMaxPoints());
                    dto.setActive(tier.isActive());
                    return dto;
                })
                .collect(Collectors.toList());
    }

    public List<VoucherDto> getRedeemHistory() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        UserAccount account = userAccountRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User account not found"));

        User user = account.getUser();
        Member member = memberRepository.findByUserId(user.getId());

        if (member == null) {
            throw new ResourceNotFoundException("Member not found");
        }

        // Get all vouchers associated with the member
        List<Voucher> redeemedVouchers = voucherRepository.findByMemberIdIsNotNull();

        return redeemedVouchers.stream()
                .filter(v -> v.getMember().getId().equals(member.getId())) // Filter by current member
                .map(v -> new VoucherDto(
                        v.getId(),
                        v.getCode(),
                        v.getDiscountValue(),  // Changed from getDiscountAmount()
                        v.getDiscountType(),  // Added discount type
                        v.getRequestPoints(),
                        v.getTier() != null ? v.getTier().getTierName() : null,  // Added tierName
                        v.getExpiryDate()
                ))
                .collect(Collectors.toList());
    }

    @Transactional
    public void initializeWallet(Integer memberId) {
        Wallet wallet = new Wallet();
        wallet.setBalance(0.00); // Initial balance
        wallet.setMember(memberRepository.findById(memberId).orElseThrow());
        walletRepository.save(wallet);
    }
}