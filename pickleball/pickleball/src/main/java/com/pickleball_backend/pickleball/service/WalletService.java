// WalletService.java
package com.pickleball_backend.pickleball.service;

import com.pickleball_backend.pickleball.dto.TopUpRequestDto;
import com.pickleball_backend.pickleball.entity.*;
import com.pickleball_backend.pickleball.exception.*;
import com.pickleball_backend.pickleball.repository.*;
import lombok.RequiredArgsConstructor;
import com.pickleball_backend.pickleball.exception.ResourceNotFoundException;
import org.hibernate.service.spi.ServiceException;
import org.springframework.dao.DataAccessException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;
import lombok.extern.slf4j.Slf4j;

@Service
@Slf4j
@RequiredArgsConstructor
public class WalletService {

    private final WalletRepository walletRepository;
    private final PaymentRepository paymentRepository;
    private final UserAccountRepository userAccountRepository;
    private final MemberRepository memberRepository;
    private final EmailService emailService;

    // Wallet balance limit (RM1000)
    private static final double WALLET_LIMIT = 1000.00;

    @Transactional
    public Double topUpWallet(TopUpRequestDto request) {
        // 1. Get authenticated user
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        UserAccount account = userAccountRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User account not found"));

        // 2. Get member
        Member member = memberRepository.findByUserId(account.getUser().getId());
        if (member == null) {
            throw new ResourceNotFoundException("Member not found");
        }

        // 3. Get wallet (create if missing)
        Wallet wallet = walletRepository.findByMemberId(member.getId())
                .orElseGet(() -> {
                    Wallet newWallet = new Wallet();
                    newWallet.setMember(member);
                    newWallet.setBalance(0.00);
                    return walletRepository.save(newWallet);
                });

        // 4. Validate source credit if using internal credit
        if ("INTERNAL_CREDIT".equals(request.getSource())) {
            // Convert to integer for point balance
            int pointsToDeduct = (int) Math.round(request.getAmount());

            if (member.getPointBalance() < pointsToDeduct) {
                throw new ValidationException(
                        "Insufficient internal credit. Available: " + member.getPointBalance()
                );
            }
            // Deduct from points
            member.setPointBalance(member.getPointBalance() - pointsToDeduct);
            memberRepository.save(member);
        }

        // 5. Check wallet limit
        double newBalance = wallet.getBalance() + request.getAmount();
        if (newBalance > WALLET_LIMIT) {
            throw new ValidationException(
                    "Top-up exceeds maximum wallet balance allowed (RM" + WALLET_LIMIT + ")"
            );
        }

        // 6. Update wallet balance
        wallet.setBalance(newBalance);
        walletRepository.save(wallet);

        // 7. Create payment record
        Payment payment = new Payment();
        payment.setAmount(request.getAmount());
        payment.setPaymentDate(LocalDate.now());
        payment.setStatus("COMPLETED");
        payment.setPaymentType("TOP_UP");
        payment.setPaymentMethod(request.getSource());
        payment.setTransactionId("TX-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
        paymentRepository.save(payment);

        // 8. Send confirmation
        emailService.sendTopUpConfirmation(
                account.getUser().getEmail(),
                request.getAmount(),
                newBalance,
                request.getSource(),
                payment.getTransactionId()
        );

        return newBalance;
    }


    @Transactional
    public Double getWalletBalance(String username) {
        log.info("Fetching wallet balance for user: {}", username);

        try {
            // 1. Get user account
            UserAccount account = userAccountRepository.findByUsername(username)
                    .orElseThrow(() -> {
                        log.error("User account not found: {}", username);
                        return new ResourceNotFoundException("User account not found");
                    });

            // 2. Get member
            Member member = memberRepository.findByUserId(account.getUser().getId());
            if (member == null) {
                log.error("Member not found for user: {}", username);
                throw new ResourceNotFoundException("Member not found");
            }

            // 3. Get or create wallet
            Optional<Wallet> walletOpt = walletRepository.findByMemberId(member.getId());

            if (walletOpt.isEmpty()) {
                log.info("Creating new wallet for member: {}", member.getId());
                Wallet newWallet = new Wallet();
                newWallet.setMember(member);
                newWallet.setBalance(100.00);

                try {
                    Wallet savedWallet = walletRepository.save(newWallet);
                    log.info("Created new wallet with balance: {}", savedWallet.getBalance());
                    return savedWallet.getBalance();
                } catch (DataAccessException e) {
                    log.error("Failed to create wallet for member {}: {}", member.getId(), e.getMessage());
                    throw new ServiceException("Failed to create wallet");
                }
            }

            // 4. Return existing balance
            Wallet wallet = walletOpt.get();
            log.info("Found existing wallet balance: {} for user: {}", wallet.getBalance(), username);
            return wallet.getBalance();

        } catch (ResourceNotFoundException e) {
            // Re-throw these as they're already logged
            throw e;
        } catch (Exception e) {
            // Catch-all for unexpected exceptions
            log.error("Unexpected error fetching wallet balance for {}: {}", username, e.getMessage());
            throw new ServiceException("Error retrieving wallet balance", e);
        }
    }
}