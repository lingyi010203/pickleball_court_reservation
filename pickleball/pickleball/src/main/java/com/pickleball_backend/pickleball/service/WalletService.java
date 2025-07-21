// WalletService.java
package com.pickleball_backend.pickleball.service;

import com.pickleball_backend.pickleball.dto.TopUpRequestDto;
import com.pickleball_backend.pickleball.dto.WalletTransactionDto;
import com.pickleball_backend.pickleball.entity.*;
import com.pickleball_backend.pickleball.exception.*;
import com.pickleball_backend.pickleball.repository.*;
import lombok.RequiredArgsConstructor;
import com.pickleball_backend.pickleball.exception.ResourceNotFoundException;
import org.hibernate.service.spi.ServiceException;
import org.springframework.dao.DataAccessException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;
import lombok.extern.slf4j.Slf4j;

@Service
@Slf4j
@RequiredArgsConstructor
public class WalletService {

    private final WalletRepository walletRepository;
    private final WalletTransactionRepository walletTransactionRepository;
    private final PaymentRepository paymentRepository;
    private final UserAccountRepository userAccountRepository;
    private final MemberRepository memberRepository;
    private final EmailService emailService;

    // Wallet balance limit (RM1000)
    private static final double WALLET_LIMIT = 1000.00;
    private static final double MIN_TOPUP_AMOUNT = 20.00;
    private static final double MAX_TOPUP_AMOUNT = 500.00;
    private static final int PAYMENT_TIMEOUT_MINUTES = 30;

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
        Wallet wallet = getOrCreateWallet(member);

        // 4. Validate wallet status
        if (!"ACTIVE".equals(wallet.getStatus())) {
            throw new ValidationException("Wallet is not active. Status: " + wallet.getStatus());
        }

        // 5. Validate amount
        validateTopUpAmount(request.getAmount());

        // 6. Check wallet limit
        double newBalance = wallet.getBalance() + request.getAmount();
        if (newBalance > WALLET_LIMIT) {
            throw new ValidationException(
                    "Top-up exceeds maximum wallet balance allowed (RM" + WALLET_LIMIT + ")"
            );
        }

        // 7. Create payment record first
        Payment payment = createPaymentRecord(request, "TOP_UP");

