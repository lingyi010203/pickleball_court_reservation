package com.pickleball_backend.pickleball.service;

import com.pickleball_backend.pickleball.entity.Payment;
import com.pickleball_backend.pickleball.entity.Wallet;
import com.pickleball_backend.pickleball.entity.WalletTransaction;
import com.pickleball_backend.pickleball.entity.Member;
import com.pickleball_backend.pickleball.entity.User;
import com.pickleball_backend.pickleball.entity.ClassSession;
import com.pickleball_backend.pickleball.repository.WalletRepository;
import com.pickleball_backend.pickleball.repository.PaymentRepository;
import com.pickleball_backend.pickleball.repository.WalletTransactionRepository;
import com.pickleball_backend.pickleball.repository.MemberRepository;
import com.pickleball_backend.pickleball.exception.ResourceNotFoundException;
import com.pickleball_backend.pickleball.exception.ValidationException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@Slf4j
@RequiredArgsConstructor
public class EscrowAccountService {

    private final WalletRepository walletRepository;
    private final PaymentRepository paymentRepository;
    private final WalletTransactionRepository walletTransactionRepository;
    private final MemberRepository memberRepository;

    /**
     * 用戶報名課程時，將錢存入託管狀態
     */
    @Transactional
    public void depositToEscrow(User user, double amount, ClassSession session) {
        // 從用戶錢包扣款
        Wallet userWallet = walletRepository.findByMemberId(user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("User wallet not found"));

        if (userWallet.getBalance() < amount) {
            throw new ValidationException("Insufficient wallet balance");
        }

        userWallet.setBalance(userWallet.getBalance() - amount);
        walletRepository.save(userWallet);

        // 創建託管支付記錄
        Payment payment = new Payment();
        payment.setAmount(amount);
        payment.setPaymentDate(LocalDateTime.now());
        payment.setPaymentMethod("WALLET");
        payment.setStatus("ESCROWED"); // 託管狀態
        payment.setPaymentType("CLASS_SESSION_ESCROW");
        payment.setTransactionId("SESSION_" + session.getId() + "_" + user.getId()); // 關聯課程和用戶
        payment.setGroupBookingId("ESCROW_" + session.getId() + "_" + user.getId()); // 添加 groupBookingId
        paymentRepository.save(payment);

        log.info("Deposited RM{} to escrow for session {} by user {}", 
                amount, session.getId(), user.getId());
    }

