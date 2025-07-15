package com.pickleball_backend.pickleball.service;

import com.pickleball_backend.pickleball.dto.AdminBookingDto;
import com.pickleball_backend.pickleball.dto.AdminUserDto;
import com.pickleball_backend.pickleball.entity.*;
import com.pickleball_backend.pickleball.repository.BookingRepository;
import com.pickleball_backend.pickleball.repository.CourtRepository;
import com.pickleball_backend.pickleball.repository.UserRepository;
import com.pickleball_backend.pickleball.repository.BookingSlotRepository;
import com.pickleball_backend.pickleball.repository.SlotRepository;
import com.pickleball_backend.pickleball.repository.PaymentRepository;
import com.pickleball_backend.pickleball.repository.MemberRepository;
import com.pickleball_backend.pickleball.repository.WalletRepository;
import com.pickleball_backend.pickleball.repository.UserAccountRepository;
import com.pickleball_backend.pickleball.repository.CancellationRequestRepository;
import com.pickleball_backend.pickleball.service.EmailService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.stream.Collectors;
import org.springframework.util.StringUtils;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;

@Service
@RequiredArgsConstructor
public class AdminDashboardServiceImpl implements AdminDashboardService {

    private final BookingSlotRepository bookingSlotRepository;
    private final SlotRepository slotRepository;
    private final PaymentRepository paymentRepository;
    private final EmailService emailService;
    private final MemberRepository memberRepository;
    private final UserRepository userRepository;
    private final WalletRepository walletRepository;
    private final UserAccountRepository userAccountRepository;
    private final CancellationRequestRepository cancellationRequestRepository;
    private final BookingRepository bookingRepository;
    private final CourtRepository courtRepository;

    @Override
    public List<AdminUserDto> getAllUsers() {
        return userRepository.findAll().stream()
                .map(this::convertToAdminUserDto)
                .collect(Collectors.toList());
    }

    @Override
    public long getTotalUserCount() {
        return userRepository.count();
    }
    

    @Override
    public Page<AdminBookingDto> getAllBookings(Pageable pageable, String search, String status, String startDate, String endDate) {
        LocalDate start = null;
        LocalDate end = null;
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd");
        try {
            if (startDate != null && !startDate.isEmpty()) {
                start = LocalDate.parse(startDate, formatter);
            }
            if (endDate != null && !endDate.isEmpty()) {
                end = LocalDate.parse(endDate, formatter);
            }
        } catch (Exception e) {
            // ignore parse error, treat as null
        }
        Page<Booking> bookings = bookingRepository.findByAdminFilters(
            (search != null && !search.isEmpty()) ? search : null,
            (status != null && !status.isEmpty()) ? status : null,
            start,
            end,
            pageable
        );
        List<Integer> ids = bookings.getContent().stream().map(Booking::getId).toList();
        List<Booking> bookingsWithAll = ids.isEmpty() ? List.of() : bookingRepository.findAllWithAdminRelationsByIds(ids);
        java.util.Map<Integer, Booking> bookingMap = bookingsWithAll.stream().collect(java.util.stream.Collectors.toMap(Booking::getId, b -> b));
        List<AdminBookingDto> dtos = bookings.getContent().stream()
            .map(b -> bookingMap.getOrDefault(b.getId(), b))
            .map(this::convertToAdminBookingDto)
            .collect(java.util.stream.Collectors.toList());
        return new org.springframework.data.domain.PageImpl<>(dtos, pageable, bookings.getTotalElements());
    }

