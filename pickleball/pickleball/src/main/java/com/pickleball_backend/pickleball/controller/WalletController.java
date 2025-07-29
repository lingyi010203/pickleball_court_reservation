// WalletController.java
package com.pickleball_backend.pickleball.controller;

import com.pickleball_backend.pickleball.dto.TopUpRequestDto;
import com.pickleball_backend.pickleball.dto.WalletTransactionDto;
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
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@Slf4j
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
    public ResponseEntity<?> getWalletBalance() {
        try {
            String username = SecurityContextHolder.getContext().getAuthentication().getName();
            Double balance = walletService.getWalletBalance(username);
            return ResponseEntity.ok().body(
                    Map.of(
                            "balance", balance,
                            "username", username
                    )
            );
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(
                    Map.of("error", "Error fetching wallet balance: " + e.getMessage())
            );
        }
    }

    @GetMapping("/transactions")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<?> getWalletTransactions(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        try {
            String username = SecurityContextHolder.getContext().getAuthentication().getName();
            Pageable pageable = PageRequest.of(page, size);
            WalletTransactionDto transactions = walletService.getWalletTransactions(username, pageable);
            return ResponseEntity.ok().body(transactions);
        } catch (ValidationException e) {
            return ResponseEntity.badRequest().body(
                    Map.of("error", e.getMessage())
            );
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(
                    Map.of("error", "Error fetching transactions: " + e.getMessage())
            );
        }
    }

    @PostMapping("/refund")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<?> processRefund(
            @RequestParam Integer paymentId,
            @RequestParam Double amount,
            @RequestParam String reason) {
        try {
            walletService.processRefund(paymentId, amount, reason);
            return ResponseEntity.ok().body(
                    Map.of("message", "Refund processed successfully")
            );
        } catch (ValidationException e) {
            return ResponseEntity.badRequest().body(
                    Map.of("error", e.getMessage())
            );
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(
                    Map.of("error", "Error processing refund: " + e.getMessage())
            );
        }
    }

    @GetMapping("/details")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<?> getWalletDetails() {
        try {
            String username = SecurityContextHolder.getContext().getAuthentication().getName();
            UserAccount account = userAccountRepository.findByUsername(username)
                    .orElseThrow(() -> new ResourceNotFoundException("User account not found"));

            Member member = memberRepository.findByUserId(account.getUser().getId());
            if (member == null) {
                throw new ResourceNotFoundException("Member not found");
            }

            Wallet wallet = walletRepository.findByMemberId(member.getId())
                    .orElseThrow(() -> new ResourceNotFoundException("Wallet not found"));

            Map<String, Object> details = new HashMap<>();
            details.put("walletId", wallet.getId());
            details.put("balance", wallet.getBalance());
            details.put("frozenBalance", wallet.getFrozenBalance());
            details.put("totalDeposited", wallet.getTotalDeposited());
            details.put("totalSpent", wallet.getTotalSpent());
            details.put("status", wallet.getStatus());
            details.put("lastUpdated", wallet.getLastUpdated());
            details.put("availableBalance", wallet.getBalance() - wallet.getFrozenBalance());
            
            log.info("Wallet details for user {}: totalSpent={}, balance={}", username, wallet.getTotalSpent(), wallet.getBalance());

            return ResponseEntity.ok().body(details);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(
                    Map.of("error", "Error fetching wallet details: " + e.getMessage())
            );
        }
    }
}