    /**
     * 課程開始時自動分帳：80% 給教練，20% 給平台
     */
    @Transactional
    public void settleClassSession(ClassSession session) {
        // 獲取該課程的所有託管支付（通過 transactionId 關聯）
        List<Payment> escrowedPayments = paymentRepository.findByPaymentTypeAndStatus("CLASS_SESSION_ESCROW", "ESCROWED")
                .stream()
                .filter(payment -> payment.getTransactionId() != null && 
                        payment.getTransactionId().startsWith("SESSION_" + session.getId() + "_"))
                .collect(java.util.stream.Collectors.toList());
        
        if (escrowedPayments.isEmpty()) {
            log.warn("No escrowed payments found for session {}", session.getId());
            return;
        }

        double totalEscrowedAmount = escrowedPayments.stream()
                .mapToDouble(Payment::getAmount)
                .sum();

        // 計算分帳金額
        double coachAmount = totalEscrowedAmount * 0.8; // 80% 給教練
        double platformAmount = totalEscrowedAmount * 0.2; // 20% 給平台

        // 轉給教練
        User coach = session.getCoach();
        if (coach == null) {
            log.error("Coach not found for session: {}", session.getId());
            return;
        }
        
        Member coachMember = memberRepository.findByUser(coach);
        if (coachMember == null) {
            log.error("Coach member not found for coach: {}", coach.getId());
            return;
        }
        
        // 獲取或創建教練錢包
        Wallet coachWallet = walletRepository.findByMemberId(coachMember.getId()).orElse(null);
        if (coachWallet == null) {
            // 創建教練錢包
            coachWallet = new Wallet();
            coachWallet.setMember(coachMember);
            coachWallet.setBalance(0.00);
            coachWallet.setFrozenBalance(0.00);
            coachWallet.setTotalDeposited(0.00);
            coachWallet.setTotalSpent(0.00);
            coachWallet.setStatus("ACTIVE");
            coachWallet = walletRepository.save(coachWallet);
            log.info("Created new wallet for coach: {}", coach.getId());
        }

        // 更新教練錢包餘額
        double oldBalance = coachWallet.getBalance();
        coachWallet.setBalance(oldBalance + coachAmount);
        walletRepository.save(coachWallet);

        // 創建錢包交易記錄
        WalletTransaction coachTransaction = new WalletTransaction();
        coachTransaction.setWalletId(coachWallet.getId());
        coachTransaction.setTransactionType("COACH_INCOME");
        coachTransaction.setAmount(coachAmount);
        coachTransaction.setBalanceBefore(oldBalance);
        coachTransaction.setBalanceAfter(coachWallet.getBalance());
        coachTransaction.setFrozenBefore(coachWallet.getFrozenBalance());
        coachTransaction.setFrozenAfter(coachWallet.getFrozenBalance());
        coachTransaction.setReferenceType("CLASS_SESSION");
        coachTransaction.setReferenceId(session.getId());
        coachTransaction.setDescription("Class session revenue: " + session.getTitle() + " (80% share via escrow)");
        coachTransaction.setStatus("COMPLETED");
        walletTransactionRepository.save(coachTransaction);

        // 創建教練收入記錄
        Payment coachPayment = new Payment();
        coachPayment.setAmount(coachAmount);
        coachPayment.setPaymentDate(LocalDateTime.now());
        coachPayment.setPaymentMethod("ESCROW_SETTLEMENT");
        coachPayment.setStatus("COMPLETED");
        coachPayment.setPaymentType("COACH_INCOME");
        coachPayment.setTransactionId("SETTLEMENT_" + session.getId());
        coachPayment.setGroupBookingId("SETTLEMENT_" + session.getId());
        paymentRepository.save(coachPayment);

        // 創建平台收入記錄
        Payment platformPayment = new Payment();
        platformPayment.setAmount(platformAmount);
        platformPayment.setPaymentDate(LocalDateTime.now());
        platformPayment.setPaymentMethod("ESCROW_SETTLEMENT");
        platformPayment.setStatus("COMPLETED");
        platformPayment.setPaymentType("PLATFORM_FEE");
        platformPayment.setTransactionId("SETTLEMENT_" + session.getId());
        platformPayment.setGroupBookingId("SETTLEMENT_" + session.getId());
        paymentRepository.save(platformPayment);

        // 更新所有相關的託管支付狀態
        escrowedPayments.forEach(payment -> {
            payment.setStatus("SETTLED");
            paymentRepository.save(payment);
        });

        log.info("Successfully settled session {}: Coach {} received RM{}, Platform received RM{}", 
                session.getId(), coach.getId(), coachAmount, platformAmount);
    }

    /**
     * 課程取消時退款給用戶
     */
    @Transactional
    public void refundFromEscrow(User user, double amount, ClassSession session) {
        // 退款到用戶錢包
        Wallet userWallet = walletRepository.findByMemberId(user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("User wallet not found"));

        userWallet.setBalance(userWallet.getBalance() + amount);
        walletRepository.save(userWallet);

        // 創建退款記錄
        Payment refund = new Payment();
        refund.setAmount(amount);
        refund.setRefundDate(LocalDateTime.now());
        refund.setPaymentMethod("ESCROW_REFUND");
        refund.setStatus("REFUNDED");
        refund.setPaymentType("CLASS_SESSION_REFUND");
        refund.setTransactionId("REFUND_" + session.getId() + "_" + user.getId());
        refund.setGroupBookingId("REFUND_" + session.getId() + "_" + user.getId());
        paymentRepository.save(refund);

        log.info("Refunded RM{} from escrow to user {} for cancelled session {}", 
                amount, user.getId(), session.getId());
    }

    /**
     * 獲取平台託管餘額（所有 ESCROWED 狀態的支付總和）
     */
    public double getPlatformEscrowBalance() {
        return paymentRepository.findByPaymentTypeAndStatus("CLASS_SESSION_ESCROW", "ESCROWED")
                .stream()
                .mapToDouble(Payment::getAmount)
                .sum();
    }

    /**
     * 獲取平台收入總額（所有 PLATFORM_FEE 類型的支付總和）
     */
    public double getPlatformRevenue() {
        return paymentRepository.findByPaymentTypeAndStatus("PLATFORM_FEE", "COMPLETED")
                .stream()
                .mapToDouble(Payment::getAmount)
                .sum();
    }

    /**
     * 獲取教練收入總額（所有 COACH_INCOME 類型的支付總和）
     */
    public double getCoachRevenue() {
        return paymentRepository.findByPaymentTypeAndStatus("COACH_INCOME", "COMPLETED")
                .stream()
                .mapToDouble(Payment::getAmount)
                .sum();
    }
} 