        try {
            // 8. Process payment based on source
            if ("INTERNAL_CREDIT".equals(request.getSource())) {
                processInternalCreditPayment(member, request.getAmount());
            } else {
                // For external payments, we would integrate with payment gateway here
                // For now, we'll simulate successful payment
                simulateExternalPayment(payment);
            }

            // 9. Update wallet balance
            double oldBalance = wallet.getBalance();
        wallet.setBalance(newBalance);
            wallet.setTotalDeposited(wallet.getTotalDeposited() + request.getAmount());
        walletRepository.save(wallet);

            // 10. Create transaction record
            createWalletTransaction(wallet, "DEPOSIT", request.getAmount(), oldBalance, newBalance, 
                                  "PAYMENT", payment.getId(), "Top-up via " + request.getSource());

            // 11. Update payment status
        payment.setStatus("COMPLETED");
            payment.setProcessedAt(LocalDateTime.now());
        paymentRepository.save(payment);

            // 12. Send confirmation email
        emailService.sendTopUpConfirmation(
                account.getUser().getEmail(),
                request.getAmount(),
                newBalance,
                request.getSource(),
                payment.getTransactionId()
        );

            log.info("Top-up successful for user {}: RM{}", username, request.getAmount());
        return newBalance;

        } catch (Exception e) {
            // Rollback payment status
            payment.setStatus("FAILED");
            payment.setFailureReason(e.getMessage());
            paymentRepository.save(payment);
            
            log.error("Top-up failed for user {}: {}", username, e.getMessage());
            throw new ValidationException("Top-up failed: " + e.getMessage());
        }
    }

    @Transactional
    public Double getWalletBalance(String username) {
        log.info("Fetching wallet balance for user: {}", username);

        try {
            UserAccount account = userAccountRepository.findByUsername(username)
                    .orElseThrow(() -> {
                        log.error("User account not found: {}", username);
                        return new ResourceNotFoundException("User account not found");
                    });

            Member member = memberRepository.findByUserId(account.getUser().getId());
            if (member == null) {
                log.error("Member not found for user: {}", username);
                throw new ResourceNotFoundException("Member not found");
            }

            Optional<Wallet> walletOpt = walletRepository.findByMemberId(member.getId());

            if (walletOpt.isEmpty()) {
                log.info("Creating new wallet for member: {}", member.getId());
                Wallet newWallet = new Wallet();
                newWallet.setMember(member);
                newWallet.setBalance(0.00);
                newWallet.setTotalDeposited(0.00);

                try {
                    Wallet savedWallet = walletRepository.save(newWallet);
                    log.info("Created new wallet with balance: {}", savedWallet.getBalance());
                    return savedWallet.getBalance();
                } catch (DataAccessException e) {
                    log.error("Failed to create wallet for member {}: {}", member.getId(), e.getMessage());
                    throw new ServiceException("Failed to create wallet");
                }
            }

            Wallet wallet = walletOpt.get();
            log.info("Found existing wallet balance: {} for user: {}", wallet.getBalance(), username);
            return wallet.getBalance();

        } catch (Exception e) {
            log.error("Error fetching wallet balance for user {}: {}", username, e.getMessage());
            throw new ServiceException("Failed to fetch wallet balance");
        }
    }

    @Transactional
    public WalletTransactionDto getWalletTransactions(String username, Pageable pageable) {
        String currentUsername = SecurityContextHolder.getContext().getAuthentication().getName();
        if (!username.equals(currentUsername)) {
            throw new ValidationException("Unauthorized access to wallet transactions");
        }

        UserAccount account = userAccountRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User account not found"));

        Member member = memberRepository.findByUserId(account.getUser().getId());
        if (member == null) {
            throw new ResourceNotFoundException("Member not found");
        }

        Wallet wallet = walletRepository.findByMemberId(member.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Wallet not found"));

        Page<WalletTransaction> transactions = walletTransactionRepository
                .findByWalletIdOrderByCreatedAtDesc(wallet.getId(), pageable);

        return WalletTransactionDto.builder()
                .walletId(wallet.getId())
                .balance(wallet.getBalance())
                .frozenBalance(wallet.getFrozenBalance())
                .totalDeposited(wallet.getTotalDeposited())
                .totalSpent(wallet.getTotalSpent())
                .transactions(transactions.getContent().stream()
                        .map(this::mapToTransactionDto)
                        .collect(Collectors.toList()))
                .totalElements(transactions.getTotalElements())
                .totalPages(transactions.getTotalPages())
                .build();
    }

    @Transactional
    public void freezeBalance(Integer walletId, double amount, String referenceType, Integer referenceId, String description) {
        Wallet wallet = walletRepository.findById(walletId)
                .orElseThrow(() -> new ResourceNotFoundException("Wallet not found"));

        if (wallet.getBalance() < amount) {
            throw new InsufficientBalanceException("Insufficient balance to freeze");
        }

        double oldBalance = wallet.getBalance();
        double oldFrozen = wallet.getFrozenBalance();

        wallet.setBalance(oldBalance - amount);
        wallet.setFrozenBalance(oldFrozen + amount);
        walletRepository.save(wallet);

        createWalletTransaction(wallet, "FREEZE", amount, oldBalance, wallet.getBalance(), 
                              oldFrozen, wallet.getFrozenBalance(), referenceType, referenceId, description);

        log.info("Frozen RM{} from wallet {}", amount, walletId);
    }

    @Transactional
    public void unfreezeBalance(Integer walletId, double amount, String referenceType, Integer referenceId, String description) {
        Wallet wallet = walletRepository.findById(walletId)
                .orElseThrow(() -> new ResourceNotFoundException("Wallet not found"));

        if (wallet.getFrozenBalance() < amount) {
            throw new ValidationException("Insufficient frozen balance to unfreeze");
        }

        double oldBalance = wallet.getBalance();
        double oldFrozen = wallet.getFrozenBalance();

        wallet.setBalance(oldBalance + amount);
        wallet.setFrozenBalance(oldFrozen - amount);
        walletRepository.save(wallet);

        createWalletTransaction(wallet, "UNFREEZE", amount, oldBalance, wallet.getBalance(), 
                              oldFrozen, wallet.getFrozenBalance(), referenceType, referenceId, description);

        log.info("Unfrozen RM{} from wallet {}", amount, walletId);
    }

    @Transactional
    public void processRefund(Integer paymentId, double amount, String reason) {
        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new ResourceNotFoundException("Payment not found"));

        if (!"COMPLETED".equals(payment.getStatus())) {
            throw new ValidationException("Payment is not completed");
        }

        // Find the booking to get the wallet
        Booking booking = payment.getBooking();
        if (booking == null) {
            throw new ValidationException("Payment is not associated with a booking");
        }

        Member member = booking.getMember();
        Wallet wallet = walletRepository.findByMemberId(member.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Wallet not found"));

        double oldBalance = wallet.getBalance();
        wallet.setBalance(oldBalance + amount);
        wallet.setTotalSpent(wallet.getTotalSpent() - amount);
        walletRepository.save(wallet);

        // Create refund payment record
        Payment refundPayment = new Payment();
        refundPayment.setAmount(amount);
        refundPayment.setPaymentType("REFUND");
        refundPayment.setPaymentMethod("WALLET_REFUND");
        refundPayment.setStatus("COMPLETED");
        refundPayment.setTransactionId("REF-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
        refundPayment.setReferenceId(payment.getTransactionId());
        refundPayment.setProcessedAt(LocalDateTime.now());
        paymentRepository.save(refundPayment);

        // Create transaction record
        createWalletTransaction(wallet, "REFUND", amount, oldBalance, wallet.getBalance(), 
                              "PAYMENT", refundPayment.getId(), "Refund: " + reason);

        // Update original payment
        payment.setStatus("REFUNDED");
        payment.setRefundDate(LocalDateTime.now());
        paymentRepository.save(payment);

        log.info("Refund processed: RM{} for payment {}", amount, paymentId);
    }

    // Helper methods
    private Wallet getOrCreateWallet(Member member) {
        return walletRepository.findByMemberId(member.getId())
                .orElseGet(() -> {
                    Wallet newWallet = new Wallet();
                    newWallet.setMember(member);
                    newWallet.setBalance(0.00);
                    newWallet.setTotalDeposited(0.00);
                    return walletRepository.save(newWallet);
                });
    }

    private void validateTopUpAmount(double amount) {
        if (amount < MIN_TOPUP_AMOUNT) {
            throw new ValidationException("Minimum top-up amount is RM" + MIN_TOPUP_AMOUNT);
        }
        if (amount > MAX_TOPUP_AMOUNT) {
            throw new ValidationException("Maximum top-up amount is RM" + MAX_TOPUP_AMOUNT);
        }
    }

    private Payment createPaymentRecord(TopUpRequestDto request, String paymentType) {
        Payment payment = new Payment();
        payment.setAmount(request.getAmount());
        payment.setPaymentType(paymentType);
        payment.setPaymentMethod(request.getSource());
        payment.setStatus("PENDING");
        payment.setTransactionId("TX-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
        payment.setExpiresAt(LocalDateTime.now().plusMinutes(PAYMENT_TIMEOUT_MINUTES));
        return paymentRepository.save(payment);
    }

    private void processInternalCreditPayment(Member member, double amount) {
        int pointsToDeduct = (int) Math.round(amount);
        if (member.getPointBalance() < pointsToDeduct) {
            throw new ValidationException(
                    "Insufficient internal credit. Available: " + member.getPointBalance()
            );
        }
        member.setPointBalance(member.getPointBalance() - pointsToDeduct);
        memberRepository.save(member);
    }

    private void simulateExternalPayment(Payment payment) {
        // In a real implementation, this would integrate with payment gateway
        // For now, we'll simulate a successful payment
        log.info("Simulating external payment for transaction: {}", payment.getTransactionId());
    }

    private void createWalletTransaction(Wallet wallet, String transactionType, double amount, 
                                       double balanceBefore, double balanceAfter, 
                                       String referenceType, Integer referenceId, String description) {
        WalletTransaction transaction = new WalletTransaction();
        transaction.setWalletId(wallet.getId());
        transaction.setTransactionType(transactionType);
        transaction.setAmount(amount);
        transaction.setBalanceBefore(balanceBefore);
        transaction.setBalanceAfter(balanceAfter);
        transaction.setFrozenBefore(wallet.getFrozenBalance());
        transaction.setFrozenAfter(wallet.getFrozenBalance());
        transaction.setReferenceType(referenceType);
        transaction.setReferenceId(referenceId);
        transaction.setDescription(description);
        transaction.setStatus("COMPLETED");
        transaction.setProcessedAt(LocalDateTime.now());
        
        walletTransactionRepository.save(transaction);
    }

    private void createWalletTransaction(Wallet wallet, String transactionType, double amount, 
                                       double balanceBefore, double balanceAfter, 
                                       double frozenBefore, double frozenAfter,
                                       String referenceType, Integer referenceId, String description) {
        WalletTransaction transaction = new WalletTransaction();
        transaction.setWalletId(wallet.getId());
        transaction.setTransactionType(transactionType);
        transaction.setAmount(amount);
        transaction.setBalanceBefore(balanceBefore);
        transaction.setBalanceAfter(balanceAfter);
        transaction.setFrozenBefore(frozenBefore);
        transaction.setFrozenAfter(frozenAfter);
        transaction.setReferenceType(referenceType);
        transaction.setReferenceId(referenceId);
        transaction.setDescription(description);
        transaction.setStatus("COMPLETED");
        transaction.setProcessedAt(LocalDateTime.now());
        
        walletTransactionRepository.save(transaction);
    }

    private com.pickleball_backend.pickleball.dto.WalletTransactionDto.TransactionDto mapToTransactionDto(WalletTransaction transaction) {
        return com.pickleball_backend.pickleball.dto.WalletTransactionDto.TransactionDto.builder()
                .id(transaction.getId())
                .transactionType(transaction.getTransactionType())
                .amount(transaction.getAmount())
                .balanceBefore(transaction.getBalanceBefore())
                .balanceAfter(transaction.getBalanceAfter())
                .frozenBefore(transaction.getFrozenBefore())
                .frozenAfter(transaction.getFrozenAfter())
                .referenceType(transaction.getReferenceType())
                .referenceId(transaction.getReferenceId())
                .description(transaction.getDescription())
                .status(transaction.getStatus())
                .createdAt(transaction.getCreatedAt())
                .processedAt(transaction.getProcessedAt())
                .build();
    }
}