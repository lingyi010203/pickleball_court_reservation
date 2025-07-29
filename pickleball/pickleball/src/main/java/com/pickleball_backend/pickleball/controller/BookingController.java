package com.pickleball_backend.pickleball.controller;

import com.pickleball_backend.pickleball.dto.BookingRequestDto;
import com.pickleball_backend.pickleball.dto.BookingResponseDto;
import com.pickleball_backend.pickleball.dto.CancellationResponse;
import com.pickleball_backend.pickleball.entity.Member;
import com.pickleball_backend.pickleball.entity.UserAccount;
import com.pickleball_backend.pickleball.exception.ResourceNotFoundException;
import com.pickleball_backend.pickleball.repository.MemberRepository;
import com.pickleball_backend.pickleball.repository.UserAccountRepository;
import com.pickleball_backend.pickleball.service.BookingService;
import com.pickleball_backend.pickleball.service.MemberService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.ErrorResponse;
import org.springframework.web.bind.annotation.*;
import com.pickleball_backend.pickleball.dto.BookingHistoryDto;
import com.pickleball_backend.pickleball.entity.Booking;
import com.pickleball_backend.pickleball.repository.BookingRepository;
import com.pickleball_backend.pickleball.dto.BookingSimpleDto;
import com.pickleball_backend.pickleball.entity.Court;
import com.pickleball_backend.pickleball.repository.CourtRepository;

import java.security.Principal;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/member")
@RequiredArgsConstructor
public class BookingController {

    private final BookingService bookingService;
    private final MemberService memberService;
    private final MemberRepository memberRepository;
    private final UserAccountRepository userAccountRepository;
    private final BookingRepository bookingRepository;
    private final CourtRepository courtRepository;

    @PostMapping("/bookings")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<?> bookCourt(@RequestBody BookingRequestDto request) {
        try {
            BookingResponseDto response = bookingService.bookCourt(request);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("errorCode", "BOOKING_FAILED");
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
        }
    }

    @GetMapping("/bookings")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<List<BookingHistoryDto>> getBookingHistory(
            @RequestParam(required = false) String status) {
        // Get current user's member ID
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        Integer memberId = memberService.getMemberIdByUsername(username);

        return ResponseEntity.ok(bookingService.getBookingHistory(memberId, status));
    }

/*    @GetMapping("/bookings/{id}")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<BookingHistoryDto> getBookingDetails(@PathVariable Integer id) {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        Integer memberId = memberService.getMemberIdByUsername(username);

        return ResponseEntity.ok(bookingService.getBookingDetails(id, memberId));
    }*/

    @GetMapping("/my-upcoming")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<?> getMyUpcomingBookings(Principal principal) {
        String username = principal.getName();
        Member member = memberRepository.findByUsername(username);
        if (member == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("No member found for user: " + username);
        }
        java.time.LocalDate today = java.time.LocalDate.now();
        java.time.LocalTime nowTime = java.time.LocalTime.now();
        List<Booking> bookings = bookingRepository.findUpcomingBookingsByMember(member, today, nowTime);
        // 直接複用 BookingHistoryDto，確保欄位一致
        List<BookingHistoryDto> dtos = bookings.stream().map(b -> {
            BookingHistoryDto dto = new BookingHistoryDto();
            dto.setId(b.getId());
            if (b.getBookingSlots() != null && !b.getBookingSlots().isEmpty() && b.getBookingSlots().get(0).getSlot() != null) {
                var slot = b.getBookingSlots().get(0).getSlot();
                dto.setCourtName(slot.getCourtId() != null ? (courtRepository.findById(slot.getCourtId()).map(c -> c.getName()).orElse("Court")) : "Court");
                dto.setDate(slot.getDate());
                dto.setStartTime(slot.getStartTime());
                dto.setEndTime(slot.getEndTime());
            }
            dto.setStatus(b.getStatus());
            dto.setCreatedAt(b.getBookingDate());
            dto.setPurpose(b.getPurpose());
            dto.setNumberOfPlayers(b.getNumberOfPlayers());
            dto.setNumPaddles(b.getNumPaddles());
            dto.setBuyBallSet(b.getBuyBallSet());
            // 其他欄位可依需求補充
            return dto;
        }).toList();
        return ResponseEntity.ok(dtos);
    }

    @PostMapping("/cleanup-duplicates")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> cleanupDuplicateBookingSlots() {
        try {
            bookingService.cleanupDuplicateBookingSlots();
            return ResponseEntity.ok("Cleanup instructions logged. Please check server logs and run the suggested SQL manually.");
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error during cleanup: " + e.getMessage());
        }
    }

    @PostMapping("/cleanup-booking-slots")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> cleanupDuplicateBookingSlotsDirect() {
        try {
            // 这里可以添加直接的数据库清理逻辑
            // 暂时返回 SQL 指令
            String cleanupSql = """
                -- 删除重复的 BookingSlot 记录
                DELETE bs1 FROM bookingslot bs1
                INNER JOIN bookingslot bs2
                WHERE bs1.id > bs2.id
                AND bs1.booking_id = bs2.booking_id
                AND bs1.slot_id = bs2.slot_id;
                
                -- 查看是否还有重复记录
                SELECT booking_id, slot_id, COUNT(*) as count 
                FROM bookingslot 
                GROUP BY booking_id, slot_id 
                HAVING COUNT(*) > 1;
                """;
            
            return ResponseEntity.ok(Map.of(
                "message", "Please run the following SQL to clean up duplicate booking slots:",
                "sql", cleanupSql
            ));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error: " + e.getMessage());
        }
    }
}