package com.pickleball_backend.pickleball.controller;

import com.pickleball_backend.pickleball.dto.VoucherRedemptionDto;
import com.pickleball_backend.pickleball.service.VoucherRedemptionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/voucher-redemption")
@RequiredArgsConstructor
public class VoucherRedemptionController {

    private final VoucherRedemptionService redemptionService;

    @PostMapping("/redeem/{voucherId}")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<VoucherRedemptionDto> redeemVoucher(@PathVariable Integer voucherId) {
        VoucherRedemptionDto redemption = redemptionService.redeemVoucher(voucherId);
        return ResponseEntity.ok(redemption);
    }

    @GetMapping("/my-redemptions")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<List<VoucherRedemptionDto>> getMyRedemptions() {
        List<VoucherRedemptionDto> redemptions = redemptionService.getUserRedemptions();
        return ResponseEntity.ok(redemptions);
    }

    @GetMapping("/my-active-redemptions")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<List<VoucherRedemptionDto>> getMyActiveRedemptions() {
        List<VoucherRedemptionDto> redemptions = redemptionService.getUserActiveRedemptions();
        return ResponseEntity.ok(redemptions);
    }

    @PostMapping("/use/{redemptionId}")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<VoucherRedemptionDto> useVoucher(@PathVariable Integer redemptionId) {
        VoucherRedemptionDto redemption = redemptionService.useVoucher(redemptionId);
        return ResponseEntity.ok(redemption);
    }

    @GetMapping("/{redemptionId}")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<VoucherRedemptionDto> getRedemptionById(@PathVariable Integer redemptionId) {
        VoucherRedemptionDto redemption = redemptionService.getRedemptionById(redemptionId);
        return ResponseEntity.ok(redemption);
    }

    @GetMapping("/can-redeem/{voucherId}")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<Boolean> canRedeemVoucher(@PathVariable Integer voucherId) {
        boolean canRedeem = redemptionService.canRedeemVoucher(voucherId);
        return ResponseEntity.ok(canRedeem);
    }
} 