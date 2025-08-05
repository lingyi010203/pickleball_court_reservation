package com.pickleball_backend.pickleball.service;

import com.pickleball_backend.pickleball.dto.VoucherRedemptionDto;
import com.pickleball_backend.pickleball.entity.*;
import com.pickleball_backend.pickleball.exception.ResourceNotFoundException;
import com.pickleball_backend.pickleball.exception.ValidationException;
import com.pickleball_backend.pickleball.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class VoucherRedemptionServiceImpl implements VoucherRedemptionService {

    private final VoucherRedemptionRepository redemptionRepository;
    private final VoucherRepository voucherRepository;
    private final UserAccountRepository userAccountRepository;
    private final MemberRepository memberRepository;
    private final EmailService emailService;

    @Override
    @Transactional
    public VoucherRedemptionDto redeemVoucher(Integer voucherId) {
        // Get current user
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        UserAccount account = userAccountRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User account not found"));
        User user = account.getUser();
        Member member = memberRepository.findByUserId(user.getId());

        if (member == null) {
            throw new ResourceNotFoundException("Member not found");
        }

        // Get voucher
        Voucher voucher = voucherRepository.findById(voucherId)
                .orElseThrow(() -> new ResourceNotFoundException("Voucher not found"));

        // Validate voucher
        if (voucher.getTier() != null) {
            // Tier-specific voucher - check if user's tier matches
            if (member.getTier() == null || member.getTier().getId() == null ||
                !voucher.getTier().getId().equals(member.getTier().getId())) {
                throw new ValidationException("Voucher not available for your tier");
            }
        }
        // General voucher (tier == null) is available to all tiers

        if (member.getRewardPointBalance() < voucher.getRequestPoints()) {
            throw new ValidationException("Insufficient reward points");
        }

        // Check if user has already redeemed this voucher
        // For 0-point vouchers, only allow one redemption per user
        // For other vouchers, allow multiple redemptions
        if (voucher.getRequestPoints() == 0) {
            if (redemptionRepository.existsByVoucherIdAndUserId(voucherId, user.getId())) {
                throw new ValidationException("You have already redeemed this voucher");
            }
        }
        // For non-zero point vouchers, allow multiple redemptions (no check needed)

        // Check expiry date
        if (voucher.getExpiryDate() != null && 
            !voucher.getExpiryDate().equals(LocalDate.of(1970, 1, 1)) && 
            voucher.getExpiryDate().isBefore(LocalDate.now())) {
            throw new ValidationException("Voucher has expired");
        }

        // Deduct reward points
        member.setRewardPointBalance(member.getRewardPointBalance() - voucher.getRequestPoints());
        memberRepository.save(member);

        // Create redemption record
        VoucherRedemption redemption = new VoucherRedemption();
        redemption.setVoucherId(voucherId);
        redemption.setUserId(user.getId());
        redemption.setRedemptionDate(LocalDate.now());
        
        // Set expiry date (30 days from redemption if voucher has no expiry, otherwise use voucher expiry)
        LocalDate redemptionExpiry;
        if (voucher.getExpiryDate() == null || voucher.getExpiryDate().equals(LocalDate.of(1970, 1, 1))) {
            redemptionExpiry = LocalDate.now().plusDays(30);
        } else {
            redemptionExpiry = voucher.getExpiryDate();
        }
        redemption.setExpiryDate(redemptionExpiry);
        redemption.setStatus(VoucherRedemption.STATUS_ACTIVE);

        redemption = redemptionRepository.save(redemption);

        // Generate unique voucher code
        String uniqueCode = voucher.getCode() + "-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();

        // Send confirmation email
        emailService.sendVoucherEmail(
                user.getEmail(),
                "Voucher Redemption Confirmation",
                "You successfully redeemed voucher: " + uniqueCode + 
                "\nDiscount: " + (voucher.getDiscountType().equals("percentage") ? 
                    voucher.getDiscountValue() + "%" : "RM" + voucher.getDiscountValue()) +
                "\nExpires: " + redemptionExpiry +
                "\nNew reward points balance: " + member.getRewardPointBalance() + " points"
        );

        log.info("User {} redeemed voucher {} for {} points", user.getEmail(), voucher.getCode(), voucher.getRequestPoints());

        return mapToDto(redemption, voucher, user);
    }

    @Override
    @Transactional(readOnly = true)
    public List<VoucherRedemptionDto> getUserRedemptions() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        UserAccount account = userAccountRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User account not found"));
        User user = account.getUser();

        List<VoucherRedemption> redemptions = redemptionRepository.findByUserIdOrderByRedemptionDateDesc(user.getId());
        
        return redemptions.stream()
                .map(redemption -> {
                    Voucher voucher = voucherRepository.findById(redemption.getVoucherId()).orElse(null);
                    return mapToDto(redemption, voucher, user);
                })
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<VoucherRedemptionDto> getUserActiveRedemptions() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        UserAccount account = userAccountRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User account not found"));
        User user = account.getUser();

        // Get both ACTIVE and RESTORED vouchers
        List<String> activeStatuses = List.of(VoucherRedemption.STATUS_ACTIVE, VoucherRedemption.STATUS_RESTORED);
        List<VoucherRedemption> redemptions = redemptionRepository.findByUserIdAndStatusInOrderByRedemptionDateDesc(
                user.getId(), activeStatuses);
        
        return redemptions.stream()
                .map(redemption -> {
                    Voucher voucher = voucherRepository.findById(redemption.getVoucherId()).orElse(null);
                    return mapToDto(redemption, voucher, user);
                })
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public VoucherRedemptionDto useVoucher(Integer redemptionId) {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        UserAccount account = userAccountRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User account not found"));
        User user = account.getUser();

        VoucherRedemption redemption = redemptionRepository.findById(redemptionId)
                .orElseThrow(() -> new ResourceNotFoundException("Redemption not found"));

        // Verify ownership
        if (!redemption.getUserId().equals(user.getId())) {
            throw new ValidationException("You can only use your own vouchers");
        }

        // Check status
        if (!VoucherRedemption.STATUS_ACTIVE.equals(redemption.getStatus())) {
            throw new ValidationException("Voucher is not active");
        }

        // Check expiry
        if (redemption.getExpiryDate() != null && redemption.getExpiryDate().isBefore(LocalDate.now())) {
            redemption.setStatus(VoucherRedemption.STATUS_USED);
            redemptionRepository.save(redemption);
            throw new ValidationException("Voucher has expired");
        }

        // Mark as used
        redemption.setStatus(VoucherRedemption.STATUS_USED);
        redemption = redemptionRepository.save(redemption);

        Voucher voucher = voucherRepository.findById(redemption.getVoucherId()).orElse(null);
        
        log.info("User {} used voucher redemption {}", user.getEmail(), redemptionId);
        
        return mapToDto(redemption, voucher, user);
    }

    @Override
    @Transactional(readOnly = true)
    public VoucherRedemptionDto getRedemptionById(Integer redemptionId) {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        UserAccount account = userAccountRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User account not found"));
        User user = account.getUser();

        VoucherRedemption redemption = redemptionRepository.findById(redemptionId)
                .orElseThrow(() -> new ResourceNotFoundException("Redemption not found"));

        // Verify ownership
        if (!redemption.getUserId().equals(user.getId())) {
            throw new ValidationException("You can only view your own vouchers");
        }

        Voucher voucher = voucherRepository.findById(redemption.getVoucherId()).orElse(null);
        return mapToDto(redemption, voucher, user);
    }

    @Override
    @Transactional(readOnly = true)
    public boolean canRedeemVoucher(Integer voucherId) {
        try {
            String username = SecurityContextHolder.getContext().getAuthentication().getName();
            UserAccount account = userAccountRepository.findByUsername(username)
                    .orElseThrow(() -> new ResourceNotFoundException("User account not found"));
            User user = account.getUser();
            Member member = memberRepository.findByUserId(user.getId());

            if (member == null) return false;

            Voucher voucher = voucherRepository.findById(voucherId)
                    .orElseThrow(() -> new ResourceNotFoundException("Voucher not found"));

            // Check if already redeemed
            if (voucher.getRequestPoints() == 0) {
                if (redemptionRepository.existsByVoucherIdAndUserId(voucherId, user.getId())) {
                    return false;
                }
            }
            // For non-zero point vouchers, allow multiple redemptions (no check needed)
            
            // Check tier and points
            boolean tierValid = true;
            if (voucher.getTier() != null) {
                // Tier-specific voucher - check if user's tier matches
                tierValid = member.getTier() != null && member.getTier().getId() != null &&
                           voucher.getTier().getId().equals(member.getTier().getId());
            }
            // General voucher (tier == null) is available to all tiers
            
            return tierValid && member.getRewardPointBalance() >= voucher.getRequestPoints();
        } catch (Exception e) {
            return false;
        }
    }

    @Override
    @Transactional
    public void processExpiredRedemptions() {
        List<VoucherRedemption> expiredRedemptions = redemptionRepository.findExpiredRedemptions(LocalDate.now(), VoucherRedemption.STATUS_ACTIVE);
        
        for (VoucherRedemption redemption : expiredRedemptions) {
            redemption.setStatus(VoucherRedemption.STATUS_USED);
            redemptionRepository.save(redemption);
            log.info("Marked redemption {} as expired", redemption.getId());
        }
    }

    private VoucherRedemptionDto mapToDto(VoucherRedemption redemption, Voucher voucher, User user) {
        VoucherRedemptionDto dto = new VoucherRedemptionDto();
        dto.setId(redemption.getId());
        dto.setVoucherId(redemption.getVoucherId());
        dto.setUserId(redemption.getUserId());
        dto.setRedemptionDate(redemption.getRedemptionDate());
        dto.setExpiryDate(redemption.getExpiryDate());
        dto.setStatus(redemption.getStatus().toUpperCase());  // Convert to uppercase for frontend
        dto.setUserName(user.getName());

        if (voucher != null) {
            dto.setVoucherCode(voucher.getCode());
            dto.setDiscountType(voucher.getDiscountType());
            dto.setDiscountValue(voucher.getDiscountValue());
            
            // Create title based on discount type
            if (voucher.getDiscountType().equals("percentage")) {
                dto.setVoucherTitle(voucher.getDiscountValue() + "% Discount");
            } else {
                dto.setVoucherTitle("RM" + voucher.getDiscountValue() + " Discount");
            }
            
            dto.setVoucherDescription("Special offer for members");
        }

        return dto;
    }
} 