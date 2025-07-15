package com.pickleball_backend.pickleball.controller;

import com.pickleball_backend.pickleball.dto.AdminBookingDto;
import com.pickleball_backend.pickleball.dto.AdminUserDto;
import com.pickleball_backend.pickleball.service.AdminDashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.RequestBody;

@RestController
@RequestMapping("/api/admin/dashboard")
@RequiredArgsConstructor
public class AdminDashboardController {

    private final AdminDashboardService adminDashboardService;

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
        Pageable pageable = PageRequest.of(page, size, Sort.by(sortDirection, sort));
        return ResponseEntity.ok(adminDashboardService.getAllBookings(pageable, search, status, startDate, endDate));
    }

    @PutMapping("/bookings/{id}/cancel")
    public ResponseEntity<?> cancelBookingByAdmin(@PathVariable Integer id, @RequestBody(required = false) java.util.Map<String, Object> body) {
        String adminRemark = body != null && body.get("adminRemark") != null ? body.get("adminRemark").toString() : null;
        return ResponseEntity.ok(adminDashboardService.cancelBookingForAdmin(id, adminRemark));
    }

    // Get global average feedback rating
    @GetMapping("/average-rating")
    public ResponseEntity<Double> getGlobalAverageRating() {
        return ResponseEntity.ok(adminDashboardService.getGlobalAverageRating());
    }
}