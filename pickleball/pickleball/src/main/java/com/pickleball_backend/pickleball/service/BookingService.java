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
        if (slotIds.isEmpty()) {
            throw new ValidationException("No slot selected");
        }

        // 5. 获取所有 slot，校验连续性、可用性
        List<Slot> slots = slotRepository.findAllById(slotIds);
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
        double amount = calculateBookingAmount(court, slots.get(0), totalDuration); // 以第一个slot为基准

        // 7. Process wallet payment if requested
        Payment payment = new Payment();
        payment.setAmount(amount);
        payment.setPaymentDate(LocalDate.now());

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
        booking.setBookingDate(LocalDate.now());
        booking.setTotalAmount(amount);
        String bookingStatus = "CONFIRMED";
        if (bookingStatus.length() > 50) {
            bookingStatus = bookingStatus.substring(0, 50);
        }
        booking.setStatus(bookingStatus);
        booking.setMember(member);
        booking.setSlot(slots.get(0)); // 以第一个slot为主
        booking.setPayment(payment);
        booking.setPurpose(request.getPurpose());
        booking.setNumberOfPlayers(request.getNumberOfPlayers());
        booking = bookingRepository.save(booking);

        // 9. Create BookingSlot records
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

    private BookingResponseDto mapToBookingResponse(Booking booking, Court court, Slot slot) {
        BookingResponseDto response = new BookingResponseDto();
        response.setBookingId(booking.getId());
        response.setCourtName(court.getName());
        response.setCourtLocation(court.getLocation());
        response.setSlotDate(slot.getDate());
        response.setStartTime(slot.getStartTime());
        response.setEndTime(slot.getEndTime());
        response.setTotalAmount(booking.getTotalAmount());
        response.setBookingStatus(booking.getStatus());
        response.setPurpose(booking.getPurpose());
        response.setNumberOfPlayers(booking.getNumberOfPlayers());
        response.setCourtNumber(slot.getCourtNumber());

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
    public CancellationResponse cancelBooking(Integer bookingId, String username) {
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
        Slot slot = booking.getSlot();

        // 5. 检查取消资格（1小时限制）
        LocalDateTime slotDateTime = LocalDateTime.of(slot.getDate(), slot.getStartTime());
        if (LocalDateTime.now().plusHours(1).isAfter(slotDateTime)) {
            throw new ValidationException("Cannot cancel within 1 hour of booking");
        }

        // 6. 更新预订状态
        booking.setStatus("CANCELLATION_REQUESTED");
        bookingRepository.save(booking);

        // 7. 创建取消请求
        CancellationRequest request = new CancellationRequest();
        request.setBooking(booking);
        request.setRequestDate(LocalDate.now());
        request.setStatus("PENDING");
        request.setReason("User requested cancellation");
        cancellationRequestRepository.save(request);

        // 8. 获取场馆信息
        Court court = courtRepository.findById(slot.getCourtId())
                .orElseThrow(() -> new ResourceNotFoundException("Court not found"));

        // 9. 发送确认邮件
        emailService.sendCancellationConfirmation(
                booking.getMember().getUser().getEmail(),
                booking,
                slot,
                court
        );

        // 10. 返回响应
        return new CancellationResponse(
                request.getId(),
                bookingId,
                "PENDING",
                LocalDate.now(),
                "Cancellation request submitted. Waiting for admin approval."
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

                    Slot slot = booking.getSlot();
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
                            slot.getDate(),
                            slot.getStartTime(),
                            court != null ? court.getName() : "Court not found",
                            request.getReason()
                    );
                })
                .filter(Objects::nonNull)  // Requires java.util.Objects import
                .collect(Collectors.toList());
    }

    @Transactional
    public CancellationResponse processCancellation(Integer requestId, boolean approve) {
        CancellationRequest request = cancellationRequestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Cancellation request not found"));

        if (!"PENDING".equals(request.getStatus())) {
            throw new ValidationException("Request already processed");
        }

        Booking booking = request.getBooking();
        BookingSlot bookingSlot = booking.getBookingSlot();
        Slot slot = bookingSlot.getSlot();
        Court court = courtRepository.findById(slot.getCourtId())
                .orElseThrow(() -> new ResourceNotFoundException("Court not found"));

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

        cancellationRequestRepository.save(request);

        // Send decision email
        emailService.sendCancellationDecision(
                booking.getMember().getUser().getEmail(),
                booking,
                slot,
                court.getName(),
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
        List<Booking> bookings = bookingRepository.findByMemberId(memberId);

        // 自动修正已过期的CONFIRMED预订为COMPLETED
        LocalDateTime now = LocalDateTime.now();
        boolean updated = false;
        for (Booking booking : bookings) {
            if ("CONFIRMED".equalsIgnoreCase(booking.getStatus())) {
                Slot slot = booking.getSlot();
                if (slot != null && slot.getDate() != null && slot.getEndTime() != null) {
                    LocalDateTime endDateTime = LocalDateTime.of(slot.getDate(), slot.getEndTime());
                    if (endDateTime.isBefore(now)) {
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
                    Slot slot = booking.getSlot();
                    Court court = courtRepository.findById(slot.getCourtId())
                            .orElse(new Court());

                    BookingHistoryDto dto = new BookingHistoryDto();
                    dto.setId(booking.getId());
                    dto.setCourtName(court.getName());
                    dto.setLocation(court.getLocation());
                    dto.setDate(slot.getDate());
                    dto.setStartTime(slot.getStartTime());
                    dto.setEndTime(slot.getEndTime());
                    dto.setAmount(booking.getTotalAmount());
                    dto.setStatus(booking.getStatus());
                    dto.setCreatedAt(booking.getBookingDate());
                    dto.setPurpose(booking.getPurpose());
                    dto.setPlayers(booking.getNumberOfPlayers());
                    dto.setCourtNumber(slot.getCourtNumber());
                    // Add duration to history
                    dto.setDurationHours(slot.getDurationHours());
                    return dto;
                })
                .collect(Collectors.toList());
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
}