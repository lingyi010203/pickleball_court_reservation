package com.pickleball_backend.pickleball.service;

import com.pickleball_backend.pickleball.dto.AdminBookingDto;
import com.pickleball_backend.pickleball.dto.AdminUserDto;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import java.util.List;

public interface AdminDashboardService {
    List<AdminUserDto> getAllUsers();
    long getTotalUserCount();
    Page<AdminBookingDto> getAllBookings(Pageable pageable, String search, String status, String startDate, String endDate);
    Object cancelBookingForAdmin(Integer bookingId, String adminUsername);
}