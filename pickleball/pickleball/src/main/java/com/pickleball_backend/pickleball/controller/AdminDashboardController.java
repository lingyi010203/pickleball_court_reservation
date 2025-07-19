package com.pickleball_backend.pickleball.controller;

import com.pickleball_backend.pickleball.dto.AdminBookingDto;
import com.pickleball_backend.pickleball.dto.AdminUserDto;
import com.pickleball_backend.pickleball.service.AdminDashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.security.core.context.SecurityContextHolder;
import com.pickleball_backend.pickleball.dto.DashboardSummaryDto;
import com.pickleball_backend.pickleball.dto.RecentActivityDto;
import org.springframework.core.io.InputStreamResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import com.pickleball_backend.pickleball.dto.ReportRequestDto;
import com.pickleball_backend.pickleball.entity.Booking;
import com.pickleball_backend.pickleball.repository.BookingRepository;
import org.springframework.http.HttpStatus;
import java.util.Map;
import java.util.HashMap;

@RestController
@RequestMapping("/api/admin/dashboard")
@RequiredArgsConstructor
public class AdminDashboardController {

    private final AdminDashboardService adminDashboardService;
    private final BookingRepository bookingRepository;

    // Get all users
    @GetMapping("/users")
    public ResponseEntity<List<AdminUserDto>> getAllUsers() {
        return ResponseEntity.ok(adminDashboardService.getAllUsers());
    }

    // Get total user count
    @GetMapping("/users/count")
    public ResponseEntity<Long> getTotalUsers() {
        return ResponseEntity.ok(adminDashboardService.getTotalUserCount());
    }

    // Get all bookings
    @GetMapping("/bookings")
    public ResponseEntity<Page<AdminBookingDto>> getAllBookings(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "bookingDate") String sort,
            @RequestParam(defaultValue = "desc") String direction,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate
    ) {
        Sort.Direction sortDirection = "desc".equalsIgnoreCase(direction)
                ? Sort.Direction.DESC : Sort.Direction.ASC;
        
        // Handle slot-related sorting by mapping to bookingDate for now
        // In a more complex implementation, you might want to create a custom query
        String sortField = sort;
        if ("slotDate".equals(sort)) {
            sortField = "bookingDate"; // Fallback to bookingDate for slot sorting
        }
        
        Pageable pageable = PageRequest.of(page, size, Sort.by(sortDirection, sortField));
        return ResponseEntity.ok(adminDashboardService.getAllBookings(pageable, search, status, startDate, endDate));
    }

    // 测试端点：获取所有预订（不分页）
    @GetMapping("/bookings/all")
    public ResponseEntity<List<AdminBookingDto>> getAllBookingsSimple() {
        try {
            // 获取所有预订
            List<Booking> allBookings = bookingRepository.findAll();
            System.out.println("AdminDashboardController: Found " + allBookings.size() + " bookings in database");
            
            List<AdminBookingDto> dtos = allBookings.stream()
                .map(booking -> {
                    try {
                        return adminDashboardService.convertToAdminBookingDto(booking);
                    } catch (Exception e) {
                        System.err.println("Error converting booking " + booking.getId() + ": " + e.getMessage());
                        AdminBookingDto basicDto = new AdminBookingDto();
                        basicDto.setId(booking.getId());
                        basicDto.setStatus(booking.getStatus());
                        basicDto.setTotalAmount(booking.getTotalAmount());
                        basicDto.setBookingDate(booking.getBookingDate());
                        return basicDto;
                    }
                })
                .collect(java.util.stream.Collectors.toList());
            
            return ResponseEntity.ok(dtos);
        } catch (Exception e) {
            System.err.println("Error in getAllBookingsSimple: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(List.of());
        }
    }

    // 简单的测试端点：只返回预订数量
    @GetMapping("/bookings/count")
    public ResponseEntity<Map<String, Object>> getBookingCount() {
        try {
            long totalCount = bookingRepository.count();
            List<Booking> allBookings = bookingRepository.findAll();
            
            Map<String, Object> result = new HashMap<>();
            result.put("totalCount", totalCount);
            result.put("actualCount", allBookings.size());
            
            if (!allBookings.isEmpty()) {
                Booking firstBooking = allBookings.get(0);
                result.put("firstBookingId", firstBooking.getId());
                result.put("firstBookingStatus", firstBooking.getStatus());
                result.put("firstBookingDate", firstBooking.getBookingDate());
            }
            
            System.out.println("AdminDashboardController: Booking count - " + result);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            System.err.println("Error in getBookingCount: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/bookings/{id}/cancel")
    public ResponseEntity<?> cancelBookingByAdmin(@PathVariable Integer id, @RequestBody(required = false) java.util.Map<String, Object> body) {
        String adminRemark = body != null && body.get("adminRemark") != null ? body.get("adminRemark").toString() : null;
        String adminUsername = SecurityContextHolder.getContext().getAuthentication().getName();
        return ResponseEntity.ok(adminDashboardService.cancelBookingForAdmin(id, adminUsername, adminRemark));
    }

    @GetMapping("/summary")
    public ResponseEntity<DashboardSummaryDto> getDashboardSummary() {
        return ResponseEntity.ok(adminDashboardService.getDashboardSummary());
    }

    @GetMapping("/booking-trends")
    public ResponseEntity<?> getBookingTrends(@RequestParam(defaultValue = "month") String range) {
        return ResponseEntity.ok(adminDashboardService.getBookingTrends(range));
    }

    @GetMapping("/revenue-trends")
    public ResponseEntity<?> getRevenueTrends(@RequestParam(defaultValue = "month") String range) {
        return ResponseEntity.ok(adminDashboardService.getRevenueTrends(range));
    }

    @GetMapping("/recent-activity")
    public List<RecentActivityDto> getRecentActivity() {
        return adminDashboardService.getRecentActivity();
    }

    @PostMapping("/generate-report")
    public ResponseEntity<InputStreamResource> generateReport(@RequestBody ReportRequestDto request) throws Exception {
        return adminDashboardService.generateReport(request);
    }

    // Get global average feedback rating
    @GetMapping("/average-rating")
    public ResponseEntity<Double> getGlobalAverageRating() {
        return ResponseEntity.ok(adminDashboardService.getGlobalAverageRating());
    }
}