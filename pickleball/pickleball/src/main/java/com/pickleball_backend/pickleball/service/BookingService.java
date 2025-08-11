package com.pickleball_backend.pickleball.service;

import com.pickleball_backend.pickleball.dto.*;
import com.pickleball_backend.pickleball.entity.*;
import com.pickleball_backend.pickleball.exception.ResourceNotFoundException;
import com.pickleball_backend.pickleball.exception.ValidationException;
import com.pickleball_backend.pickleball.exception.ConflictException;
import com.pickleball_backend.pickleball.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeParseException;
import java.util.List;
import java.util.Objects;
import java.util.Optional;
import java.util.stream.Collectors;
import java.util.ArrayList;

@Service
@RequiredArgsConstructor
public class BookingService {

    private final BookingRepository bookingRepository;
    private final SlotRepository slotRepository;
    private final CourtRepository courtRepository;
    private final MemberRepository memberRepository;
    private final PaymentRepository paymentRepository;
    private final UserAccountRepository userAccountRepository;
    private final EmailService emailService;
    private final CancellationRequestRepository cancellationRequestRepository;
    private final BookingSlotRepository bookingSlotRepository;
    private final UserRepository userRepository;
    private final WalletRepository walletRepository;
    private final WalletTransactionRepository walletTransactionRepository;
    private final FeedbackRepository feedbackRepository;
    private final FriendlyMatchService friendlyMatchService;
    private final TierService tierService;
    private final ClassSessionRepository classSessionRepository;
    private final VoucherRedemptionService voucherRedemptionService; // 新增：優惠券服務
    private final EventRegistrationRepository eventRegistrationRepository; // 新增：事件註冊倉庫
    private final EventRepository eventRepository; // 新增：事件倉庫
    private final MemberService memberService; // 新增：會員服務
    private static final Logger log = LoggerFactory.getLogger(BookingService.class);

    private static final String CANCELLED_STATUS = "CANCELLED";

