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

import java.security.Principal;
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