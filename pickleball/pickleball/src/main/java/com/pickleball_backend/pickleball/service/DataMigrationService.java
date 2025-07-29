package com.pickleball_backend.pickleball.service;

import com.pickleball_backend.pickleball.entity.Booking;
import com.pickleball_backend.pickleball.entity.Payment;
import com.pickleball_backend.pickleball.entity.Wallet;
import com.pickleball_backend.pickleball.entity.WalletTransaction;
import com.pickleball_backend.pickleball.repository.BookingRepository;
import com.pickleball_backend.pickleball.repository.PaymentRepository;
import com.pickleball_backend.pickleball.repository.WalletRepository;
import com.pickleball_backend.pickleball.repository.WalletTransactionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@Slf4j
@RequiredArgsConstructor
public class DataMigrationService {

    private final BookingRepository bookingRepository;
    private final PaymentRepository paymentRepository;
    private final WalletRepository walletRepository;
    private final WalletTransactionRepository walletTransactionRepository;

    /**
     * 迁移历史预订数据，为使用钱包支付的预订创建交易记录
     */
    @Transactional
    public void migrateHistoricalBookingTransactions() {
        log.info("Starting migration of historical booking transactions...");
        
        // 查找所有使用钱包支付的已完成预订
        List<Booking> walletBookings = bookingRepository.findByPaymentPaymentMethodAndPaymentStatus("WALLET", "COMPLETED");
        
        log.info("Found {} wallet bookings to migrate", walletBookings.size());
        
        int migratedCount = 0;
        int skippedCount = 0;
        
        for (Booking booking : walletBookings) {
            try {
                // 检查是否已经有对应的钱包交易记录
                List<WalletTransaction> existingTransactions = walletTransactionRepository
                    .findByReferenceTypeAndReferenceIdOrderByCreatedAtDesc("PAYMENT", booking.getPayment().getId());
                
                if (!existingTransactions.isEmpty()) {
                    log.info("Skipping booking {} - already has {} transaction records", 
                            booking.getId(), existingTransactions.size());
                    skippedCount++;
                    continue;
                }
                
                // 获取钱包
                Wallet wallet = walletRepository.findByMemberId(booking.getMember().getId())
                    .orElse(null);
                
                if (wallet == null) {
                    log.warn("No wallet found for member {} in booking {}", 
                            booking.getMember().getId(), booking.getId());
                    skippedCount++;
                    continue;
                }
                
                // 创建钱包交易记录
                WalletTransaction transaction = new WalletTransaction();
                transaction.setWalletId(wallet.getId());
                transaction.setTransactionType("WITHDRAWAL");
                transaction.setAmount(booking.getTotalAmount());
                transaction.setBalanceBefore(wallet.getBalance() + booking.getTotalAmount()); // 假设之前的余额
                transaction.setBalanceAfter(wallet.getBalance());
                transaction.setFrozenBefore(0.0);
                transaction.setFrozenAfter(0.0);
                transaction.setReferenceType("PAYMENT");
                transaction.setReferenceId(booking.getPayment().getId());
                transaction.setDescription("Court booking payment - " + (booking.getPurpose() != null ? booking.getPurpose() : "Booking"));
                transaction.setStatus("COMPLETED");
                transaction.setCreatedAt(booking.getBookingDate());
                transaction.setProcessedAt(booking.getBookingDate());
                
                walletTransactionRepository.save(transaction);
                
                // 更新钱包的 totalSpent
                wallet.setTotalSpent(wallet.getTotalSpent() + booking.getTotalAmount());
                walletRepository.save(wallet);
                
                migratedCount++;
                log.info("Successfully migrated booking {}: amount={}, wallet={}", 
                        booking.getId(), booking.getTotalAmount(), wallet.getId());
                
            } catch (Exception e) {
                log.error("Failed to migrate booking {}: {}", booking.getId(), e.getMessage(), e);
                skippedCount++;
            }
        }
        
        log.info("Migration completed: {} migrated, {} skipped", migratedCount, skippedCount);
    }

    /**
     * 迁移历史退款数据，为已退款的预订创建退款交易记录
     */
    @Transactional
    public void migrateHistoricalRefundTransactions() {
        log.info("Starting migration of historical refund transactions...");
        
        // 查找所有已退款的预订
        List<Booking> refundedBookings = bookingRepository.findByPaymentStatus("REFUNDED");
        
        log.info("Found {} refunded bookings to migrate", refundedBookings.size());
        
        int migratedCount = 0;
        int skippedCount = 0;
        
        for (Booking booking : refundedBookings) {
            try {
                // 检查是否已经有对应的退款交易记录
                List<WalletTransaction> existingTransactions = walletTransactionRepository
                    .findByReferenceTypeAndReferenceIdOrderByCreatedAtDesc("PAYMENT", booking.getPayment().getId());
                
                // 检查是否已经有退款记录
                boolean hasRefundTransaction = existingTransactions.stream()
                    .anyMatch(t -> "REFUND".equals(t.getTransactionType()));
                
                if (hasRefundTransaction) {
                    log.info("Skipping booking {} - already has refund transaction", booking.getId());
                    skippedCount++;
                    continue;
                }
                
                // 获取钱包
                Wallet wallet = walletRepository.findByMemberId(booking.getMember().getId())
                    .orElse(null);
                
                if (wallet == null) {
                    log.warn("No wallet found for member {} in booking {}", 
                            booking.getMember().getId(), booking.getId());
                    skippedCount++;
                    continue;
                }
                
                // 计算退款金额（50%）
                double refundAmount = booking.getTotalAmount() * 0.5;
                
                // 创建退款交易记录
                WalletTransaction transaction = new WalletTransaction();
                transaction.setWalletId(wallet.getId());
                transaction.setTransactionType("REFUND");
                transaction.setAmount(refundAmount);
                transaction.setBalanceBefore(wallet.getBalance() - refundAmount); // 假设退款前的余额
                transaction.setBalanceAfter(wallet.getBalance());
                transaction.setFrozenBefore(0.0);
                transaction.setFrozenAfter(0.0);
                transaction.setReferenceType("PAYMENT");
                transaction.setReferenceId(booking.getPayment().getId());
                transaction.setDescription("Booking cancellation refund - " + (booking.getPurpose() != null ? booking.getPurpose() : "Booking"));
                transaction.setStatus("COMPLETED");
                transaction.setCreatedAt(booking.getPayment().getRefundDate() != null ? 
                    booking.getPayment().getRefundDate() : LocalDateTime.now());
                transaction.setProcessedAt(booking.getPayment().getRefundDate() != null ? 
                    booking.getPayment().getRefundDate() : LocalDateTime.now());
                
                walletTransactionRepository.save(transaction);
                
                migratedCount++;
                log.info("Successfully migrated refund for booking {}: amount={}, wallet={}", 
                        booking.getId(), refundAmount, wallet.getId());
                
            } catch (Exception e) {
                log.error("Failed to migrate refund for booking {}: {}", booking.getId(), e.getMessage(), e);
                skippedCount++;
            }
        }
        
        log.info("Refund migration completed: {} migrated, {} skipped", migratedCount, skippedCount);
    }

    /**
     * 执行完整的数据迁移
     */
    @Transactional
    public void performFullMigration() {
        log.info("Starting full data migration...");
        
        try {
            migrateHistoricalBookingTransactions();
            migrateHistoricalRefundTransactions();
            
            log.info("Full data migration completed successfully");
        } catch (Exception e) {
            log.error("Full data migration failed: {}", e.getMessage(), e);
            throw e;
        }
    }
} 