    @Transactional
    public BookingResponseDto bookCourt(BookingRequestDto request) {
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

        // 4. 多 slot 合并逻辑
        List<Integer> slotIds = request.getSlotIds() != null && !request.getSlotIds().isEmpty()
            ? request.getSlotIds()
            : (request.getSlotId() != null ? List.of(request.getSlotId()) : List.of());
        
        // 添加调试日志
        log.info("Booking request - slotId: {}, slotIds: {}, final slotIds: {}", 
                request.getSlotId(), request.getSlotIds(), slotIds);
        
        if (slotIds.isEmpty()) {
            throw new ValidationException("No slot selected");
        }

        // 5. 获取所有 slot，校验连续性、可用性
        List<Slot> slots = slotRepository.findAllById(slotIds);
        log.info("Found {} slots out of {} requested slotIds", slots.size(), slotIds.size());
        
        if (slots.size() != slotIds.size()) {
            throw new ResourceNotFoundException("Some slots not found");
        }
        // 按时间排序
        slots.sort((a, b) -> a.getStartTime().compareTo(b.getStartTime()));
        // 校验连续性
        for (int i = 1; i < slots.size(); i++) {
            if (!slots.get(i).getStartTime().equals(slots.get(i-1).getEndTime())) {
                throw new ValidationException("Selected slots are not consecutive");
            }
        }
        
        // 新增：檢查與Event的衝突
        for (Slot slot : slots) {
            // 檢查是否有Event在這個時段使用這個場地
            List<Event> conflictingEvents = eventRepository.findByCourtsIdAndStartTimeBetweenAndStatusNot(
                slot.getCourtId(),
                LocalDateTime.of(slot.getDate(), slot.getStartTime()),
                LocalDateTime.of(slot.getDate(), slot.getEndTime()),
                "CANCELLED"
            );
            
            if (!conflictingEvents.isEmpty()) {
                Event conflictingEvent = conflictingEvents.get(0);
                throw new ConflictException("Court is reserved for event: " + conflictingEvent.getTitle() + 
                    " during the selected time");
            }
        }
        
        // 校验全部可用
        for (Slot slot : slots) {
            if (!slot.isAvailable() || isSlotBooked(slot.getId())) {
                throw new IllegalStateException("Slot " + slot.getId() + " is not available");
            }
        }

        // 6. Get court and calculate price
        Court court = courtRepository.findById(slots.get(0).getCourtId())
                .orElseThrow(() -> new ResourceNotFoundException("Court not found"));
        int totalDuration = slots.stream().mapToInt(Slot::getDurationHours).sum();
        double baseAmount = calculateBookingAmount(court, slots.get(0), totalDuration); // 以第一个slot为基准

        // 新增：加上 paddle/ball set
        int numPaddles = request.getNumPaddles() != null ? request.getNumPaddles() : 0;
        boolean buyBallSet = request.getBuyBallSet() != null && request.getBuyBallSet();
        double paddleFee = numPaddles * 5.0;
        double ballSetFee = buyBallSet ? 12.0 : 0.0;
        double amount = baseAmount + paddleFee + ballSetFee;

        // 新增：處理優惠券折扣
        double originalAmount = amount;
        double discountAmount = 0.0;
        VoucherRedemptionDto appliedVoucher = null;
        
        if (request.getUseVoucher() != null && request.getUseVoucher() && request.getVoucherRedemptionId() != null) {
            try {
                appliedVoucher = voucherRedemptionService.useVoucher(request.getVoucherRedemptionId());
                if (appliedVoucher != null) {
                    if ("percentage".equals(appliedVoucher.getDiscountType())) {
                        // 百分比折扣
                        discountAmount = amount * (appliedVoucher.getDiscountValue() / 100.0);
                    } else {
                        // 固定金額折扣
                        discountAmount = appliedVoucher.getDiscountValue();
                    }
                    
                    // 確保折扣不超過總金額
                    discountAmount = Math.min(discountAmount, amount);
                    amount = amount - discountAmount;
                    
                    log.info("Applied voucher discount: RM{} ({}% of original RM{})", 
                            discountAmount, appliedVoucher.getDiscountValue(), originalAmount);
                }
            } catch (Exception e) {
                log.warn("Failed to apply voucher: {}", e.getMessage());
                // 如果優惠券應用失敗，繼續使用原始金額
            }
        }
        
        // 確保 originalAmount 在沒有折扣時也正確設置
        if (discountAmount == 0.0) {
            originalAmount = amount;
        }

        // 7. Process wallet payment if requested
        Payment payment = new Payment();
        payment.setAmount(amount);
        payment.setPaymentDate(LocalDateTime.now());
        payment.setPaymentType("BOOKING");
        
        // 新增：記錄折扣信息
        if (discountAmount > 0) {
            payment.setDiscountAmount(discountAmount);
            payment.setOriginalAmount(originalAmount);
        }

        if (request.isUseWallet()) {
            if (wallet.getBalance() < amount) {
                throw new ValidationException("Insufficient wallet balance. Available: " + wallet.getBalance());
            }
            wallet.setBalance(wallet.getBalance() - amount);
            wallet.setTotalSpent(wallet.getTotalSpent() + amount); // 更新總支出
            walletRepository.save(wallet);
            payment.setPaymentMethod("WALLET");
            payment.setStatus("COMPLETED");
        } else {
            payment.setPaymentMethod("OTHER");
            payment.setStatus("PENDING");
        }
        payment = paymentRepository.save(payment);

        // 8. Create booking
        Booking booking = new Booking();
        booking.setBookingDate(LocalDateTime.now());
        booking.setTotalAmount(amount);
        booking.setOriginalAmount(originalAmount); // 新增：記錄原始金額
        booking.setDiscountAmount(discountAmount); // 新增：記錄折扣金額
        String bookingStatus = "CONFIRMED";
        if (bookingStatus.length() > 50) {
            bookingStatus = bookingStatus.substring(0, 50);
        }
        booking.setStatus(bookingStatus);
        booking.setMember(member);
        booking.setPayment(payment);
        booking.setPurpose(request.getPurpose());
        booking.setNumberOfPlayers(request.getNumberOfPlayers());
        booking.setNumPaddles(request.getNumPaddles());
        booking.setBuyBallSet(request.getBuyBallSet());
        booking = bookingRepository.save(booking);

        // 9. Create booking slots
        for (Slot slot : slots) {
            BookingSlot bookingSlot = new BookingSlot();
            bookingSlot.setBooking(booking);
            bookingSlot.setSlot(slot);
            bookingSlot.setStatus("BOOKED");
            bookingSlotRepository.save(bookingSlot);
            
            // 更新 slot 的可用狀態
            slot.setAvailable(false);
            slotRepository.save(slot);
        }

        // 10. Add points to member
        int pointsEarned = (int) Math.round(amount); // 使用實際支付金額計算積分
        String oldTierName = member.getTier() != null ? member.getTier().getTierName() : "NONE";

        member.setTierPointBalance(member.getTierPointBalance() + pointsEarned);
        member.setRewardPointBalance(member.getRewardPointBalance() + pointsEarned);
        memberRepository.save(member);
        log.info("Added {} tier points and {} reward points to member {} for booking {}",
                pointsEarned, pointsEarned, member.getId(), booking.getId());

        // Automatic tier upgrade check after booking
        tierService.recalculateMemberTier(member);

        // 11. Send confirmation email
        try {
            emailService.sendBookingConfirmation(
                    member.getUser().getEmail(),
                    booking,
                    court,
                    slots.get(0)
            );
        } catch (Exception e) {
            log.error("Failed to send booking confirmation email: {}", e.getMessage());
        }

        // 12. Create response
        BookingResponseDto response = mapToBookingResponse(booking, court, slots.get(0));
        response.setDurationHours(totalDuration);
        response.setWalletBalance(wallet.getBalance());
        response.setPointsEarned(pointsEarned);
        response.setCurrentPointBalance(member.getTierPointBalance());  // 保持向後兼容
        response.setCurrentTierPointBalance(member.getTierPointBalance());
        response.setCurrentRewardPointBalance(member.getRewardPointBalance());

        // 13. 更新用户统计数据
        User user = member.getUser();
        user.setBookingsMade(user.getBookingsMade() + 1);
        user.setBookingHours(user.getBookingHours() + totalDuration);
        user.setAmountSpent(user.getAmountSpent() + amount);
        userRepository.save(user);

        return response;
    }

    private boolean isSlotBooked(Integer slotId) {
        if (slotId == null) return false;
        return bookingSlotRepository.existsBySlotIdAndStatus(slotId, "BOOKED");
    }