    @Override
    @Transactional
    public Object cancelBookingForAdmin(Integer bookingId, String adminRemark) {
        Booking booking = bookingRepository.findByIdWithCancellation(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found"));
        BookingSlot bookingSlot = booking.getBookingSlots() != null && !booking.getBookingSlots().isEmpty() ? booking.getBookingSlots().get(0) : null;
        Slot slot = bookingSlot != null ? bookingSlot.getSlot() : null;
        Court court = slot != null ? courtRepository.findById(slot.getCourtId())
                .orElseThrow(() -> new RuntimeException("Court not found")) : null;
        // 1. Free up the slot
        if (slot != null) {
            slot.setAvailable(true);
            slotRepository.save(slot);
        }
        // 2. Update booking status
        booking.setStatus("CANCELLED");
        bookingRepository.save(booking);
        // 3. Update booking slot status
        if (bookingSlot != null) {
            bookingSlot.setStatus("CANCELLED");
            bookingSlotRepository.save(bookingSlot);
        }
        // 4. Refund payment if needed (optional, can be expanded)
        Payment payment = booking.getPayment();
        if (payment != null) {
            payment.setStatus("REFUNDED");
            paymentRepository.save(payment);
        }
        // 5. 保存管理员备注到取消请求（如有）
        CancellationRequest cancellationRequest = booking.getCancellationRequest();
        if (cancellationRequest != null && StringUtils.hasText(adminRemark)) {
            cancellationRequest.setAdminRemark(adminRemark);
            cancellationRequestRepository.save(cancellationRequest);
        }
        // 6. Send email notification
        emailService.sendCancellationDecision(
                booking.getMember().getUser().getEmail(),
                booking,
                slot,
                court != null ? court.getName() : "Court not found",
                true
        );
        return java.util.Map.of(
                "success", true,
                "message", "Booking cancelled successfully by admin."
        );
    }

    public AdminUserDto convertToAdminUserDto(User user) {
        AdminUserDto dto = new AdminUserDto();
        dto.setId(user.getId());
        dto.setName(user.getName());
        dto.setEmail(user.getEmail());
        dto.setPhone(user.getPhone());
        dto.setDob(user.getDob());
        dto.setGender(user.getGender());
        dto.setUserType(user.getUserType());

        UserAccount account = user.getUserAccount();
        if (account != null) {
            dto.setUsername(account.getUsername());
            dto.setStatus(account.getStatus());
            dto.setProfileImage(account.getProfileImage());
        }

        Member member = user.getMember();
        if (member != null) {
            dto.setPointBalance(member.getPointBalance());
            if (member.getTier() != null) {
                // 修复这里：直接使用 tierName 字符串值，不需要 .name()
                dto.setTier(member.getTier().getTierName()); // 移除了 .name()
            }
        }
        return dto;
    }

    private AdminBookingDto convertToAdminBookingDto(Booking booking) {
        AdminBookingDto dto = new AdminBookingDto();
        dto.setId(booking.getId());
        dto.setBookingDate(booking.getBookingDate());
        dto.setTotalAmount(booking.getTotalAmount());
        dto.setStatus(booking.getStatus());

        if (booking.getMember() != null && booking.getMember().getUser() != null) {
            dto.setMemberName(booking.getMember().getUser().getName());
            dto.setMemberPhone(booking.getMember().getUser().getPhone());
            dto.setMemberEmail(booking.getMember().getUser().getEmail());
        }

        Slot slot = booking.getBookingSlots() != null && !booking.getBookingSlots().isEmpty() ? booking.getBookingSlots().get(0).getSlot() : null;
        if (slot != null) {
            dto.setSlotDate(slot.getDate());
            dto.setStartTime(slot.getStartTime());
            dto.setEndTime(slot.getEndTime());

            Court court = courtRepository.findById(slot.getCourtId()).orElse(null);
            if (court != null) {
                dto.setCourtName(court.getName());
            }
        }

        dto.setPurpose(booking.getPurpose());
        dto.setNumberOfPlayers(booking.getNumberOfPlayers());
        CancellationRequest cancellationRequest = booking.getCancellationRequest();
        if (cancellationRequest != null) {
            dto.setAdminRemark(cancellationRequest.getAdminRemark());
            // 新增：组装 CancellationRequestDto
            com.pickleball_backend.pickleball.dto.CancellationRequestDto crDto = new com.pickleball_backend.pickleball.dto.CancellationRequestDto();
            crDto.setId(cancellationRequest.getId());
            crDto.setReason(cancellationRequest.getReason());
            crDto.setStatus(cancellationRequest.getStatus());
            crDto.setAdminRemark(cancellationRequest.getAdminRemark());
            crDto.setRequestDate(cancellationRequest.getRequestDate());
            dto.setCancellationRequest(crDto);
        }
        return dto;
    }
}