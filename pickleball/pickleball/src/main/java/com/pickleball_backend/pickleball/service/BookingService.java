package com.pickleball_backend.pickleball.service;

import com.pickleball_backend.pickleball.dto.*;
import com.pickleball_backend.pickleball.entity.*;
import com.pickleball_backend.pickleball.exception.ResourceNotFoundException;
import com.pickleball_backend.pickleball.exception.ValidationException;
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

        // 7. Process wallet payment if requested
        Payment payment = new Payment();
        payment.setAmount(amount);
        payment.setPaymentDate(LocalDateTime.now());
        payment.setPaymentType("BOOKING");

        if (request.isUseWallet()) {
            if (wallet.getBalance() < amount) {
                throw new ValidationException("Insufficient wallet balance. Available: " + wallet.getBalance());
            }
            wallet.setBalance(wallet.getBalance() - amount);
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

        // 9. Create BookingSlot records
        log.info("Creating {} BookingSlot records for booking {}", slots.size(), booking.getId());
        for (Slot slot : slots) {
            BookingSlot bookingSlot = new BookingSlot();
            bookingSlot.setBooking(booking);
            bookingSlot.setSlot(slot);
            String statusValue = "BOOKED";
            if (statusValue.length() > 50) {
                statusValue = statusValue.substring(0, 50);
            }
            bookingSlot.setStatus(statusValue);
            bookingSlotRepository.save(bookingSlot);
            log.info("Created BookingSlot: bookingId={}, slotId={}", booking.getId(), slot.getId());
            // 10. Update slot availability
            slot.setAvailable(false);
            slotRepository.save(slot);
        }

        // 11. Generate receipt
        emailService.sendBookingConfirmation(account.getUser().getEmail(), booking, court, slots.get(0));

        // 12. Create response with updated balance
        BookingResponseDto response = mapToBookingResponse(booking, court, slots.get(0));
        response.setDurationHours(totalDuration);
        response.setWalletBalance(wallet.getBalance());

        // 13. 更新用户统计数据
        User user = member.getUser();
        if (user != null) {
            List<Booking> userBookings = bookingRepository.findByMemberId(member.getId());
            user.setBookingsMade(userBookings.size());
            // 统计所有预订的总时长（小时）
            double totalHours = userBookings.stream().mapToDouble(b -> {
                if (b.getBookingSlots() != null && !b.getBookingSlots().isEmpty()) {
                    return b.getBookingSlots().stream().mapToInt(bs -> bs.getSlot().getDurationHours()).sum();
                } else if (b.getNumberOfPlayers() != null) {
                    return 0; // 这里不能用 numberOfPlayers，老数据无 duration 时记为0
                } else {
                    return 0;
                }
            }).sum();
            user.setBookingHours(totalHours);
            user.setAmountSpent(userBookings.stream().mapToDouble(Booking::getTotalAmount).sum());
            userRepository.save(user);
        }

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
            wallet.setBalance(wallet.getBalance() + refund);
            walletRepository.save(wallet);
            // 可选：记录退款流水

            // 6. 更新支付状态
            Payment payment = booking.getPayment();
            if (payment != null) {
                payment.setStatus("REFUNDED");
                paymentRepository.save(payment);
            }

            // 7. 发送邮件通知
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

            // 4. Update request
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

            // 自动修正已过期的CONFIRMED预订为COMPLETED
            LocalDateTime now = LocalDateTime.now();
            boolean updated = false;
            for (Booking booking : bookings) {
                if ("CONFIRMED".equalsIgnoreCase(booking.getStatus())) {
                    // 检查所有 slots 是否都已过期
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
            // 重新获取最新状态
            if (updated) {
                bookings = bookingRepository.findByMemberId(memberId);
            }

            return bookings.stream()
                    .filter(booking -> status == null || booking.getStatus().equalsIgnoreCase(status))
                    .map(booking -> {
                        try {
                            // 获取第一个和最后一个 slot 来显示时间范围
                            Slot firstSlot = null;
                            Slot lastSlot = null;
                            int totalDuration = 0;
                            
                            if (booking.getBookingSlots() != null && !booking.getBookingSlots().isEmpty()) {
                                // 按时间排序
                                List<BookingSlot> sortedSlots = booking.getBookingSlots().stream()
                                        .sorted((a, b) -> a.getSlot().getStartTime().compareTo(b.getSlot().getStartTime()))
                                        .collect(Collectors.toList());
                                
                                firstSlot = sortedSlots.get(0).getSlot();
                                lastSlot = sortedSlots.get(sortedSlots.size() - 1).getSlot();
                                
                                // 计算总时长
                                totalDuration = sortedSlots.stream()
                                        .mapToInt(bs -> bs.getSlot().getDurationHours() != null ? bs.getSlot().getDurationHours() : 1)
                                        .sum();
                                
                                log.debug("Booking {} has {} slots, total duration: {}", 
                                        booking.getId(), sortedSlots.size(), totalDuration);
                            }
                            
                            Court court = firstSlot != null ? courtRepository.findById(firstSlot.getCourtId())
                                    .orElse(new Court()) : new Court();

                            BookingHistoryDto dto = new BookingHistoryDto();
                            dto.setId(booking.getId());
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
                            // 设置总时长
                            dto.setDurationHours(totalDuration);
                            return dto;
                        } catch (Exception e) {
                            log.error("Error processing booking {}: {}", booking.getId(), e.getMessage());
                            // 返回一个基本的 DTO，避免整个请求失败
                            BookingHistoryDto dto = new BookingHistoryDto();
                            dto.setId(booking.getId());
                            dto.setStatus(booking.getStatus());
                            dto.setAmount(booking.getTotalAmount());
                            dto.setCreatedAt(booking.getBookingDate());
                            return dto;
                        }
                    })
                    .collect(Collectors.toList());
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