    private double calculateBookingAmount(Court court, Slot slot, int durationHours) {
        LocalTime startTime = slot.getStartTime();
        LocalTime endTime = slot.getEndTime();

        // Handle null pricing safely
        double peakHourlyPrice = court.getPeakHourlyPrice() != null ?
                court.getPeakHourlyPrice() : 0.0;
        double offPeakHourlyPrice = court.getOffPeakHourlyPrice() != null ?
                court.getOffPeakHourlyPrice() : 0.0;

        // Default to off-peak rate
        double hourlyRate = offPeakHourlyPrice;

        // Only check peak times if defined
        if (court.getPeakStartTime() != null && court.getPeakEndTime() != null) {
            try {
                LocalTime peakStart = LocalTime.parse(court.getPeakStartTime());
                LocalTime peakEnd = LocalTime.parse(court.getPeakEndTime());

                // Check if slot falls entirely within peak hours
                if (!startTime.isBefore(peakStart) && !endTime.isAfter(peakEnd)) {
                    hourlyRate = peakHourlyPrice;
                }
            } catch (DateTimeParseException e) {
                log.error("Invalid peak time format: {}", e.getMessage());
                // Maintain off-peak rate if parsing fails
            }
        }

        return hourlyRate * durationHours;
    }

    // 生成响应时，slot 相关信息通过 booking.getBookingSlots().get(0).getSlot()
    private BookingResponseDto mapToBookingResponse(Booking booking, Court court, Slot slot) {
        BookingResponseDto response = new BookingResponseDto();
        response.setBookingId(booking.getId());
        response.setCourtName(court.getName());
        response.setCourtLocation(court.getLocation());
        // Slot slot = booking.getSlot();
        Slot slot0 = booking.getBookingSlots() != null && !booking.getBookingSlots().isEmpty() ? booking.getBookingSlots().get(0).getSlot() : null;
        if (slot0 != null) {
            response.setSlotDate(slot0.getDate());
            response.setStartTime(slot0.getStartTime());
            response.setEndTime(slot0.getEndTime());
        }
        response.setTotalAmount(booking.getTotalAmount());
        response.setBookingStatus(booking.getStatus());
        response.setPurpose(booking.getPurpose());
        response.setNumberOfPlayers(booking.getNumberOfPlayers());

        // Add payment details
        if (booking.getPayment() != null) {
            response.setPaymentMethod(booking.getPayment().getPaymentMethod());
            response.setPaymentStatus(booking.getPayment().getStatus());
        } else {
            response.setPaymentMethod("N/A");
            response.setPaymentStatus("N/A");
        }

        // Add points information
        int pointsEarned = (int) Math.round(booking.getTotalAmount());
        response.setPointsEarned(pointsEarned);
        response.setCurrentPointBalance(booking.getMember().getTierPointBalance());  // 保持向後兼容
        response.setCurrentTierPointBalance(booking.getMember().getTierPointBalance());
        response.setCurrentRewardPointBalance(booking.getMember().getRewardPointBalance());

        // 新增：添加折扣信息
        response.setOriginalAmount(booking.getOriginalAmount() != null ? booking.getOriginalAmount() : booking.getTotalAmount());
        response.setDiscountAmount(booking.getDiscountAmount() != null ? booking.getDiscountAmount() : 0.0);
        
        // 設置是否使用了優惠券
        response.setVoucherUsed(booking.getDiscountAmount() != null && booking.getDiscountAmount() > 0);
        
        // 如果有折扣，嘗試獲取優惠券代碼
        if (booking.getDiscountAmount() != null && booking.getDiscountAmount() > 0 && booking.getPayment() != null) {
            // 這裡可以從 VoucherRedemption 表中查詢使用的優惠券
            // 暫時設為空，後續可以完善
            response.setAppliedVoucherCode("Applied");
        }

        return response;
    }



