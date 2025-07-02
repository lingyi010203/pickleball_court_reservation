// WalletController.java
package com.pickleball_backend.pickleball.controller;

import com.pickleball_backend.pickleball.dto.TopUpRequestDto;
import com.pickleball_backend.pickleball.entity.Member;
import com.pickleball_backend.pickleball.entity.UserAccount;
import com.pickleball_backend.pickleball.entity.Wallet;
import com.pickleball_backend.pickleball.exception.ResourceNotFoundException;
import com.pickleball_backend.pickleball.exception.ValidationException;
import com.pickleball_backend.pickleball.repository.MemberRepository;
import com.pickleball_backend.pickleball.repository.UserAccountRepository;
import com.pickleball_backend.pickleball.repository.WalletRepository;
import com.pickleball_backend.pickleball.service.WalletService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/member/wallet")
@RequiredArgsConstructor
public class WalletController {

    private final WalletService walletService;
    private final UserAccountRepository userAccountRepository;
    private final MemberRepository memberRepository;
    private final WalletRepository walletRepository;


    @PostMapping("/topup")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<?> topUpWallet(@RequestBody TopUpRequestDto request) {
        try {
            Double newBalance = walletService.topUpWallet(request);
            return ResponseEntity.ok().body(
                    Map.of(
                            "message", "Top-up successful!",
                            "newBalance", newBalance
                    )
            );
        } catch (ValidationException e) {
            return ResponseEntity.badRequest().body(
                    Map.of("error", e.getMessage())
            );
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(
                    Map.of("error", "Error processing top-up: " + e.getMessage())
            );
        }
    }

    @GetMapping("/balance")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<Map<String, Object>> getWalletBalance() {
        try {
            // 1. Get authenticated username
            String username = SecurityContextHolder.getContext().getAuthentication().getName();

            // 2. Call service to get balance
            Double balance = walletService.getWalletBalance(username);

            // 3. Create response
            Map<String, Object> response = new HashMap<>();
            response.put("status", "success");
            response.put("balance", balance);

            return ResponseEntity.ok(response);
        } catch (ResourceNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("status", "error", "message", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("status", "error", "message", "Failed to retrieve wallet balance"));
        }
    }
}