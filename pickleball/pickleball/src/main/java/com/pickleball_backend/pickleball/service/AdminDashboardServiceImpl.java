package com.pickleball_backend.pickleball.service;

import com.pickleball_backend.pickleball.dto.AdminBookingDto;
import com.pickleball_backend.pickleball.dto.AdminUserDto;
import com.pickleball_backend.pickleball.dto.CancellationRequestDto;
import com.pickleball_backend.pickleball.entity.*;
import com.pickleball_backend.pickleball.repository.BookingRepository;
import com.pickleball_backend.pickleball.repository.CourtRepository;
import com.pickleball_backend.pickleball.repository.UserRepository;
import com.pickleball_backend.pickleball.repository.BookingSlotRepository;
import com.pickleball_backend.pickleball.repository.SlotRepository;
import com.pickleball_backend.pickleball.repository.PaymentRepository;
import com.pickleball_backend.pickleball.repository.MemberRepository;
import com.pickleball_backend.pickleball.repository.WalletRepository;
import com.pickleball_backend.pickleball.repository.WalletTransactionRepository;
import com.pickleball_backend.pickleball.repository.UserAccountRepository;
import com.pickleball_backend.pickleball.repository.CancellationRequestRepository;
import com.pickleball_backend.pickleball.repository.AdminRepository;
import com.pickleball_backend.pickleball.service.EmailService;
import com.pickleball_backend.pickleball.repository.FeedbackRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.ss.usermodel.Row;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.ArrayList;
import java.util.stream.Collectors;
import org.springframework.util.StringUtils;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import com.pickleball_backend.pickleball.dto.DashboardSummaryDto;
import com.pickleball_backend.pickleball.repository.FeedbackRepository;
import com.pickleball_backend.pickleball.dto.RecentActivityDto;
import com.pickleball_backend.pickleball.dto.CourtUtilizationDto;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.InputStreamResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import com.pickleball_backend.pickleball.dto.ReportRequestDto;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import com.lowagie.text.*;
import com.lowagie.text.pdf.*;
import java.nio.charset.StandardCharsets;
import java.io.ByteArrayOutputStream;
import java.util.Map;
import com.pickleball_backend.pickleball.service.ChartService;
import java.awt.image.BufferedImage;
import java.util.HashMap;
import java.awt.Color;
import java.util.Arrays;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Service
@RequiredArgsConstructor
@Slf4j
public class AdminDashboardServiceImpl implements AdminDashboardService {