    @Transactional
    public CancellationResponse cancelBooking(Integer bookingId, String username, String reason) {
        // 1. 获取用户账户
        UserAccount account = userAccountRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User account not found"));

        // 2. 获取预订信息
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found"));

        // 3. 验证预订所有权
        if (!booking.getMember().getUser().getId().equals(account.getUser().getId())) {
            throw new ValidationException("You can only cancel your own bookings");
        }

        // 4. 获取时间段信息
        Slot slot = booking.getBookingSlots() != null && !booking.getBookingSlots().isEmpty() ? booking.getBookingSlots().get(0).getSlot() : null;
        if (slot == null) {
            throw new ValidationException("No slot found for this booking");
        }
        LocalDateTime slotDateTime = LocalDateTime.of(slot.getDate(), slot.getStartTime());
        long hours = java.time.temporal.ChronoUnit.HOURS.between(LocalDateTime.now(), slotDateTime);

        // 5. 自动批准逻辑
        if (hours > 24) {
            // 1. Free up the slot
            slot.setAvailable(true);
            slotRepository.save(slot);

            // 2. Update booking status
            String bookingStatus = "CANCELLED";
            if (bookingStatus.length() > 50) {
                bookingStatus = bookingStatus.substring(0, 50);
            }
            booking.setStatus(bookingStatus);
            bookingRepository.save(booking);

            // 3. Update booking slot status
            BookingSlot bookingSlot = booking.getBookingSlots() != null && !booking.getBookingSlots().isEmpty() ? booking.getBookingSlots().get(0) : null;
            if (bookingSlot != null) {
                String slotStatus = "CANCELLED";
                if (slotStatus.length() > 50) {
                    slotStatus = slotStatus.substring(0, 50);
                }
                bookingSlot.setStatus(slotStatus);
                bookingSlotRepository.save(bookingSlot);
            }

            // 新增：同步取消 FriendlyMatch
            friendlyMatchService.cancelReservationAndMatch(bookingId);

            // 4. Update or create cancellation request
            CancellationRequest request = booking.getCancellationRequest();
            if (request == null) {
                request = new CancellationRequest();
                request.setBooking(booking);
                request.setRequestDate(LocalDateTime.now());
            }
            request.setStatus("APPROVED");
            request.setReason(reason != null ? reason : "User requested cancellation");
            request.setAdminRemark("Auto-approved by system (more than 24h before slot)");
            cancellationRequestRepository.save(request);

            // 5. 退款50%到钱包
            double refund = booking.getTotalAmount() * 0.5;
            Wallet wallet = walletRepository.findByMemberId(booking.getMember().getId())
                .orElseThrow(() -> new ResourceNotFoundException("Wallet not found"));
            
            double balanceBefore = wallet.getBalance();
            wallet.setBalance(wallet.getBalance() + refund);
            wallet.setTotalSpent(wallet.getTotalSpent() - refund); // 退款時減少總支出
            walletRepository.save(wallet);
            
            // 创建退款交易记录
            createWalletTransaction(wallet, "REFUND", refund, balanceBefore, wallet.getBalance(), 
                                  "BOOKING", booking.getId(), "Booking cancellation refund (50%)");

            // 6. 扣除積分（扣除50%的積分，與退款比例一致）
            Member member = booking.getMember();
            MemberService.PointDeductionResult deductionResult = memberService.deductPointsForRefund(member, booking.getTotalAmount(), 0.5);
            
            log.info("Deducted {} tier points and {} reward points from member {} for booking cancellation {}",
                    deductionResult.getTierPointsDeducted(), deductionResult.getRewardPointsDeducted(), member.getId(), booking.getId());

            // 7. 更新用户统计数据（减少预订小时数）
            User user = booking.getMember().getUser();
            double cancelledHours = booking.getBookingSlots().stream()
                    .mapToDouble(bs -> bs.getSlot().getDurationHours())
                    .sum();
            user.setBookingHours(Math.max(0, user.getBookingHours() - cancelledHours));
            user.setAmountSpent(Math.max(0, user.getAmountSpent() - booking.getTotalAmount()));
            userRepository.save(user);

            // 8. 更新支付状态
            Payment payment = booking.getPayment();
            if (payment != null) {
                payment.setStatus("REFUNDED");
                paymentRepository.save(payment);
            }

            // 9. 发送邮件通知
            Court court = courtRepository.findById(slot.getCourtId())
                .orElseThrow(() -> new ResourceNotFoundException("Court not found"));
            emailService.sendCancellationDecision(
                booking.getMember().getUser().getEmail(),
                booking,
                slot,
                court != null ? court.getName() : "Court not found",
                true
            );

            return new CancellationResponse(
                request.getId(),
                booking.getId(),
                request.getStatus(),
                request.getRequestDate(),
                "Cancellation auto-approved and 50% refunded to wallet"
            );
        }

        // 6. 原有流程（<=24小时，人工审核）
        // 检查1小时限制
        if (LocalDateTime.now().plusHours(1).isAfter(slotDateTime)) {
            throw new ValidationException("Cannot cancel within 1 hour of booking");
        }

        // 更新预订状态
        booking.setStatus("CANCELLATION_REQUESTED");
        bookingRepository.save(booking);

        // 创建取消请求
        CancellationRequest request = new CancellationRequest();
        request.setBooking(booking);
        request.setRequestDate(LocalDateTime.now());
        request.setStatus("PENDING");
        request.setReason(reason != null ? reason : "User requested cancellation");
        cancellationRequestRepository.save(request);

        // 获取场馆信息
        Court court = courtRepository.findById(slot.getCourtId())
                .orElseThrow(() -> new ResourceNotFoundException("Court not found"));

        // 发送确认邮件
        emailService.sendCancellationConfirmation(
                booking.getMember().getUser().getEmail(),
                booking,
                slot,
                court
        );

        return new CancellationResponse(
                request.getId(),
                booking.getId(),
                request.getStatus(),
                request.getRequestDate(),
                "Cancellation request submitted"
        );
    }

