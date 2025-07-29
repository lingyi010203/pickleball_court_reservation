package com.pickleball_backend.pickleball.controller;

import com.pickleball_backend.pickleball.service.EscrowAccountService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/escrow")
@RequiredArgsConstructor
public class EscrowAccountController {

    private final EscrowAccountService escrowAccountService;

    /**
     * 獲取託管帳戶摘要（僅管理員可查看）
     */
    @GetMapping("/summary")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> getEscrowSummary() {
        double platformEscrowBalance = escrowAccountService.getPlatformEscrowBalance();
        double platformRevenue = escrowAccountService.getPlatformRevenue();
        double coachRevenue = escrowAccountService.getCoachRevenue();
        
        Map<String, Object> response = new HashMap<>();
        response.put("platformEscrowBalance", platformEscrowBalance);
        response.put("platformRevenue", platformRevenue);
        response.put("coachRevenue", coachRevenue);
        response.put("totalRevenue", platformRevenue + coachRevenue);
        response.put("currency", "MYR");
        
        return ResponseEntity.ok(response);
    }

    /**
     * 獲取平台託管餘額（僅管理員可查看）
     */
    @GetMapping("/platform-escrow-balance")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> getPlatformEscrowBalance() {
        double balance = escrowAccountService.getPlatformEscrowBalance();
        
        Map<String, Object> response = new HashMap<>();
        response.put("accountType", "PLATFORM_ESCROW");
        response.put("balance", balance);
        response.put("currency", "MYR");
        
        return ResponseEntity.ok(response);
    }

    /**
     * 獲取平台收入（僅管理員可查看）
     */
    @GetMapping("/platform-revenue")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> getPlatformRevenue() {
        double revenue = escrowAccountService.getPlatformRevenue();
        
        Map<String, Object> response = new HashMap<>();
        response.put("accountType", "PLATFORM_REVENUE");
        response.put("revenue", revenue);
        response.put("currency", "MYR");
        
        return ResponseEntity.ok(response);
    }

    /**
     * 獲取教練收入（僅管理員可查看）
     */
    @GetMapping("/coach-revenue")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> getCoachRevenue() {
        double revenue = escrowAccountService.getCoachRevenue();
        
        Map<String, Object> response = new HashMap<>();
        response.put("accountType", "COACH_REVENUE");
        response.put("revenue", revenue);
        response.put("currency", "MYR");
        
        return ResponseEntity.ok(response);
    }
} 