package com.pickleball_backend.pickleball.service;

import com.pickleball_backend.pickleball.dto.AdminBookingDto;
import com.pickleball_backend.pickleball.dto.AdminUserDto;
import com.pickleball_backend.pickleball.dto.DashboardSummaryDto;
import com.pickleball_backend.pickleball.dto.RecentActivityDto;
import com.pickleball_backend.pickleball.dto.CourtUtilizationDto;
import com.pickleball_backend.pickleball.entity.Booking;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import java.util.List;
import org.springframework.core.io.InputStreamResource;
import org.springframework.http.ResponseEntity;
import com.pickleball_backend.pickleball.dto.ReportRequestDto;

public interface AdminDashboardService {
    List<AdminUserDto> getAllUsers();
    long getTotalUserCount();
    Page<AdminBookingDto> getAllBookings(Pageable pageable, String search, String status, String startDate, String endDate);
    Object cancelBookingForAdmin(Integer bookingId, String adminUsername, String adminRemark);
    double getGlobalAverageRating();
    DashboardSummaryDto getDashboardSummary();
    Object getBookingTrends(String range);
    Object getRevenueTrends(String range);
    List<RecentActivityDto> getRecentActivity(String period);
    CourtUtilizationDto getCourtUtilization(String period);
    ResponseEntity<InputStreamResource> generateReport(ReportRequestDto request) throws Exception;
    AdminBookingDto convertToAdminBookingDto(Booking booking);
}