    public List<SlotResponseDto> getAvailableSlots(LocalDate date) {
        return slotRepository.findByDateAndIsAvailableTrue(date).stream()
                .filter(slot -> {
                    // 檢查是否有課程預約佔用這個時段
                    LocalDateTime startDateTime = LocalDateTime.of(date, slot.getStartTime());
                    LocalDateTime endDateTime = LocalDateTime.of(date, slot.getEndTime());

                    // 檢查是否有 ClassSession 在這個時段
                    List<ClassSession> classSessions = classSessionRepository.findByCourtIdAndStartTimeBetween(
                        slot.getCourtId(),
                        startDateTime,
                        endDateTime
                    );
                    
                    // 過濾掉已取消的課程
                    boolean hasActiveClassSessions = classSessions.stream()
                        .anyMatch(session -> !"CANCELLED".equalsIgnoreCase(session.getStatus()));

                    // 檢查是否有已預訂的 BookingSlot
                    boolean isBooked = bookingSlotRepository.existsBySlotIdAndStatus(slot.getId(), "BOOKED");
                    
                    // 新增：檢查是否有Event衝突
                    List<Event> conflictingEvents = eventRepository.findByCourtsIdAndStartTimeBetweenAndStatusNot(
                        slot.getCourtId(),
                        startDateTime,
                        endDateTime,
                        "CANCELLED"
                    );
                    boolean hasEventConflict = !conflictingEvents.isEmpty();

                    return !hasActiveClassSessions && !isBooked && !hasEventConflict; // 只有沒有課程預約、未預訂且沒有Event衝突的時段才可用
                })
                .map(slot -> {
                    SlotResponseDto dto = new SlotResponseDto();
                    dto.setId(slot.getId());
                    dto.setCourtId(slot.getCourtId());
                    dto.setDate(slot.getDate());
                    dto.setStartTime(slot.getStartTime());
                    dto.setEndTime(slot.getEndTime());
                    dto.setStatus("AVAILABLE");
                    return dto;
                })
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<PendingCancellationRequestDto> getPendingCancellationRequests() {
        return cancellationRequestRepository.findByStatus("PENDING").stream()
                .map(request -> {
                    // Safe navigation through relationships
                    Booking booking = request.getBooking();
                    if (booking == null) return null;

                    Slot slot = booking.getBookingSlots() != null && !booking.getBookingSlots().isEmpty() ? booking.getBookingSlots().get(0).getSlot() : null;
                    if (slot == null) return null;

                    // Get court safely
                    Court court = courtRepository.findById(slot.getCourtId()).orElse(null);

                    // Get member name safely
                    String memberName = Optional.ofNullable(booking.getMember())
                            .map(Member::getUser)
                            .map(User::getName)
                            .orElse("Unknown Member");

                    return new PendingCancellationRequestDto(
                            request.getId(),
                            booking.getId(),
                            memberName,
                            slot != null ? slot.getDate() : null,
                            slot != null ? slot.getStartTime() : null,
                            court != null ? court.getName() : "Court not found",
                            request.getReason()
                    );
                })
                .filter(Objects::nonNull)  // Requires java.util.Objects import
                .collect(Collectors.toList());
    }

    @Transactional
    public CancellationResponse processCancellation(Integer requestId, boolean approve, String adminRemark) {
        CancellationRequest request = cancellationRequestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Cancellation request not found"));

        if (!"PENDING".equals(request.getStatus())) {
            throw new ValidationException("Request already processed");
        }

        Booking booking = request.getBooking();
        BookingSlot bookingSlot = booking.getBookingSlots() != null && !booking.getBookingSlots().isEmpty() ? booking.getBookingSlots().get(0) : null;
        Slot slot = bookingSlot != null ? bookingSlot.getSlot() : null;
        Court court = slot != null ? courtRepository.findById(slot.getCourtId())
                .orElseThrow(() -> new ResourceNotFoundException("Court not found")) : null;

        if (approve) {
            // 1. Free up the slot
            slot.setAvailable(true);
            slotRepository.save(slot);

            // 2. Update booking status
            String bookingStatus = "CANCELLED";
            if (bookingStatus.length() > 50) {
                bookingStatus = bookingStatus.substring(0, 50);
            }
            booking.setStatus(bookingStatus);
            bookingRepository.save(booking);

            // 3. Update booking slot status
            String slotStatus = "CANCELLED";
            if (slotStatus.length() > 50) {
                slotStatus = slotStatus.substring(0, 50);
            }
            bookingSlot.setStatus(slotStatus);
            bookingSlotRepository.save(bookingSlot);

            // 新增：同步取消 FriendlyMatch
            friendlyMatchService.cancelReservationAndMatch(booking.getId());

            // 4. 退款50%到钱包
            double refund = booking.getTotalAmount() * 0.5;
            Wallet wallet = walletRepository.findByMemberId(booking.getMember().getId())
                .orElseThrow(() -> new ResourceNotFoundException("Wallet not found"));
            
            double balanceBefore = wallet.getBalance();
            wallet.setBalance(wallet.getBalance() + refund);
            wallet.setTotalSpent(wallet.getTotalSpent() - refund); // 退款時減少總支出
            walletRepository.save(wallet);
            
            // 创建退款交易记录
            createWalletTransaction(wallet, "REFUND", refund, balanceBefore, wallet.getBalance(), 
                                  "BOOKING", booking.getId(), "Booking cancellation refund (50%) - Admin approved");

            // 5. 扣除積分（扣除50%的積分，與退款比例一致）
            Member member = booking.getMember();
            MemberService.PointDeductionResult deductionResult = memberService.deductPointsForRefund(member, booking.getTotalAmount(), 0.5);
            
            log.info("Deducted {} tier points and {} reward points from member {} for admin-approved booking cancellation {}",
                    deductionResult.getTierPointsDeducted(), deductionResult.getRewardPointsDeducted(), member.getId(), booking.getId());

            // 6. 更新支付状态
            Payment payment = booking.getPayment();
            if (payment != null) {
                payment.setStatus("REFUNDED");
                paymentRepository.save(payment);
            }

            // 6. 更新用户统计数据（减少预订小时数）
            User user = booking.getMember().getUser();
            double cancelledHours = booking.getBookingSlots().stream()
                    .mapToDouble(bs -> bs.getSlot().getDurationHours())
                    .sum();
            user.setBookingHours(Math.max(0, user.getBookingHours() - cancelledHours));
            user.setAmountSpent(Math.max(0, user.getAmountSpent() - booking.getTotalAmount()));
            userRepository.save(user);

            // 7. Update request
            request.setStatus("APPROVED");

            // Get current admin ID
            String username = SecurityContextHolder.getContext().getAuthentication().getName();
            User adminUser = userRepository.findByUserAccount_Username(username)
                    .orElseThrow(() -> new ResourceNotFoundException("Admin user not found"));
            request.setApprovedBy(adminUser.getId());
        } else {
            // Reject request - revert changes
            String bookingStatus = "CONFIRMED";
            if (bookingStatus.length() > 50) {
                bookingStatus = bookingStatus.substring(0, 50);
            }
            booking.setStatus(bookingStatus);
            bookingRepository.save(booking);

            // Keep booking slot as booked
            String slotStatus = "BOOKED";
            if (slotStatus.length() > 50) {
                slotStatus = slotStatus.substring(0, 50);
            }
            bookingSlot.setStatus(slotStatus);

            request.setStatus("REJECTED");
        }

        // 新增：保存 adminRemark
        if (adminRemark != null) {
            request.setAdminRemark(adminRemark);
        }
        cancellationRequestRepository.save(request);

        // Send decision email
        emailService.sendCancellationDecision(
                booking.getMember().getUser().getEmail(),
                booking,
                slot,
                court != null ? court.getName() : "Court not found",
                approve
        );

        return new CancellationResponse(
                request.getId(),
                booking.getId(),
                request.getStatus(),
                request.getRequestDate(),
                approve ? "Cancellation approved" : "Cancellation rejected"
        );
    }

    public List<BookingHistoryDto> getBookingHistory(Integer memberId, String status) {
        try {
            List<Booking> bookings = bookingRepository.findByMemberId(memberId);
            log.info("Found {} bookings for member {}", bookings.size(), memberId);
            
            // 獲取事件註冊記錄
            Integer userId = memberRepository.findById(memberId).map(Member::getUser).map(User::getId).orElse(null);
            List<EventRegistration> eventRegistrations = userId != null ? 
                eventRegistrationRepository.findByUser_Id(userId) : List.of();
            log.info("Found {} event registrations for member {}", eventRegistrations.size(), memberId);

            // 自動修正已過期的CONFIRMED預訂為COMPLETED
            LocalDateTime now = LocalDateTime.now();
            boolean updated = false;
            for (Booking booking : bookings) {
                if ("CONFIRMED".equalsIgnoreCase(booking.getStatus())) {
                    // 檢查所有 slots 是否都已過期
                    boolean allSlotsExpired = true;
                    if (booking.getBookingSlots() != null && !booking.getBookingSlots().isEmpty()) {
                        for (BookingSlot bookingSlot : booking.getBookingSlots()) {
                            Slot slot = bookingSlot.getSlot();
                            if (slot != null && slot.getDate() != null && slot.getEndTime() != null) {
                                LocalDateTime endDateTime = LocalDateTime.of(slot.getDate(), slot.getEndTime());
                                if (endDateTime.isAfter(now)) {
                                    allSlotsExpired = false;
                                    break;
                                }
                            }
                        }
                        if (allSlotsExpired) {
                            booking.setStatus("COMPLETED");
                            bookingRepository.save(booking);
                            updated = true;
                        }
                    }
                }
            }
            // 重新獲取最新狀態
            if (updated) {
                bookings = bookingRepository.findByMemberId(memberId);
            }

            List<BookingHistoryDto> bookingDtos = bookings.stream()
                    .filter(booking -> status == null || booking.getStatus().equalsIgnoreCase(status))
                    .map(booking -> {
                        try {
                            log.debug("Processing booking {} with {} booking slots", 
                                    booking.getId(), 
                                    booking.getBookingSlots() != null ? booking.getBookingSlots().size() : 0);
                            
                            // 獲取第一個和最後一個 slot 來顯示時間範圍
                            Slot firstSlot = null;
                            Slot lastSlot = null;
                            int totalDuration = 0;
                            
                            if (booking.getBookingSlots() != null && !booking.getBookingSlots().isEmpty()) {
                                // 按時間排序
                                List<BookingSlot> sortedSlots = booking.getBookingSlots().stream()
                                        .sorted((a, b) -> a.getSlot().getStartTime().compareTo(b.getSlot().getStartTime()))
                                        .collect(Collectors.toList());
                                
                                firstSlot = sortedSlots.get(0).getSlot();
                                lastSlot = sortedSlots.get(sortedSlots.size() - 1).getSlot();
                                
                                // 計算總時長
                                totalDuration = sortedSlots.stream()
                                        .mapToInt(bs -> bs.getSlot().getDurationHours() != null ? bs.getSlot().getDurationHours() : 1)
                                        .sum();
                                
                                log.debug("Booking {} has {} slots, total duration: {}", 
                                        booking.getId(), sortedSlots.size(), totalDuration);
                            } else {
                                log.warn("Booking {} has no booking slots!", booking.getId());
                            }
                            
                            Court court = null;
                            if (firstSlot != null) {
                                court = courtRepository.findById(firstSlot.getCourtId()).orElse(new Court());
                            } else {
                                // 如果沒有slots，嘗試從booking的其他信息獲取court
                                log.warn("No slots found for booking {}, trying to get court info from booking", booking.getId());
                                // 嘗試通過查詢數據庫獲取court信息
                                try {
                                    // 查詢這個booking的所有bookingSlots
                                    List<BookingSlot> bookingSlots = bookingSlotRepository.findByBookingId(booking.getId());
                                    if (!bookingSlots.isEmpty()) {
                                        Slot slot = bookingSlots.get(0).getSlot();
                                        if (slot != null) {
                                            court = courtRepository.findById(slot.getCourtId()).orElse(new Court());
                                            log.info("Found court info for booking {} through direct query: {}", booking.getId(), court.getName());
                                        }
                                    } else {
                                        log.error("No booking slots found in database for booking {}", booking.getId());
                                        court = new Court();
                                    }
                                } catch (Exception e) {
                                    log.error("Error getting court info for booking {}: {}", booking.getId(), e.getMessage());
                                    court = new Court();
                                }
                            }
                            
                            // 安全地處理 Payment 信息，避免 null 值問題
                            Payment payment = booking.getPayment();
                            if (payment != null) {
                                // 如果 originalAmount 為 null，設置為 amount
                                if (payment.getOriginalAmount() == null) {
                                    payment.setOriginalAmount(payment.getAmount());
                                }
                                // discountAmount 是 double 類型，不需要 null 檢查
                            }
                            
                            // 安全地處理 Booking 的折扣信息
                            if (booking.getOriginalAmount() == null) {
                                booking.setOriginalAmount(booking.getTotalAmount());
                            }
                            if (booking.getDiscountAmount() == null) {
                                booking.setDiscountAmount(0.0);
                            }
                            
                            BookingHistoryDto dto = new BookingHistoryDto();
                            dto.setId(booking.getId());
                            dto.setCourtId(court.getId());
                            dto.setCourtName(court.getName());
                            dto.setLocation(court.getLocation());
                            dto.setDate(firstSlot != null ? firstSlot.getDate() : null);
                            dto.setStartTime(firstSlot != null ? firstSlot.getStartTime() : null);
                            dto.setEndTime(lastSlot != null ? lastSlot.getEndTime() : null);
                            dto.setAmount(booking.getTotalAmount());
                            dto.setStatus(booking.getStatus());
                            dto.setCreatedAt(booking.getBookingDate());
                            dto.setPurpose(booking.getPurpose());
                            dto.setNumberOfPlayers(booking.getNumberOfPlayers());
                            dto.setDurationHours(totalDuration);
                            dto.setNumPaddles(booking.getNumPaddles());
                            dto.setBuyBallSet(booking.getBuyBallSet());
                            
                            // 檢查用戶是否已經評價過這個預訂
                            boolean hasReviewed = false;
                            if (booking.getMember() != null && booking.getMember().getUser() != null) {
                                hasReviewed = feedbackRepository.findByUserId(booking.getMember().getUser().getId()).stream()
                                        .anyMatch(feedback -> feedback.getBooking() != null 
                                                && feedback.getBooking().getId().equals(booking.getId()));
                            }
                            dto.setHasReviewed(hasReviewed);
                            dto.setBookingType("COURT_BOOKING"); // 標記為場地預訂
                            
                            return dto;
                        } catch (Exception e) {
                            log.error("Error processing booking {}: {}", booking.getId(), e.getMessage());
                            // 返回一個基本的 DTO，避免整個列表失敗
                            BookingHistoryDto dto = new BookingHistoryDto();
                            dto.setId(booking.getId());
                            dto.setStatus(booking.getStatus());
                            dto.setAmount(booking.getTotalAmount());
                            dto.setCreatedAt(booking.getBookingDate());
                            // 嘗試從第一個slot獲取courtId
                            if (booking.getBookingSlots() != null && !booking.getBookingSlots().isEmpty()) {
                                Slot firstSlot = booking.getBookingSlots().get(0).getSlot();
                                if (firstSlot != null) {
                                    dto.setCourtId(firstSlot.getCourtId());
                                }
                            }
                            dto.setBookingType("COURT_BOOKING"); // 標記為場地預訂
                            return dto;
                        }
                    })
                    .collect(Collectors.toList());
            
            // 將事件註冊記錄轉換為 BookingHistoryDto 格式
            List<BookingHistoryDto> eventDtos = eventRegistrations.stream()
                .map(eventReg -> {
                    try {
                        BookingHistoryDto dto = new BookingHistoryDto();
                        dto.setId(eventReg.getRegistrationId()); // 使用 registrationId 作為 ID
                        dto.setCourtId(null); // 事件沒有 courtId
                        dto.setCourtName(eventReg.getEvent().getTitle()); // 使用事件標題作為 courtName
                        dto.setLocation(eventReg.getEvent().getLocation()); // 使用事件地點
                        dto.setDate(eventReg.getEvent().getStartTime().toLocalDate()); // 使用事件開始日期
                        dto.setStartTime(eventReg.getEvent().getStartTime().toLocalTime()); // 使用事件開始時間
                        dto.setEndTime(eventReg.getEvent().getEndTime() != null ? 
                            eventReg.getEvent().getEndTime().toLocalTime() : 
                            eventReg.getEvent().getStartTime().plusHours(2).toLocalTime()); // 使用事件結束時間或默認2小時
                        dto.setAmount(eventReg.getFeeAmount() != null ? eventReg.getFeeAmount() : 0.0);
                        
                        // 根據事件時間和註冊狀態計算顯示狀態
                        String displayStatus = eventReg.getStatus();
                        if ("REGISTERED".equals(eventReg.getStatus())) {
                            LocalDateTime eventStartTime = eventReg.getEvent().getStartTime();
                            LocalDateTime eventEndTime = eventReg.getEvent().getEndTime();
                            LocalDateTime currentTime = LocalDateTime.now();
                            
                            // 檢查事件時間是否為 null
                            if (eventStartTime == null) {
                                log.warn("Event {} has null start time, defaulting to UPCOMING", eventReg.getEvent().getTitle());
                                displayStatus = "UPCOMING";
                            } else {
                                // 添加詳細的調試日誌
                                log.info("=== Event Status Calculation Debug ===");
                                log.info("Event: {}", eventReg.getEvent().getTitle());
                                log.info("Event Start Time: {}", eventStartTime);
                                log.info("Event End Time: {}", eventEndTime);
                                log.info("Current Time: {}", currentTime);
                                log.info("Is current time after end time? {}", eventEndTime != null && currentTime.isAfter(eventEndTime));
                                log.info("Is current time before start time? {}", eventStartTime != null && currentTime.isBefore(eventStartTime));
                                log.info("Is current time between start and end? {}", 
                                    eventStartTime != null && eventEndTime != null && 
                                    currentTime.isAfter(eventStartTime) && currentTime.isBefore(eventEndTime));
                                
                                if (eventEndTime != null && currentTime.isAfter(eventEndTime)) {
                                    displayStatus = "COMPLETED";
                                    log.info("Result: Event marked as COMPLETED");
                                } else if (eventStartTime != null && currentTime.isBefore(eventStartTime)) {
                                    displayStatus = "UPCOMING";
                                    log.info("Result: Event marked as UPCOMING");
                                } else if (eventStartTime != null && eventEndTime != null && 
                                         currentTime.isAfter(eventStartTime) && currentTime.isBefore(eventEndTime)) {
                                    displayStatus = "ONGOING";
                                    log.info("Result: Event marked as ONGOING");
                                } else {
                                    // 如果無法確定狀態，默認為 UPCOMING
                                    displayStatus = "UPCOMING";
                                    log.info("Result: Event status unclear, defaulting to UPCOMING");
                                }
                                log.info("Final display status: {}", displayStatus);
                                log.info("=== End Debug ===");
                            }
                        }
                        
                        dto.setStatus(displayStatus);
                        dto.setCreatedAt(eventReg.getRegistrationDate());
                        dto.setPurpose("Event Registration"); // 標記為事件註冊
                        dto.setNumberOfPlayers(1); // 事件註冊通常是個人
                        dto.setDurationHours(2); // 默認事件時長
                        dto.setNumPaddles(0); // 事件通常不包含設備
                        dto.setBuyBallSet(false);
                        dto.setHasReviewed(false); // 事件註冊不包含評價
                        dto.setBookingType("EVENT"); // 新增：標記為事件類型
                        
                        return dto;
                    } catch (Exception e) {
                        log.error("Error processing event registration {}: {}", eventReg.getRegistrationId(), e.getMessage());
                        // 返回一個基本的 DTO
                        BookingHistoryDto dto = new BookingHistoryDto();
                        dto.setId(eventReg.getRegistrationId());
                        dto.setStatus(eventReg.getStatus());
                        dto.setAmount(eventReg.getFeeAmount() != null ? eventReg.getFeeAmount() : 0.0);
                        dto.setCreatedAt(eventReg.getRegistrationDate());
                        dto.setBookingType("EVENT");
                        return dto;
                    }
                })
                .collect(Collectors.toList());
            
            // 合併場地預訂和事件註冊記錄，按創建時間排序
            List<BookingHistoryDto> allBookings = new ArrayList<>();
            allBookings.addAll(bookingDtos);
            allBookings.addAll(eventDtos);
            
            // 按創建時間降序排序
            allBookings.sort((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()));
            
            return allBookings;
        } catch (Exception e) {
            log.error("Error in getBookingHistory for member {}: {}", memberId, e.getMessage(), e);
            throw new RuntimeException("Failed to load booking history", e);
        }
    }

    private Wallet getOrCreateWallet(Member member) {
        return walletRepository.findByMemberId(member.getId())
                .orElseGet(() -> {
                    Wallet newWallet = new Wallet();
                    newWallet.setMember(member);
                    newWallet.setBalance(0.00);
                    return walletRepository.save(newWallet);
                });
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

    /**
     * 清理重复的 BookingSlot 记录
     * 这个方法应该只在需要时手动调用
     */
    @Transactional
    public void cleanupDuplicateBookingSlots() {
        log.info("Starting cleanup of duplicate booking slots...");
        
        // 使用原生 SQL 查询找到重复记录
        String findDuplicatesSql = """
            SELECT booking_id, slot_id, COUNT(*) as count 
            FROM bookingslot 
            GROUP BY booking_id, slot_id 
            HAVING COUNT(*) > 1
            """;
        
        // 这里需要注入 JdbcTemplate 来执行原生 SQL
        // 暂时用日志记录，实际清理需要手动执行 SQL
        
        log.warn("Duplicate booking slots detected. Please run the following SQL manually:");
        log.warn("DELETE bs1 FROM bookingslot bs1");
        log.warn("INNER JOIN bookingslot bs2");
        log.warn("WHERE bs1.id > bs2.id");
        log.warn("AND bs1.booking_id = bs2.booking_id");
        log.warn("AND bs1.slot_id = bs2.slot_id;");
    }
}