    private final BookingSlotRepository bookingSlotRepository;
    private final SlotRepository slotRepository;
    private final PaymentRepository paymentRepository;
    private final EmailService emailService;
    private final MemberRepository memberRepository;
    private final UserRepository userRepository;
    private final WalletRepository walletRepository;
    private final WalletTransactionRepository walletTransactionRepository;
    private final UserAccountRepository userAccountRepository;
    private final CancellationRequestRepository cancellationRequestRepository;
    private final BookingRepository bookingRepository;
    private final CourtRepository courtRepository;
    private final FeedbackRepository feedbackRepository;
    private final AdminRepository adminRepository;
    private final ChartService chartService;
    private final MemberService memberService;

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
        try {
            System.out.println("AdminDashboardService: getAllBookings called with filters - search: '" + search + "', status: '" + status + "', startDate: '" + startDate + "', endDate: '" + endDate + "'");
            
            // 转换日期字符串为 LocalDate
            java.time.LocalDate startDateLocal = null;
            java.time.LocalDate endDateLocal = null;
            
            if (startDate != null && !startDate.trim().isEmpty()) {
                try {
                    startDateLocal = java.time.LocalDate.parse(startDate);
                } catch (Exception e) {
                    System.err.println("Error parsing startDate: " + startDate + " - " + e.getMessage());
                }
            }
            
            if (endDate != null && !endDate.trim().isEmpty()) {
                try {
                    endDateLocal = java.time.LocalDate.parse(endDate);
                } catch (Exception e) {
                    System.err.println("Error parsing endDate: " + endDate + " - " + e.getMessage());
            }
            }
            
            // 使用带筛选条件的查询
            Page<Booking> bookings = bookingRepository.findByAdminFilters(
                search != null && !search.trim().isEmpty() ? search.trim() : null,
                status != null && !status.trim().isEmpty() ? status.trim() : null,
                startDateLocal,
                endDateLocal,
                pageable
            );
            
            System.out.println("AdminDashboardService: Found " + bookings.getTotalElements() + " total bookings, " + bookings.getContent().size() + " on current page");
            System.out.println("AdminDashboardService: Page info - page: " + pageable.getPageNumber() + ", size: " + pageable.getPageSize());
            
            // 转换为 DTO
            List<AdminBookingDto> dtos = bookings.getContent().stream()
                .map(b -> {
                    try {
                        return convertToAdminBookingDto(b);
                    } catch (Exception e) {
                        System.err.println("Error converting booking " + b.getId() + ": " + e.getMessage());
                        e.printStackTrace();
                        // 返回一个基本的 DTO 避免整个请求失败
                        AdminBookingDto basicDto = new AdminBookingDto();
                        basicDto.setId(b.getId());
                        basicDto.setStatus(b.getStatus());
                        basicDto.setTotalAmount(b.getTotalAmount());
                        basicDto.setBookingDate(b.getBookingDate());
                        return basicDto;
                    }
                })
                .collect(java.util.stream.Collectors.toList());
            
            System.out.println("AdminDashboardService: Converted " + dtos.size() + " DTOs");
            return new org.springframework.data.domain.PageImpl<>(dtos, pageable, bookings.getTotalElements());
        } catch (Exception e) {
            System.err.println("Error in getAllBookings: " + e.getMessage());
            e.printStackTrace();
            throw e;
        }
    }

    @Override
    @Transactional
    public Object cancelBookingForAdmin(Integer bookingId, String adminUsername, String adminRemark) {
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
        // 4. 退款50%到钱包
        double refund = booking.getTotalAmount() * 0.5;
        Wallet wallet = walletRepository.findByMemberId(booking.getMember().getId())
            .orElseThrow(() -> new RuntimeException("Wallet not found"));
        
        double balanceBefore = wallet.getBalance();
        wallet.setBalance(wallet.getBalance() + refund);
        wallet.setTotalSpent(wallet.getTotalSpent() - refund); // 退款時減少總支出
        walletRepository.save(wallet);
        
        // 创建退款交易记录
        createWalletTransaction(wallet, "REFUND", refund, balanceBefore, wallet.getBalance(), 
                              "BOOKING", booking.getId(), "Booking cancellation refund (50%) - Admin cancelled");

        // 5. 扣除積分（扣除50%的積分，與退款比例一致）
        Member member = booking.getMember();
        MemberService.PointDeductionResult deductionResult = memberService.deductPointsForRefund(member, booking.getTotalAmount(), 0.5);
        
        log.info("Deducted {} tier points and {} reward points from member {} for admin cancellation {}",
                deductionResult.getTierPointsDeducted(), deductionResult.getRewardPointsDeducted(), member.getId(), booking.getId());

        // 6. 更新用户统计数据（减少预订小时数）
        User user = booking.getMember().getUser();
        double cancelledHours = booking.getBookingSlots().stream()
                .mapToDouble(bs -> bs.getSlot().getDurationHours())
                .sum();
        user.setBookingHours(Math.max(0, user.getBookingHours() - cancelledHours));
        user.setAmountSpent(Math.max(0, user.getAmountSpent() - booking.getTotalAmount()));
        userRepository.save(user);

        // 6. 更新支付状态
        Payment payment = booking.getPayment();
        if (payment != null) {
            payment.setStatus("REFUNDED");
            paymentRepository.save(payment);
        }
        // 7. 保存管理员备注和操作人到取消请求（如有）
        CancellationRequest cancellationRequest = booking.getCancellationRequest();
        if (cancellationRequest != null) {
            if (org.springframework.util.StringUtils.hasText(adminRemark)) {
                cancellationRequest.setAdminRemark(adminRemark);
            }
            if (org.springframework.util.StringUtils.hasText(adminUsername)) {
                // 查找管理员 user id
                User adminUser = userRepository.findByUserAccount_Username(adminUsername)
                        .orElseThrow(() -> new RuntimeException("Admin user not found"));
                cancellationRequest.setApprovedBy(adminUser.getId()); // 假设实体字段为 approvedBy
            }
            cancellationRequestRepository.save(cancellationRequest);
        }
        // 6. Send admin cancellation notification
        emailService.sendAdminCancellationNotification(
                booking.getMember().getUser().getEmail(),
                booking,
                slot,
                court != null ? court.getName() : "Court not found",
                adminRemark
        );
        return java.util.Map.of(
                "success", true,
                "message", "Booking cancelled successfully by admin."
        );
    }

    @Override
    public double getGlobalAverageRating() {
        Double avg = feedbackRepository.findAll().stream()
            .mapToInt(f -> f.getRating() != null ? f.getRating() : 0)
            .average()
            .orElse(0.0);
        return avg;
    }

    @Override
    public DashboardSummaryDto getDashboardSummary() {
        DashboardSummaryDto dto = new DashboardSummaryDto();
        // 当前统计周期：本月
        java.time.LocalDate now = java.time.LocalDate.now();
        java.time.YearMonth thisMonth = java.time.YearMonth.from(now);
        java.time.LocalDate startOfThisMonthDate = thisMonth.atDay(1);
        java.time.LocalDateTime startOfThisMonth = startOfThisMonthDate.atStartOfDay();
        java.time.LocalDateTime endOfThisMonth = now.atTime(23, 59, 59);

        // 1. 总用户数
        long totalUsers = userRepository.count();
        dto.setTotalUsers(totalUsers);
        // 2. 总预订数
        long totalBookings = bookingRepository.count();
        dto.setTotalBookings(totalBookings);
        // 3. 总收入
        Double totalRevenue = paymentRepository.sumTotalRevenue();
        dto.setTotalRevenue(totalRevenue != null ? totalRevenue : 0.0);
        // 4. 平均评分
        Double averageRating = feedbackRepository.findAverageRating();
        dto.setAverageRating(averageRating != null ? averageRating : 0.0);

        // 5. 本月新增数据
        // 5.1 本月新增用户数（注册时间在本月）
        Long newUsersThisMonth = userRepository.countByCreatedAtBetween(startOfThisMonth, endOfThisMonth);
        dto.setNewUsersThisMonth(newUsersThisMonth != null ? newUsersThisMonth : 0L);
        // 5.2 本月新增预订数（预订时间在本月）
        Long newBookingsThisMonth = bookingRepository.countByBookingDateBetween(startOfThisMonth, endOfThisMonth);
        dto.setNewBookingsThisMonth(newBookingsThisMonth != null ? newBookingsThisMonth : 0L);
        // 5.3 本月新增收入（支付时间在本月）
        Double newRevenueThisMonth = paymentRepository.sumTotalRevenueByDate(startOfThisMonth, endOfThisMonth);
        dto.setNewRevenueThisMonth(newRevenueThisMonth != null ? newRevenueThisMonth : 0.0);
        // 5.4 本月新增评价数（评价时间在本月）
        Long newRatingsThisMonth = feedbackRepository.countByCreatedAtBetween(startOfThisMonth, endOfThisMonth);
        dto.setNewRatingsThisMonth(newRatingsThisMonth != null ? newRatingsThisMonth : 0L);
        
        return dto;
    }

    @Override
    public Object getBookingTrends(String range) {
        java.util.List<String> labels = new java.util.ArrayList<>();
        java.util.List<Long> data = new java.util.ArrayList<>();
        if ("7d".equalsIgnoreCase(range)) {
            java.time.LocalDate today = java.time.LocalDate.now();
            for (int i = 6; i >= 0; i--) {
                java.time.LocalDate day = today.minusDays(i);
                java.time.LocalDateTime start = day.atStartOfDay();
                java.time.LocalDateTime end = day.atTime(23, 59, 59);
                long count = bookingRepository.countByBookingDateBetween(start, end);
                labels.add(day.toString()); // yyyy-MM-dd
                data.add(count);
            }
            return java.util.Map.of("labels", labels, "data", data);
        } else if ("30d".equalsIgnoreCase(range)) {
            java.time.LocalDate today = java.time.LocalDate.now();
            for (int i = 29; i >= 0; i--) {
                java.time.LocalDate day = today.minusDays(i);
                java.time.LocalDateTime start = day.atStartOfDay();
                java.time.LocalDateTime end = day.atTime(23, 59, 59);
                long count = bookingRepository.countByBookingDateBetween(start, end);
                labels.add(day.toString());
                data.add(count);
            }
            return java.util.Map.of("labels", labels, "data", data);
        } else if ("12m".equalsIgnoreCase(range)) {
            java.time.YearMonth thisMonth = java.time.YearMonth.now();
            for (int i = 11; i >= 0; i--) {
                java.time.YearMonth ym = thisMonth.minusMonths(i);
                java.time.LocalDateTime start = ym.atDay(1).atStartOfDay();
                java.time.LocalDateTime end = ym.atEndOfMonth().atTime(23, 59, 59);
                long count = bookingRepository.countByBookingDateBetween(start, end);
                labels.add(ym.toString()); // yyyy-MM
                data.add(count);
            }
            return java.util.Map.of("labels", labels, "data", data);
        } else {
            // 默认返回最近7天
            java.time.LocalDate today = java.time.LocalDate.now();
            for (int i = 6; i >= 0; i--) {
                java.time.LocalDate day = today.minusDays(i);
                java.time.LocalDateTime start = day.atStartOfDay();
                java.time.LocalDateTime end = day.atTime(23, 59, 59);
                long count = bookingRepository.countByBookingDateBetween(start, end);
                labels.add(day.toString());
                data.add(count);
            }
            return java.util.Map.of("labels", labels, "data", data);
        }
    }

    @Override
    public Object getRevenueTrends(String range) {
        java.util.List<String> labels = new java.util.ArrayList<>();
        java.util.List<Double> data = new java.util.ArrayList<>();
        if ("7d".equalsIgnoreCase(range)) {
            java.time.LocalDate today = java.time.LocalDate.now();
            for (int i = 6; i >= 0; i--) {
                java.time.LocalDate day = today.minusDays(i);
                java.time.LocalDateTime start = day.atStartOfDay();
                java.time.LocalDateTime end = day.atTime(23, 59, 59);
                Double revenue = paymentRepository.sumRevenueByDateAndType(start, end, "BOOKING");
                data.add(revenue != null ? revenue : 0.0);
                labels.add(day.toString());
            }
            return java.util.Map.of("labels", labels, "data", data);
        } else if ("30d".equalsIgnoreCase(range)) {
            java.time.LocalDate today = java.time.LocalDate.now();
            for (int i = 29; i >= 0; i--) {
                java.time.LocalDate day = today.minusDays(i);
                java.time.LocalDateTime start = day.atStartOfDay();
                java.time.LocalDateTime end = day.atTime(23, 59, 59);
                Double revenue = paymentRepository.sumRevenueByDateAndType(start, end, "BOOKING");
                data.add(revenue != null ? revenue : 0.0);
                labels.add(day.toString());
            }
            return java.util.Map.of("labels", labels, "data", data);
        } else if ("12m".equalsIgnoreCase(range)) {
            java.time.YearMonth thisMonth = java.time.YearMonth.now();
            for (int i = 11; i >= 0; i--) {
                java.time.YearMonth ym = thisMonth.minusMonths(i);
                java.time.LocalDateTime start = ym.atDay(1).atStartOfDay();
                java.time.LocalDateTime end = ym.atEndOfMonth().atTime(23, 59, 59);
                Double revenue = paymentRepository.sumRevenueByDateAndType(start, end, "BOOKING");
                data.add(revenue != null ? revenue : 0.0);
                labels.add(ym.toString());
            }
            return java.util.Map.of("labels", labels, "data", data);
        } else {
            // 默认返回最近7天
            java.time.LocalDate today = java.time.LocalDate.now();
            for (int i = 6; i >= 0; i--) {
                java.time.LocalDate day = today.minusDays(i);
                java.time.LocalDateTime start = day.atStartOfDay();
                java.time.LocalDateTime end = day.atTime(23, 59, 59);
                Double revenue = paymentRepository.sumRevenueByDateAndType(start, end, "BOOKING");
                data.add(revenue != null ? revenue : 0.0);
                labels.add(day.toString());
            }
            return java.util.Map.of("labels", labels, "data", data);
        }
    }

    @Override
    public List<RecentActivityDto> getRecentActivity(String period) {
        List<RecentActivityDto> activities = new ArrayList<>();
        
        // 计算时间范围
        LocalDateTime startTime = null;
        if ("week".equals(period)) {
            startTime = LocalDateTime.now().minusWeeks(1);
        } else {
            // 默认返回最近的活动（保持原有逻辑）
            startTime = LocalDateTime.now().minusDays(7);
        }
        
        // 最近预订
        if ("week".equals(period)) {
            // 获取近一星期的所有预订
            bookingRepository.findByBookingDateBetween(startTime, LocalDateTime.now()).forEach(b -> {
            try {
                RecentActivityDto dto = new RecentActivityDto();
                dto.setType("booking");
                String userName = "Unknown User";
                if (b.getMember() != null && b.getMember().getUser() != null && b.getMember().getUser().getName() != null && !b.getMember().getUser().getName().trim().isEmpty()) {
                    userName = b.getMember().getUser().getName();
                }
                dto.setUser(userName);
                // 获取场地名
                String courtName = "court";
                if (b.getBookingSlots() != null && !b.getBookingSlots().isEmpty()) {
                    Integer courtId = null;
                    if (b.getBookingSlots().get(0) != null && b.getBookingSlots().get(0).getSlot() != null) {
                        courtId = b.getBookingSlots().get(0).getSlot().getCourtId();
                    }
                    if (courtId != null) {
                        try {
                            courtName = courtRepository.findById(courtId).map(c -> c.getName()).orElse("court");
                        } catch (Exception ignore) {}
                    }
                }
                dto.setDetail("booked " + courtName);
                dto.setTimestamp(b.getBookingDate());
                dto.setIcon("\uD83D\uDCC5"); // 📅
                activities.add(dto);
            } catch (Exception ignore) {}
        });
        } else {
            // 默认逻辑：获取最近5条预订
            bookingRepository.findTop5ByOrderByBookingDateDesc().forEach(b -> {
                try {
                    RecentActivityDto dto = new RecentActivityDto();
                    dto.setType("booking");
                    String userName = "Unknown User";
                    if (b.getMember() != null && b.getMember().getUser() != null && b.getMember().getUser().getName() != null && !b.getMember().getUser().getName().trim().isEmpty()) {
                        userName = b.getMember().getUser().getName();
                    }
                    dto.setUser(userName);
                    // 获取场地名
                    String courtName = "court";
                    if (b.getBookingSlots() != null && !b.getBookingSlots().isEmpty()) {
                        Integer courtId = null;
                        if (b.getBookingSlots().get(0) != null && b.getBookingSlots().get(0).getSlot() != null) {
                            courtId = b.getBookingSlots().get(0).getSlot().getCourtId();
                        }
                        if (courtId != null) {
                            try {
                                courtName = courtRepository.findById(courtId).map(c -> c.getName()).orElse("court");
                            } catch (Exception ignore) {}
                        }
                    }
                    dto.setDetail("booked " + courtName);
                    dto.setTimestamp(b.getBookingDate());
                    dto.setIcon("\uD83D\uDCC5"); // 📅
                    activities.add(dto);
                } catch (Exception ignore) {}
            });
        }
        
        // 最近取消预订
        if ("week".equals(period)) {
            // 获取近一星期的所有取消请求
            cancellationRequestRepository.findByRequestDateBetween(startTime, LocalDateTime.now()).forEach(cr -> {
            try {
                RecentActivityDto dto = new RecentActivityDto();
                dto.setType("cancellation");
                String userName = "Unknown User";
                if (cr.getBooking() != null && cr.getBooking().getMember() != null &&
                    cr.getBooking().getMember().getUser() != null &&
                    cr.getBooking().getMember().getUser().getName() != null && 
                    !cr.getBooking().getMember().getUser().getName().trim().isEmpty()) {
                    userName = cr.getBooking().getMember().getUser().getName();
                }
                dto.setUser(userName);
                // 获取场地名
                String courtName = "court";
                if (cr.getBooking() != null && cr.getBooking().getBookingSlots() != null && !cr.getBooking().getBookingSlots().isEmpty()) {
                    Integer courtId = null;
                    if (cr.getBooking().getBookingSlots().get(0) != null && cr.getBooking().getBookingSlots().get(0).getSlot() != null) {
                        courtId = cr.getBooking().getBookingSlots().get(0).getSlot().getCourtId();
                    }
                    if (courtId != null) {
                        try {
                            courtName = courtRepository.findById(courtId).map(c -> c.getName()).orElse("court");
                        } catch (Exception ignore) {}
                    }
                }
                dto.setDetail("cancelled " + courtName + " booking");
                dto.setTimestamp(cr.getRequestDate());
                dto.setIcon("\u274C"); // ❌
                activities.add(dto);
            } catch (Exception ignore) {}
        });
        } else {
            // 默认逻辑：获取最近3条取消请求
            cancellationRequestRepository.findTop3ByOrderByRequestDateDesc().forEach(cr -> {
                try {
                    RecentActivityDto dto = new RecentActivityDto();
                    dto.setType("cancellation");
                    String userName = "Unknown User";
                    if (cr.getBooking() != null && cr.getBooking().getMember() != null &&
                        cr.getBooking().getMember().getUser() != null &&
                        cr.getBooking().getMember().getUser().getName() != null && 
                        !cr.getBooking().getMember().getUser().getName().trim().isEmpty()) {
                        userName = cr.getBooking().getMember().getUser().getName();
                    }
                    dto.setUser(userName);
                    // 获取场地名
                    String courtName = "court";
                    if (cr.getBooking() != null && cr.getBooking().getBookingSlots() != null && !cr.getBooking().getBookingSlots().isEmpty()) {
                        Integer courtId = null;
                        if (cr.getBooking().getBookingSlots().get(0) != null && cr.getBooking().getBookingSlots().get(0).getSlot() != null) {
                            courtId = cr.getBooking().getBookingSlots().get(0).getSlot().getCourtId();
                        }
                        if (courtId != null) {
                            try {
                                courtName = courtRepository.findById(courtId).map(c -> c.getName()).orElse("court");
                            } catch (Exception ignore) {}
                        }
                    }
                    dto.setDetail("cancelled " + courtName + " booking");
                    dto.setTimestamp(cr.getRequestDate());
                    dto.setIcon("\u274C"); // ❌
                    activities.add(dto);
                } catch (Exception ignore) {}
            });
        }
        
        // 最近注册
        if ("week".equals(period)) {
            // 获取近一星期的所有用户注册
            userRepository.findByCreatedAtBetween(startTime, LocalDateTime.now()).forEach(u -> {
            try {
                RecentActivityDto dto = new RecentActivityDto();
                dto.setType("user");
                dto.setUser(u.getName() != null && !u.getName().trim().isEmpty() ? u.getName() : "Unknown User");
                dto.setDetail("created an account");
                dto.setTimestamp(u.getCreatedAt());
                dto.setIcon("\uD83D\uDC64"); // 👤
                activities.add(dto);
            } catch (Exception ignore) {}
        });
        } else {
            // 默认逻辑：获取最近3条用户注册
            userRepository.findTop3ByOrderByCreatedAtDesc().forEach(u -> {
                try {
                    RecentActivityDto dto = new RecentActivityDto();
                    dto.setType("user");
                    dto.setUser(u.getName() != null && !u.getName().trim().isEmpty() ? u.getName() : "Unknown User");
                    dto.setDetail("created an account");
                    dto.setTimestamp(u.getCreatedAt());
                    dto.setIcon("\uD83D\uDC64"); // 👤
                    activities.add(dto);
                } catch (Exception ignore) {}
            });
        }
        
        // 最近评价
        if ("week".equals(period)) {
            // 获取近一星期的所有评价
            feedbackRepository.findByCreatedAtBetween(startTime, LocalDateTime.now()).forEach(f -> {
            try {
                RecentActivityDto dto = new RecentActivityDto();
                dto.setType("review");
                String reviewer = "Unknown User";
                if (f.getUser() != null && f.getUser().getName() != null && !f.getUser().getName().trim().isEmpty()) {
                    reviewer = f.getUser().getName();
                }
                dto.setUser(reviewer);
                dto.setDetail("rated a venue " + (f.getRating() != null ? f.getRating() : "") + " stars");
                dto.setTimestamp(f.getCreatedAt());
                dto.setIcon("\u2B50"); // ⭐
                activities.add(dto);
            } catch (Exception ignore) {}
        });
        } else {
            // 默认逻辑：获取最近2条评价
            feedbackRepository.findTop2ByOrderByCreatedAtDesc().forEach(f -> {
                try {
                    RecentActivityDto dto = new RecentActivityDto();
                    dto.setType("review");
                    String reviewer = "Unknown User";
                    if (f.getUser() != null && f.getUser().getName() != null && !f.getUser().getName().trim().isEmpty()) {
                        reviewer = f.getUser().getName();
                    }
                    dto.setUser(reviewer);
                    dto.setDetail("rated a venue " + (f.getRating() != null ? f.getRating() : "") + " stars");
                    dto.setTimestamp(f.getCreatedAt());
                    dto.setIcon("\u2B50"); // ⭐
                    activities.add(dto);
                } catch (Exception ignore) {}
            });
        }
        
        // 按时间倒序排序
        List<RecentActivityDto> sortedActivities = activities.stream()
                .filter(a -> a.getTimestamp() != null)
                .sorted((a, b) -> b.getTimestamp().compareTo(a.getTimestamp()))
                .collect(Collectors.toList());
        
        // 如果是获取一周数据，返回所有；否则限制为10条
        if ("week".equals(period)) {
            return sortedActivities;
        } else {
            return sortedActivities.stream().limit(10).collect(Collectors.toList());
        }
    }

    @Override
    public CourtUtilizationDto getCourtUtilization(String period) {
        CourtUtilizationDto dto = new CourtUtilizationDto();
        dto.setPeriod(period);
        
        // 计算时间范围
        LocalDateTime startTime;
        LocalDateTime endTime = LocalDateTime.now();
        
        if ("30d".equals(period)) {
            startTime = LocalDateTime.now().minusDays(30);
        } else {
            // 默认7天
            startTime = LocalDateTime.now().minusDays(7);
        }
        
        List<CourtUtilizationDto.CourtUtilizationData> courtUtilizations = new ArrayList<>();
        Map<String, Double> timeSlotUtilizations = new HashMap<>();
        
        // 获取所有活跃场地（排除 DELETED, MAINTENANCE, INACTIVE 状态的场地）
        List<Court> courts = courtRepository.findActiveCourts();
        
        for (Court court : courts) {
            CourtUtilizationDto.CourtUtilizationData courtData = new CourtUtilizationDto.CourtUtilizationData();
            courtData.setCourtId(court.getId());
            courtData.setCourtName(court.getName());
            courtData.setCourtType(court.getCourtType() != null ? court.getCourtType().name() : "STANDARD");
            
            // 计算该场地的总时段数
            long totalSlots = slotRepository.countByCourtIdAndDateBetween(
                court.getId(), 
                startTime.toLocalDate(), 
                endTime.toLocalDate()
            );
            
            // 计算已预订的时段数
            long bookedSlots = bookingSlotRepository.countBySlotCourtIdAndSlotDateBetween(
                court.getId(),
                startTime.toLocalDate(),
                endTime.toLocalDate()
            );
            
            courtData.setTotalSlots(totalSlots);
            courtData.setBookedSlots(bookedSlots);
            courtData.setAvailableSlots(totalSlots - bookedSlots);
            
            // 计算利用率
            double utilizationRate = totalSlots > 0 ? (double) bookedSlots / totalSlots * 100 : 0.0;
            courtData.setUtilizationRate(Math.round(utilizationRate * 100.0) / 100.0); // 保留两位小数
            
            courtUtilizations.add(courtData);
        }
        
        // 计算时段利用率（用于促销分析）
        // 分析不同时段的利用率，找出最空闲的时段
        // 由于slot是每小时的，我们按小时段来分析
        List<String> timeSlots = Arrays.asList("09:00-10:00", "10:00-11:00", "11:00-12:00", "12:00-13:00", 
                                              "13:00-14:00", "14:00-15:00", "15:00-16:00", "16:00-17:00", 
                                              "17:00-18:00", "18:00-19:00", "19:00-20:00", "20:00-21:00");
        
        Map<String, CourtUtilizationDto.TimeSlotDetailData> timeSlotDetails = new HashMap<>();
        
        for (String timeSlot : timeSlots) {
            String[] times = timeSlot.split("-");
            LocalTime startTimeSlot = LocalTime.parse(times[0]);
            LocalTime endTimeSlot = LocalTime.parse(times[1]);
            
            // 计算该小时段的总时段数
            long totalSlotsInTimeSlot = slotRepository.countByDateBetweenAndStartTimeBetweenAndEndTimeBetween(
                startTime.toLocalDate(),
                endTime.toLocalDate(),
                startTimeSlot,
                endTimeSlot
            );
            
            // 计算该小时段已预订的时段数
            long bookedSlotsInTimeSlot = bookingSlotRepository.countBySlotDateBetweenAndSlotStartTimeBetweenAndSlotEndTimeBetween(
                startTime.toLocalDate(),
                endTime.toLocalDate(),
                startTimeSlot,
                endTimeSlot
            );
            
            // 计算该小时段的利用率
            double timeSlotUtilization = totalSlotsInTimeSlot > 0 ? 
                (double) bookedSlotsInTimeSlot / totalSlotsInTimeSlot * 100 : 0.0;
            timeSlotUtilizations.put(timeSlot, Math.round(timeSlotUtilization * 100.0) / 100.0);
            
            // 获取该时段的预订数据
            List<Booking> bookingsInTimeSlot = bookingRepository.findBookingsByDateRangeAndTimeSlot(
                startTime, endTime, startTimeSlot, endTimeSlot
            );
            
            // 计算总收入
            double totalRevenue = bookingsInTimeSlot.stream()
                .mapToDouble(Booking::getTotalAmount)
                .sum();
            
            // 确定促销潜力
            String promotionPotential;
            if (timeSlotUtilization < 30) {
                promotionPotential = "HIGH";
            } else if (timeSlotUtilization < 50) {
                promotionPotential = "MODERATE";
            } else {
                promotionPotential = "LOW";
            }
            
            // 创建详细数据
            CourtUtilizationDto.TimeSlotDetailData detailData = new CourtUtilizationDto.TimeSlotDetailData();
            detailData.setTimeSlot(timeSlot);
            detailData.setUtilizationRate(Math.round(timeSlotUtilization * 100.0) / 100.0);
            detailData.setTotalSlots(totalSlotsInTimeSlot);
            detailData.setBookedSlots(bookedSlotsInTimeSlot);
            detailData.setAvailableSlots(totalSlotsInTimeSlot - bookedSlotsInTimeSlot);
            detailData.setTotalBookings((long) bookingsInTimeSlot.size());
            detailData.setTotalRevenue(totalRevenue);
            detailData.setPromotionPotential(promotionPotential);
            
            timeSlotDetails.put(timeSlot, detailData);
        }
        
        dto.setCourtUtilizations(courtUtilizations);
        dto.setTimeSlotUtilizations(timeSlotUtilizations);
        dto.setTimeSlotDetails(timeSlotDetails);
        
        return dto;
    }

    @Override
    public ResponseEntity<InputStreamResource> generateReport(ReportRequestDto request) throws Exception {
        List<Booking> bookings = bookingRepository.findAll();
        Map<String, Boolean> filters = request.getFilters() != null ? request.getFilters() : new java.util.HashMap<>();
        byte[] bytes;
        String ext;
        String contentType;
        String format = request.getFormat();
        if (format == null) {
            format = "pdf";
        }
        switch (format.toLowerCase()) {
            case "excel":
                bytes = generateExcelReport(bookings, filters);
                ext = "xlsx";
                contentType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
                break;
            case "csv":
                bytes = generateCsvReport(bookings, filters);
                ext = "csv";
                contentType = "text/csv";
                break;
            case "pdf":
                bytes = generateComplexPdfReport(request);
                ext = "pdf";
                contentType = "application/pdf";
                break;
            default:
                throw new IllegalArgumentException("Unsupported format: " + format);
        }
        String filename = "report." + ext;
        InputStreamResource resource = new InputStreamResource(new java.io.ByteArrayInputStream(bytes));
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=" + filename)
                .contentType(MediaType.parseMediaType(contentType))
                .contentLength(bytes.length)
                .body(resource);
    }

    private byte[] generateExcelReport(List<Booking> bookings, Map<String, Boolean> filters) throws Exception {
        boolean includeUser = filters.getOrDefault("includeUsers", true);
        boolean includeBooking = filters.getOrDefault("includeBookings", true);
        boolean includeRevenue = filters.getOrDefault("includeRevenue", true);
        Workbook workbook = new XSSFWorkbook();
        Sheet sheet = workbook.createSheet("Bookings");
        Row header = sheet.createRow(0);
        int col = 0;
        header.createCell(col++).setCellValue("ID");
        if (includeUser) header.createCell(col++).setCellValue("User");
        if (includeBooking) {
            header.createCell(col++).setCellValue("Date");
            header.createCell(col++).setCellValue("Status");
        }
        if (includeRevenue) header.createCell(col++).setCellValue("Amount");
        int rowIdx = 1;
        for (Booking b : bookings) {
            Row row = sheet.createRow(rowIdx++);
            int c = 0;
            row.createCell(c++).setCellValue(b.getId());
            if (includeUser) {
                String user = (b.getMember() != null && b.getMember().getUser() != null) ? b.getMember().getUser().getName() : "";
                row.createCell(c++).setCellValue(user);
            }
            if (includeBooking) {
                row.createCell(c++).setCellValue(b.getBookingDate() != null ? b.getBookingDate().toString() : "");
                row.createCell(c++).setCellValue(b.getStatus());
            }
            if (includeRevenue) {
                row.createCell(c++).setCellValue(b.getTotalAmount());
            }
        }
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        workbook.write(out);
        workbook.close();
        return out.toByteArray();
    }

    private byte[] generateCsvReport(List<Booking> bookings, Map<String, Boolean> filters) {
        boolean includeUser = filters.getOrDefault("includeUsers", true);
        boolean includeBooking = filters.getOrDefault("includeBookings", true);
        boolean includeRevenue = filters.getOrDefault("includeRevenue", true);
        StringBuilder sb = new StringBuilder();
        sb.append("ID");
        if (includeUser) sb.append(",User");
        if (includeBooking) sb.append(",Date,Status");
        if (includeRevenue) sb.append(",Amount");
        sb.append("\n");
        for (Booking b : bookings) {
            sb.append(b.getId());
            if (includeUser) {
                String user = (b.getMember() != null && b.getMember().getUser() != null) ? b.getMember().getUser().getName() : "";
                sb.append(",").append('"').append(user.replace("\"", "\"\"")).append('"');
            }
            if (includeBooking) {
                sb.append(",").append(b.getBookingDate() != null ? b.getBookingDate().toString() : "");
                sb.append(",").append(b.getStatus());
            }
            if (includeRevenue) {
                sb.append(",").append(b.getTotalAmount());
            }
            sb.append("\n");
        }
        return sb.toString().getBytes(StandardCharsets.UTF_8);
    }

    private byte[] generatePdfReport(List<Booking> bookings, Map<String, Boolean> filters) throws Exception {
        boolean includeUser = filters.getOrDefault("includeUsers", true);
        boolean includeBooking = filters.getOrDefault("includeBookings", true);
        boolean includeRevenue = filters.getOrDefault("includeRevenue", true);
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        Document document = new Document();
        PdfWriter.getInstance(document, out);
        document.open();
        document.add(new Paragraph("Booking Report"));
        int colCount = 1 + (includeUser ? 1 : 0) + (includeBooking ? 2 : 0) + (includeRevenue ? 1 : 0);
        PdfPTable table = new PdfPTable(colCount);
        table.addCell("ID");
        if (includeUser) table.addCell("User");
        if (includeBooking) {
            table.addCell("Date");
            table.addCell("Status");
        }
        if (includeRevenue) table.addCell("Amount");
        for (Booking b : bookings) {
            table.addCell(String.valueOf(b.getId()));
            if (includeUser) {
                String user = (b.getMember() != null && b.getMember().getUser() != null) ? b.getMember().getUser().getName() : "";
                table.addCell(user);
            }
            if (includeBooking) {
                table.addCell(b.getBookingDate() != null ? b.getBookingDate().toString() : "");
                table.addCell(b.getStatus());
            }
            if (includeRevenue) {
                table.addCell(String.valueOf(b.getTotalAmount()));
            }
        }
        document.add(table);
        document.close();
        return out.toByteArray();
    }

    // 复杂PDF报表生成
    private byte[] generateComplexPdfReport(ReportRequestDto request) throws Exception {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        Document document = new Document();
        PdfWriter.getInstance(document, out);
        document.open();

        boolean hasContent = false;
        
        // 获取格式化选项
        Map<String, Object> formatting = new HashMap<>();
        if (request.getMetadata() != null && request.getMetadata().containsKey("formatting")) {
            formatting = (Map<String, Object>) request.getMetadata().get("formatting");
        }
        boolean includeHeaderFooter = (Boolean) formatting.getOrDefault("includeHeaderFooter", true);
        boolean useBrandColors = (Boolean) formatting.getOrDefault("useBrandColors", true);
        boolean includeAppendix = (Boolean) formatting.getOrDefault("includeAppendix", false);

        // 1. 标题、公司信息
        Map<String, Object> metadata = request.getMetadata();
        if (metadata != null) {
            // 页眉
            if (includeHeaderFooter) {
                document.add(new Paragraph("Picklefy Pickleball Club", FontFactory.getFont(FontFactory.HELVETICA_BOLD, 14)));
                document.add(new Paragraph("Professional Pickleball Court Management System", FontFactory.getFont(FontFactory.HELVETICA, 10)));
                document.add(new Paragraph(" "));
            }
            
            document.add(new Paragraph((String) metadata.getOrDefault("title", "Report"), FontFactory.getFont(FontFactory.HELVETICA_BOLD, 18)));
            hasContent = true;
            Map<String, Object> company = (Map<String, Object>) metadata.getOrDefault("company", java.util.Collections.emptyMap());
            document.add(new Paragraph((String) company.getOrDefault("name", ""), FontFactory.getFont(FontFactory.HELVETICA, 12)));
            document.add(new Paragraph("Period: " + metadata.getOrDefault("period", ""), FontFactory.getFont(FontFactory.HELVETICA, 10)));
            document.add(new Paragraph("Generated at: " + metadata.getOrDefault("generatedAt", ""), FontFactory.getFont(FontFactory.HELVETICA, 10)));
            document.add(new Paragraph(" "));
        }

        java.util.List<String> sections = metadata != null ? (java.util.List<String>) metadata.getOrDefault("sections", java.util.List.of()) : java.util.List.of();
        Map<String, Object> content = request.getContent();

        if (sections == null || sections.isEmpty()) {
            document.add(new Paragraph("No report sections selected."));
            hasContent = true;
        } else {
            for (String section : sections) {
                document.add(new Paragraph(section, FontFactory.getFont(FontFactory.HELVETICA_BOLD, 16)));
                hasContent = true;
                document.add(new Paragraph(" "));
                if (content != null) {
                    switch (section) {
                        case "Executive Summary":
                            Object summaryObj = content.get("summary");
                            if (summaryObj instanceof Map) {
                                @SuppressWarnings("unchecked")
                                Map<String, Object> summary = (Map<String, Object>) summaryObj;
                                
                                Object keyMetricsObj = summary.get("keyMetrics");
                                if (keyMetricsObj instanceof List) {
                                    @SuppressWarnings("unchecked")
                                    List<Map<String, Object>> keyMetrics = (List<Map<String, Object>>) keyMetricsObj;
                                    if (!keyMetrics.isEmpty()) {
                                    PdfPTable table = new PdfPTable(3);
                                    table.addCell("Metric");
                                    table.addCell("Value");
                                    table.addCell("Change");
                                    for (Map<String, Object> metric : keyMetrics) {
                                        table.addCell((String) metric.getOrDefault("name", ""));
                                        table.addCell((String) metric.getOrDefault("value", ""));
                                        table.addCell((String) metric.getOrDefault("change", ""));
                                    }
                                    document.add(table);
                                }
                                }
                                
                                Object highlightsObj = summary.get("highlights");
                                if (highlightsObj instanceof List) {
                                    @SuppressWarnings("unchecked")
                                    List<String> highlights = (List<String>) highlightsObj;
                                    if (!highlights.isEmpty()) {
                                    document.add(new Paragraph("Highlights:", FontFactory.getFont(FontFactory.HELVETICA_BOLD, 12)));
                                    for (String h : highlights) {
                                        document.add(new Paragraph("- " + h));
                                        }
                                    }
                                }
                            }
                            break;
                        case "Financial Highlights":
                            Object financialsObj = content.get("financials");
                            if (financialsObj instanceof Map) {
                                @SuppressWarnings("unchecked")
                                Map<String, Object> financials = (Map<String, Object>) financialsObj;
                                
                                Object incomeStatementObj = financials.get("incomeStatement");
                                if (incomeStatementObj instanceof List) {
                                    @SuppressWarnings("unchecked")
                                    List<Map<String, Object>> incomeStatement = (List<Map<String, Object>>) incomeStatementObj;
                                    if (!incomeStatement.isEmpty()) {
                                    document.add(new Paragraph("Income Statement:", FontFactory.getFont(FontFactory.HELVETICA_BOLD, 12)));
                                    PdfPTable table = new PdfPTable(3);
                                    table.addCell("Category");
                                    table.addCell("Current");
                                    table.addCell("Previous");
                                    for (Map<String, Object> row : incomeStatement) {
                                        table.addCell((String) row.getOrDefault("category", ""));
                                        table.addCell(String.valueOf(row.getOrDefault("current", "")));
                                        table.addCell(String.valueOf(row.getOrDefault("previous", "")));
                                    }
                                    document.add(table);
                                }
                                }
                                
                                Object balanceSheetObj = financials.get("balanceSheet");
                                if (balanceSheetObj instanceof List) {
                                    @SuppressWarnings("unchecked")
                                    List<Map<String, Object>> balanceSheet = (List<Map<String, Object>>) balanceSheetObj;
                                    if (!balanceSheet.isEmpty()) {
                                    document.add(new Paragraph("Balance Sheet:", FontFactory.getFont(FontFactory.HELVETICA_BOLD, 12)));
                                    PdfPTable table = new PdfPTable(2);
                                    table.addCell("Category");
                                    table.addCell("Value");
                                    for (Map<String, Object> row : balanceSheet) {
                                        table.addCell((String) row.getOrDefault("category", ""));
                                        table.addCell(String.valueOf(row.getOrDefault("value", "")));
                                    }
                                    document.add(table);
                                    }
                                }
                            }
                            break;
                        case "Trend Analysis":
                            Object trendsObj = content.get("trends");
                            if (trendsObj instanceof Map) {
                                @SuppressWarnings("unchecked")
                                Map<String, Object> trends = (Map<String, Object>) trendsObj;
                                if (!trends.isEmpty()) {
                                    document.add(new Paragraph("Trend Analysis:", FontFactory.getFont(FontFactory.HELVETICA_BOLD, 12)));
                                    
                                    // 获取可视化类型
                                    String visualizationType = "bar"; // 默认值
                                    if (request.getMetadata() != null && request.getMetadata().containsKey("visualization")) {
                                        visualizationType = (String) request.getMetadata().get("visualization");
                                    }
                                    
                                    // 生成收入趋势图表
                                    if (trends.containsKey("dailyRevenue")) {
                                        try {
                                            // 传递品牌色彩参数
                                            Map<String, Object> chartTrends = new HashMap<>(trends);
                                            chartTrends.put("useBrandColors", useBrandColors);
                                            
                                            BufferedImage revenueChart = chartService.generateRevenueTrendChart(chartTrends, visualizationType);
                                            if (revenueChart != null) {
                                                document.add(new Paragraph("Revenue Trend Chart:", FontFactory.getFont(FontFactory.HELVETICA_BOLD, 12)));
                                                ByteArrayOutputStream chartStream = new ByteArrayOutputStream();
                                                javax.imageio.ImageIO.write(revenueChart, "JPEG", chartStream);
                                                byte[] chartBytes = chartStream.toByteArray();
                                                com.lowagie.text.Image chartImage = com.lowagie.text.Image.getInstance(chartBytes);
                                                chartImage.scaleToFit(450, 300); // 调整缩放尺寸
                                                chartImage.setAlignment(com.lowagie.text.Image.MIDDLE);
                                                chartImage.setBorder(com.lowagie.text.Rectangle.BOX);
                                                chartImage.setBorderWidth(1.0f);
                                                chartImage.setBorderColor(new Color(200, 200, 200));
                                                document.add(chartImage);
                                                document.add(new Paragraph(" "));
                                            }
                                        } catch (Exception e) {
                                            System.err.println("Error generating revenue chart: " + e.getMessage());
                                        }
                                    }
                                    
                                    // 生成预订趋势图表
                                    if (trends.containsKey("dailyBookings")) {
                                        try {
                                            // 传递品牌色彩参数
                                            Map<String, Object> chartTrends = new HashMap<>(trends);
                                            chartTrends.put("useBrandColors", useBrandColors);
                                            
                                            BufferedImage bookingChart = chartService.generateBookingTrendChart(chartTrends, visualizationType);
                                            if (bookingChart != null) {
                                                document.add(new Paragraph("Booking Trend Chart:", FontFactory.getFont(FontFactory.HELVETICA_BOLD, 12)));
                                                ByteArrayOutputStream chartStream = new ByteArrayOutputStream();
                                                javax.imageio.ImageIO.write(bookingChart, "JPEG", chartStream);
                                                byte[] chartBytes = chartStream.toByteArray();
                                                com.lowagie.text.Image chartImage = com.lowagie.text.Image.getInstance(chartBytes);
                                                chartImage.scaleToFit(450, 300); // 调整缩放尺寸
                                                chartImage.setAlignment(com.lowagie.text.Image.MIDDLE);
                                                chartImage.setBorder(com.lowagie.text.Rectangle.BOX);
                                                chartImage.setBorderWidth(1.0f);
                                                chartImage.setBorderColor(new Color(200, 200, 200));
                                                document.add(chartImage);
                                                document.add(new Paragraph(" "));
                                            }
                                        } catch (Exception e) {
                                            System.err.println("Error generating booking chart: " + e.getMessage());
                                        }
                                    }
                                    
                                    // 生成用户活动图表
                                    if (trends.containsKey("activeUsers") || trends.containsKey("userActivityRate") || 
                                        trends.containsKey("bookingsPerUser") || trends.containsKey("topActiveUsers")) {
                                        try {
                                            // 传递品牌色彩参数和所有用户相关数据
                                            Map<String, Object> chartTrends = new HashMap<>(trends);
                                            chartTrends.put("useBrandColors", useBrandColors);
                                            
                                            // 如果有breakdown数据，也添加到图表数据中
                                            if (content.containsKey("breakdown")) {
                                                Object breakdownObj = content.get("breakdown");
                                                if (breakdownObj instanceof Map) {
                                                    @SuppressWarnings("unchecked")
                                                    Map<String, Object> breakdown = (Map<String, Object>) breakdownObj;
                                                    chartTrends.putAll(breakdown);
                                                }
                                            }
                                            
                                            BufferedImage userChart = chartService.generateUserActivityChart(chartTrends, visualizationType);
                                            if (userChart != null) {
                                                document.add(new Paragraph("User Activity Chart:", FontFactory.getFont(FontFactory.HELVETICA_BOLD, 12)));
                                                ByteArrayOutputStream chartStream = new ByteArrayOutputStream();
                                                javax.imageio.ImageIO.write(userChart, "JPEG", chartStream);
                                                byte[] chartBytes = chartStream.toByteArray();
                                                com.lowagie.text.Image chartImage = com.lowagie.text.Image.getInstance(chartBytes);
                                                chartImage.scaleToFit(450, 300); // 调整缩放尺寸
                                                chartImage.setAlignment(com.lowagie.text.Image.MIDDLE);
                                                chartImage.setBorder(com.lowagie.text.Rectangle.BOX);
                                                chartImage.setBorderWidth(1.0f);
                                                chartImage.setBorderColor(new Color(200, 200, 200));
                                                document.add(chartImage);
                                                document.add(new Paragraph(" "));
                                            }
                                        } catch (Exception e) {
                                            System.err.println("Error generating user activity chart: " + e.getMessage());
                                        }
                                    }
                                    
                                    // 显示详细的表格数据作为补充
                                    document.add(new Paragraph("Detailed Data Tables:", FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10)));
                                    
                                    // 显示每日收入趋势表格
                                    if (trends.containsKey("dailyRevenue")) {
                                        Object dailyRevenueObj = trends.get("dailyRevenue");
                                        if (dailyRevenueObj instanceof Map) {
                                            @SuppressWarnings("unchecked")
                                            Map<String, Object> dailyRevenue = (Map<String, Object>) dailyRevenueObj;
                                            if (!dailyRevenue.isEmpty()) {
                                                document.add(new Paragraph("Daily Revenue Data:", FontFactory.getFont(FontFactory.HELVETICA_BOLD, 9)));
                                                PdfPTable revenueTable = new PdfPTable(2);
                                                revenueTable.setWidthPercentage(100);
                                                revenueTable.addCell(new PdfPCell(new Phrase("Date", FontFactory.getFont(FontFactory.HELVETICA_BOLD, 8))));
                                                revenueTable.addCell(new PdfPCell(new Phrase("Revenue (RM)", FontFactory.getFont(FontFactory.HELVETICA_BOLD, 8))));
                                                
                                                // 按日期排序并显示前10个最高收入日
                                                dailyRevenue.entrySet().stream()
                                                    .sorted((a, b) -> {
                                                        Number aValue = (Number) a.getValue();
                                                        Number bValue = (Number) b.getValue();
                                                        return Double.compare(bValue.doubleValue(), aValue.doubleValue());
                                                    })
                                                    .limit(10)
                                                    .forEach(entry -> {
                                                        revenueTable.addCell(new PdfPCell(new Phrase(entry.getKey(), FontFactory.getFont(FontFactory.HELVETICA, 8))));
                                                        Number value = (Number) entry.getValue();
                                                        revenueTable.addCell(new PdfPCell(new Phrase(String.format("RM %.2f", value.doubleValue()), FontFactory.getFont(FontFactory.HELVETICA, 8))));
                                                    });
                                                document.add(revenueTable);
                                                document.add(new Paragraph(" "));
                                            }
                                        }
                                    }
                                    
                                    // 显示收入按状态分布
                                    if (trends.containsKey("revenueByStatus")) {
                                        Object revenueByStatusObj = trends.get("revenueByStatus");
                                        if (revenueByStatusObj instanceof Map) {
                                            @SuppressWarnings("unchecked")
                                            Map<String, Object> revenueByStatus = (Map<String, Object>) revenueByStatusObj;
                                            if (!revenueByStatus.isEmpty()) {
                                                document.add(new Paragraph("Revenue by Status:", FontFactory.getFont(FontFactory.HELVETICA_BOLD, 9)));
                                                PdfPTable statusTable = new PdfPTable(2);
                                                statusTable.setWidthPercentage(100);
                                                statusTable.addCell(new PdfPCell(new Phrase("Status", FontFactory.getFont(FontFactory.HELVETICA_BOLD, 8))));
                                                statusTable.addCell(new PdfPCell(new Phrase("Revenue (RM)", FontFactory.getFont(FontFactory.HELVETICA_BOLD, 8))));
                                                
                                                revenueByStatus.forEach((status, revenue) -> {
                                                    statusTable.addCell(new PdfPCell(new Phrase(status, FontFactory.getFont(FontFactory.HELVETICA, 8))));
                                                    Number value = (Number) revenue;
                                                    statusTable.addCell(new PdfPCell(new Phrase(String.format("RM %.2f", value.doubleValue()), FontFactory.getFont(FontFactory.HELVETICA, 8))));
                                                });
                                                document.add(statusTable);
                                                document.add(new Paragraph(" "));
                                            }
                                        }
                                    }
                                } else {
                                    document.add(new Paragraph("No trend data available for the selected period.", FontFactory.getFont(FontFactory.HELVETICA, 10)));
                                }
                            } else {
                                document.add(new Paragraph("No trend data available for the selected period.", FontFactory.getFont(FontFactory.HELVETICA, 10)));
                            }
                            break;
                        case "Detailed Breakdown":
                            Object breakdownObj = content.get("breakdown");
                            if (breakdownObj instanceof Map) {
                                @SuppressWarnings("unchecked")
                                Map<String, Object> breakdown = (Map<String, Object>) breakdownObj;
                                if (!breakdown.isEmpty()) {
                                    document.add(new Paragraph("Detailed Breakdown:", FontFactory.getFont(FontFactory.HELVETICA_BOLD, 12)));
                                    
                                    // 显示最高收入日
                                    if (breakdown.containsKey("topRevenueDays")) {
                                        Object topRevenueDaysObj = breakdown.get("topRevenueDays");
                                        if (topRevenueDaysObj instanceof List) {
                                            @SuppressWarnings("unchecked")
                                            List<Map<String, Object>> topRevenueDays = (List<Map<String, Object>>) topRevenueDaysObj;
                                            if (!topRevenueDays.isEmpty()) {
                                                document.add(new Paragraph("Top Revenue Days:", FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10)));
                                                PdfPTable revenueTable = new PdfPTable(2);
                                                revenueTable.setWidthPercentage(100);
                                                revenueTable.addCell(new PdfPCell(new Phrase("Date", FontFactory.getFont(FontFactory.HELVETICA_BOLD, 9))));
                                                revenueTable.addCell(new PdfPCell(new Phrase("Revenue (RM)", FontFactory.getFont(FontFactory.HELVETICA_BOLD, 9))));
                                                
                                                topRevenueDays.forEach(day -> {
                                                    revenueTable.addCell(new PdfPCell(new Phrase(String.valueOf(day.get("date")), FontFactory.getFont(FontFactory.HELVETICA, 9))));
                                                    Number revenue = (Number) day.get("revenue");
                                                    revenueTable.addCell(new PdfPCell(new Phrase(String.format("RM %.2f", revenue.doubleValue()), FontFactory.getFont(FontFactory.HELVETICA, 9))));
                                                });
                                                document.add(revenueTable);
                                                document.add(new Paragraph(" "));
                                            }
                                        }
                                    }
                                    
                                    // 显示最高预订日
                                    if (breakdown.containsKey("topBookingDays")) {
                                        Object topBookingDaysObj = breakdown.get("topBookingDays");
                                        if (topBookingDaysObj instanceof List) {
                                            @SuppressWarnings("unchecked")
                                            List<Map<String, Object>> topBookingDays = (List<Map<String, Object>>) topBookingDaysObj;
                                            if (!topBookingDays.isEmpty()) {
                                                document.add(new Paragraph("Top Booking Days:", FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10)));
                                                PdfPTable bookingTable = new PdfPTable(2);
                                                bookingTable.setWidthPercentage(100);
                                                bookingTable.addCell(new PdfPCell(new Phrase("Date", FontFactory.getFont(FontFactory.HELVETICA_BOLD, 9))));
                                                bookingTable.addCell(new PdfPCell(new Phrase("Bookings", FontFactory.getFont(FontFactory.HELVETICA_BOLD, 9))));
                                                
                                                topBookingDays.forEach(day -> {
                                                    bookingTable.addCell(new PdfPCell(new Phrase(String.valueOf(day.get("date")), FontFactory.getFont(FontFactory.HELVETICA, 9))));
                                                    Number bookings = (Number) day.get("bookings");
                                                    bookingTable.addCell(new PdfPCell(new Phrase(String.valueOf(bookings.longValue()), FontFactory.getFont(FontFactory.HELVETICA, 9))));
                                                });
                                                document.add(bookingTable);
                                                document.add(new Paragraph(" "));
                                            }
                                        }
                                    }
                                    
                                    // 显示最活跃用户
                                    if (breakdown.containsKey("topActiveUsers")) {
                                        Object topActiveUsersObj = breakdown.get("topActiveUsers");
                                        if (topActiveUsersObj instanceof List) {
                                            @SuppressWarnings("unchecked")
                                            List<Map<String, Object>> topActiveUsers = (List<Map<String, Object>>) topActiveUsersObj;
                                            if (!topActiveUsers.isEmpty()) {
                                                document.add(new Paragraph("Top Active Users:", FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10)));
                                                PdfPTable userTable = new PdfPTable(2);
                                                userTable.setWidthPercentage(100);
                                                userTable.addCell(new PdfPCell(new Phrase("User", FontFactory.getFont(FontFactory.HELVETICA_BOLD, 9))));
                                                userTable.addCell(new PdfPCell(new Phrase("Bookings", FontFactory.getFont(FontFactory.HELVETICA_BOLD, 9))));
                                                
                                                topActiveUsers.forEach(user -> {
                                                    userTable.addCell(new PdfPCell(new Phrase(String.valueOf(user.get("user")), FontFactory.getFont(FontFactory.HELVETICA, 9))));
                                                    Number bookings = (Number) user.get("bookings");
                                                    userTable.addCell(new PdfPCell(new Phrase(String.valueOf(bookings.longValue()), FontFactory.getFont(FontFactory.HELVETICA, 9))));
                                                });
                                                document.add(userTable);
                                                document.add(new Paragraph(" "));
                                            }
                                        }
                                    }
                                    
                                    // 显示按用户预订分布
                                    if (breakdown.containsKey("bookingsPerUser")) {
                                        Object bookingsPerUserObj = breakdown.get("bookingsPerUser");
                                        if (bookingsPerUserObj instanceof Map) {
                                            @SuppressWarnings("unchecked")
                                            Map<String, Object> bookingsPerUser = (Map<String, Object>) bookingsPerUserObj;
                                            if (!bookingsPerUser.isEmpty()) {
                                                document.add(new Paragraph("Bookings per User:", FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10)));
                                                PdfPTable userTable = new PdfPTable(2);
                                                userTable.setWidthPercentage(100);
                                                userTable.addCell(new PdfPCell(new Phrase("User", FontFactory.getFont(FontFactory.HELVETICA_BOLD, 9))));
                                                userTable.addCell(new PdfPCell(new Phrase("Total Bookings", FontFactory.getFont(FontFactory.HELVETICA_BOLD, 9))));
                                                
                                                // 按预订数量排序并显示前10个用户
                                                bookingsPerUser.entrySet().stream()
                                                    .sorted((a, b) -> {
                                                        Number aValue = (Number) a.getValue();
                                                        Number bValue = (Number) b.getValue();
                                                        return Long.compare(bValue.longValue(), aValue.longValue());
                                                    })
                                                    .limit(10)
                                                    .forEach(entry -> {
                                                        userTable.addCell(new PdfPCell(new Phrase(entry.getKey(), FontFactory.getFont(FontFactory.HELVETICA, 9))));
                                                        Number value = (Number) entry.getValue();
                                                        userTable.addCell(new PdfPCell(new Phrase(String.valueOf(value.longValue()), FontFactory.getFont(FontFactory.HELVETICA, 9))));
                                                    });
                                                document.add(userTable);
                                                document.add(new Paragraph(" "));
                                            }
                                        }
                                    }
                                } else {
                                    document.add(new Paragraph("No detailed breakdown data available for the selected period.", FontFactory.getFont(FontFactory.HELVETICA, 10)));
                                }
                            } else {
                                document.add(new Paragraph("No detailed breakdown data available for the selected period.", FontFactory.getFont(FontFactory.HELVETICA, 10)));
                            }
                            break;
                        case "Key Insights":
                            Object insightsObj = content.get("insights");
                            if (insightsObj instanceof List) {
                                @SuppressWarnings("unchecked")
                                List<String> insights = (List<String>) insightsObj;
                                if (!insights.isEmpty()) {
                                    document.add(new Paragraph("Key Insights:", FontFactory.getFont(FontFactory.HELVETICA_BOLD, 12)));
                                    for (String insight : insights) {
                                        document.add(new Paragraph("- " + insight, FontFactory.getFont(FontFactory.HELVETICA, 10)));
                                    }
                                } else {
                                    document.add(new Paragraph("No insights available for the selected period.", FontFactory.getFont(FontFactory.HELVETICA, 10)));
                                }
                            } else {
                                document.add(new Paragraph("No insights available for the selected period.", FontFactory.getFont(FontFactory.HELVETICA, 10)));
                            }
                            break;
                        case "Recommendations":
                            Object recsObj = content.get("recommendations");
                            if (recsObj instanceof List) {
                                @SuppressWarnings("unchecked")
                                List<String> recs = (List<String>) recsObj;
                                if (!recs.isEmpty()) {
                                document.add(new Paragraph("Recommendations:", FontFactory.getFont(FontFactory.HELVETICA_BOLD, 12)));
                                for (String rec : recs) {
                                    document.add(new Paragraph("- " + rec));
                                    }
                                }
                            }
                            break;
                        // 其它 section ...
                    }
                }
                document.add(new Paragraph(" "));
            }
        }

        if (!hasContent) {
            document.add(new Paragraph("No data available for the selected report parameters."));
        }

        // 添加数据附录
        if (includeAppendix && content != null) {
            document.add(new Paragraph(" "));
            document.add(new Paragraph("Data Appendix", FontFactory.getFont(FontFactory.HELVETICA_BOLD, 14)));
            document.add(new Paragraph("Raw Data Tables", FontFactory.getFont(FontFactory.HELVETICA_BOLD, 12)));
            
            // 添加原始收入数据
            Object trendsObj = content.get("trends");
            if (trendsObj instanceof Map) {
                @SuppressWarnings("unchecked")
                Map<String, Object> trends = (Map<String, Object>) trendsObj;
                if (trends.containsKey("dailyRevenue")) {
                    Object dailyRevenueObj = trends.get("dailyRevenue");
                    if (dailyRevenueObj instanceof Map) {
                        @SuppressWarnings("unchecked")
                        Map<String, Object> dailyRevenue = (Map<String, Object>) dailyRevenueObj;
                        if (!dailyRevenue.isEmpty()) {
                            document.add(new Paragraph("Complete Daily Revenue Data:", FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10)));
                            PdfPTable appendixTable = new PdfPTable(2);
                            appendixTable.setWidthPercentage(100);
                            appendixTable.addCell(new PdfPCell(new Phrase("Date", FontFactory.getFont(FontFactory.HELVETICA_BOLD, 8))));
                            appendixTable.addCell(new PdfPCell(new Phrase("Revenue (RM)", FontFactory.getFont(FontFactory.HELVETICA_BOLD, 8))));
                            
                            dailyRevenue.forEach((date, revenue) -> {
                                appendixTable.addCell(new PdfPCell(new Phrase(date, FontFactory.getFont(FontFactory.HELVETICA, 8))));
                                Number value = (Number) revenue;
                                appendixTable.addCell(new PdfPCell(new Phrase(String.format("RM %.2f", value.doubleValue()), FontFactory.getFont(FontFactory.HELVETICA, 8))));
                            });
                            document.add(appendixTable);
                            document.add(new Paragraph(" "));
                        }
                    }
                }
            }
        }

        // 添加页脚
        if (includeHeaderFooter) {
            document.add(new Paragraph(" "));
            document.add(new Paragraph("Generated by Picklefy Pickleball Club Management System", FontFactory.getFont(FontFactory.HELVETICA, 8)));
            document.add(new Paragraph("For internal use only", FontFactory.getFont(FontFactory.HELVETICA, 8)));
        }

        document.close();
        return out.toByteArray();
    }

    private double calcChangeRate(Number current, Number last) {
        if (last == null || last.doubleValue() == 0) return 0;
        return ((current.doubleValue() - last.doubleValue()) / last.doubleValue()) * 100.0;
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
        dto.setCreatedAt(user.getCreatedAt());

        UserAccount account = user.getUserAccount();
        if (account != null) {
            dto.setUsername(account.getUsername());
            dto.setStatus(account.getStatus());
            dto.setProfileImage(account.getProfileImage());
        }

        Member member = user.getMember();
        if (member != null) {
            dto.setPointBalance(member.getTierPointBalance());
            if (member.getTier() != null) {
                // 修复这里：直接使用 tierName 字符串值，不需要 .name()
                dto.setTier(member.getTier().getTierName()); // 移除了 .name()
            }
        }

        // 设置Admin position
        if ("ADMIN".equalsIgnoreCase(user.getUserType())) {
            adminRepository.findByUserId(user.getId()).ifPresent(admin -> {
                dto.setPosition(admin.getPosition());
            });
        }

        return dto;
    }

    public AdminBookingDto convertToAdminBookingDto(Booking booking) {
        try {
        AdminBookingDto dto = new AdminBookingDto();
        dto.setId(booking.getId());
        dto.setBookingDate(booking.getBookingDate());
        dto.setTotalAmount(booking.getTotalAmount());
        dto.setStatus(booking.getStatus());

            // 安全地获取会员信息
            try {
        if (booking.getMember() != null && booking.getMember().getUser() != null) {
            dto.setMemberName(booking.getMember().getUser().getName());
            dto.setMemberPhone(booking.getMember().getUser().getPhone());
            dto.setMemberEmail(booking.getMember().getUser().getEmail());
                    dto.setMemberId(booking.getMember().getId()); // 新增：设置会员ID
                }
            } catch (Exception e) {
                System.err.println("Error getting member info for booking " + booking.getId() + ": " + e.getMessage());
            }

            // 安全地处理多 slot 预订
            try {
                if (booking.getBookingSlots() != null && !booking.getBookingSlots().isEmpty()) {
                    System.out.println("AdminDashboardService: Booking " + booking.getId() + " has " + booking.getBookingSlots().size() + " slots");
                    
                    // 按时间排序，过滤掉空的 slot
                    List<BookingSlot> sortedSlots = booking.getBookingSlots().stream()
                            .filter(bs -> bs != null && bs.getSlot() != null) // 过滤掉空的 slot
                            .sorted((a, b) -> a.getSlot().getStartTime().compareTo(b.getSlot().getStartTime()))
                            .collect(Collectors.toList());
                    
                    if (!sortedSlots.isEmpty()) {
                        // 获取第一个和最后一个 slot
                        Slot firstSlot = sortedSlots.get(0).getSlot();
                        Slot lastSlot = sortedSlots.get(sortedSlots.size() - 1).getSlot();
                        
                        // 计算总时长
                        int totalDuration = sortedSlots.stream()
                                .mapToInt(bs -> bs.getSlot().getDurationHours() != null ? bs.getSlot().getDurationHours() : 1)
                                .sum();
                        
                        dto.setSlotDate(firstSlot.getDate());
                        dto.setStartTime(firstSlot.getStartTime());
                        dto.setEndTime(lastSlot.getEndTime());
                        dto.setDurationHours(totalDuration);

                        // 获取场地信息
                        try {
                            Court court = courtRepository.findById(firstSlot.getCourtId()).orElse(null);
            if (court != null) {
                dto.setCourtName(court.getName());
            }
                        } catch (Exception e) {
                            System.err.println("Error getting court info for booking " + booking.getId() + ": " + e.getMessage());
        }

                        // 设置所有 bookingSlots 信息（用于前端显示）
                        dto.setBookingSlots(sortedSlots.stream()
                                .map(bs -> {
                                    com.pickleball_backend.pickleball.dto.BookingSlotDto slotDto = 
                                        new com.pickleball_backend.pickleball.dto.BookingSlotDto();
                                    slotDto.setId(bs.getId());
                                    slotDto.setStatus(bs.getStatus());
                                    
                                    // 设置slot信息
                                    if (bs.getSlot() != null) {
                                        com.pickleball_backend.pickleball.dto.SlotDto slotInfo = 
                                            new com.pickleball_backend.pickleball.dto.SlotDto();
                                        slotInfo.setId(bs.getSlot().getId());
                                        slotInfo.setDate(bs.getSlot().getDate());
                                        slotInfo.setStartTime(bs.getSlot().getStartTime());
                                        slotInfo.setEndTime(bs.getSlot().getEndTime());
                                        slotInfo.setDurationHours(bs.getSlot().getDurationHours());
                                        slotInfo.setCourtId(bs.getSlot().getCourtId());
                                        slotInfo.setAvailable(bs.getSlot().isAvailable());
                                        slotDto.setSlot(slotInfo);
                                    }
                                    
                                    return slotDto;
                                                        })
                        .collect(Collectors.toList()));
                    }
                }
            } catch (Exception e) {
                System.err.println("Error processing booking slots for booking " + booking.getId() + ": " + e.getMessage());
            }

            // 設置取消請求信息
            try {
                List<CancellationRequest> cancellationRequests = cancellationRequestRepository.findByBookingId(booking.getId());
                if (!cancellationRequests.isEmpty()) {
                    CancellationRequest cancellationRequest = cancellationRequests.get(0); // 取第一個
                    CancellationRequestDto cancellationRequestDto = new CancellationRequestDto();
                    cancellationRequestDto.setId(cancellationRequest.getId());
                    cancellationRequestDto.setStatus(cancellationRequest.getStatus());
                    cancellationRequestDto.setReason(cancellationRequest.getReason());
                    cancellationRequestDto.setRequestDate(cancellationRequest.getRequestDate());
                    cancellationRequestDto.setAdminRemark(cancellationRequest.getAdminRemark());
                    dto.setCancellationRequest(cancellationRequestDto);
                }
            } catch (Exception e) {
                System.err.println("Error getting cancellation request for booking " + booking.getId() + ": " + e.getMessage());
            }
            
        return dto;
        } catch (Exception e) {
            System.err.println("Error converting booking to DTO: " + e.getMessage());
            return null;
        }
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
        transaction.setProcessedAt(java.time.LocalDateTime.now());
        
        walletTransactionRepository.save(transaction);
    }
}