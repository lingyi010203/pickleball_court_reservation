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
import com.pickleball_backend.pickleball.repository.FeedbackRepository;
import lombok.RequiredArgsConstructor;
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
    private final FeedbackRepository feedbackRepository;

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
        // 4. Refund payment if needed (optional, can be expanded)
        Payment payment = booking.getPayment();
        if (payment != null) {
            payment.setStatus("REFUNDED");
            paymentRepository.save(payment);
        }
        // 5. 保存管理员备注和操作人到取消请求（如有）
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
        java.time.YearMonth lastMonth = thisMonth.minusMonths(1);
        java.time.LocalDate startOfThisMonthDate = thisMonth.atDay(1);
        java.time.LocalDate startOfLastMonthDate = lastMonth.atDay(1);
        java.time.LocalDate endOfLastMonthDate = startOfThisMonthDate.minusDays(1);
        java.time.LocalDateTime startOfLastMonth = startOfLastMonthDate.atStartOfDay();
        java.time.LocalDateTime endOfLastMonth = endOfLastMonthDate.atTime(23, 59, 59);

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

        // 5. 上月数据
        // 5.1 上月用户数（注册时间在上月）
        Long lastMonthUsers = userRepository.countByCreatedAtBetween(startOfLastMonth, endOfLastMonth);
        // 5.2 上月预订数（预订时间在上月）
        Long lastMonthBookings = bookingRepository.countByBookingDateBetween(startOfLastMonth, endOfLastMonth);
        // 5.3 上月收入（支付时间在上月）
        Double lastMonthRevenue = paymentRepository.sumTotalRevenueByDate(startOfLastMonth, endOfLastMonth);
        // 5.4 上月平均评分（评分时间在上月）
        Double lastMonthAvgRating = feedbackRepository.findAverageRatingByDate(startOfLastMonth, endOfLastMonth);

        // 6. 变化率计算（环比 = (本月-上月)/上月*100%）
        dto.setTotalUsersChange(calcChangeRate(totalUsers, lastMonthUsers));
        dto.setTotalBookingsChange(calcChangeRate(totalBookings, lastMonthBookings));
        dto.setTotalRevenueChange(calcChangeRate(totalRevenue, lastMonthRevenue));
        dto.setAverageRatingChange(calcChangeRate(averageRating, lastMonthAvgRating));
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
    public List<RecentActivityDto> getRecentActivity() {
        List<RecentActivityDto> activities = new ArrayList<>();
        // 最近预订
        bookingRepository.findTop5ByOrderByBookingDateDesc().forEach(b -> {
            try {
                RecentActivityDto dto = new RecentActivityDto();
                dto.setType("booking");
                String userName = "";
                if (b.getMember() != null && b.getMember().getUser() != null && b.getMember().getUser().getName() != null) {
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
        // 最近取消预订
        cancellationRequestRepository.findTop3ByOrderByRequestDateDesc().forEach(cr -> {
            try {
                RecentActivityDto dto = new RecentActivityDto();
                dto.setType("cancellation");
                String userName = "";
                if (cr.getBooking() != null && cr.getBooking().getMember() != null &&
                    cr.getBooking().getMember().getUser() != null &&
                    cr.getBooking().getMember().getUser().getName() != null) {
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
        // 最近注册
        userRepository.findTop3ByOrderByCreatedAtDesc().forEach(u -> {
            try {
                RecentActivityDto dto = new RecentActivityDto();
                dto.setType("user");
                dto.setUser(u.getName() != null ? u.getName() : "");
                dto.setDetail("created an account");
                dto.setTimestamp(u.getCreatedAt());
                dto.setIcon("\uD83D\uDC64"); // 👤
                activities.add(dto);
            } catch (Exception ignore) {}
        });
        // 最近评价
        feedbackRepository.findTop2ByOrderByCreatedAtDesc().forEach(f -> {
            try {
                RecentActivityDto dto = new RecentActivityDto();
                dto.setType("review");
                String reviewer = "";
                if (f.getUser() != null && f.getUser().getName() != null) {
                    reviewer = f.getUser().getName();
                }
                dto.setUser(reviewer);
                dto.setDetail("rated a venue " + (f.getRating() != null ? f.getRating() : "") + " stars");
                dto.setTimestamp(f.getCreatedAt());
                dto.setIcon("\u2B50"); // ⭐
                activities.add(dto);
            } catch (Exception ignore) {}
        });
        // 按时间倒序取前10条
        return activities.stream()
                .filter(a -> a.getTimestamp() != null)
                .sorted((a, b) -> b.getTimestamp().compareTo(a.getTimestamp()))
                .limit(10)
                .collect(Collectors.toList());
    }

    @Override
    public ResponseEntity<InputStreamResource> generateReport(ReportRequestDto request) throws Exception {
        List<Booking> bookings = bookingRepository.findAll();
        Map<String, Boolean> filters = request.getFilters() != null ? request.getFilters() : new java.util.HashMap<>();
        byte[] bytes;
        String ext;
        String contentType;
        switch (request.getFormat().toLowerCase()) {
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
                bytes = generatePdfReport(bookings, filters);
                ext = "pdf";
                contentType = "application/pdf";
                break;
            default:
                throw new IllegalArgumentException("Unsupported format: " + request.getFormat());
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
            dto.setPointBalance(member.getPointBalance());
            if (member.getTier() != null) {
                // 修复这里：直接使用 tierName 字符串值，不需要 .name()
                dto.setTier(member.getTier().getTierName()); // 移除了 .name()
            }
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
                                    
                                    // 安全地设置 slot 信息，避免循环引用
                                    if (bs.getSlot() != null) {
                                        com.pickleball_backend.pickleball.dto.SlotDto slotDto2 = 
                                            new com.pickleball_backend.pickleball.dto.SlotDto();
                                        slotDto2.setId(bs.getSlot().getId());
                                        slotDto2.setDate(bs.getSlot().getDate());
                                        slotDto2.setStartTime(bs.getSlot().getStartTime());
                                        slotDto2.setEndTime(bs.getSlot().getEndTime());
                                        slotDto2.setDurationHours(bs.getSlot().getDurationHours());
                                        slotDto2.setCourtId(bs.getSlot().getCourtId());
                                        slotDto2.setAvailable(bs.getSlot().isAvailable());
                                        slotDto.setSlot(slotDto2);
                                    }
                                    
                                    return slotDto;
                                })
                                .collect(Collectors.toList()));
                    }
                } else {
                    System.out.println("AdminDashboardService: Booking " + booking.getId() + " has no booking slots");
                }
            } catch (Exception e) {
                System.err.println("Error processing booking slots for booking " + booking.getId() + ": " + e.getMessage());
            }

            // 安全地添加支付信息
            try {
        if (booking.getPayment() != null) {
            dto.setPaymentMethod(booking.getPayment().getPaymentMethod());
            dto.setPaymentType(booking.getPayment().getPaymentType());
            dto.setPaymentStatus(booking.getPayment().getStatus());
            dto.setTransactionId(booking.getPayment().getTransactionId());
                    dto.setPaymentId(booking.getPayment().getId()); // 新增：设置支付ID
                }
            } catch (Exception e) {
                System.err.println("Error getting payment info for booking " + booking.getId() + ": " + e.getMessage());
        }

        dto.setPurpose(booking.getPurpose());
        dto.setNumberOfPlayers(booking.getNumberOfPlayers());
            dto.setNumPaddles(booking.getNumPaddles());
            dto.setBuyBallSet(booking.getBuyBallSet());
            
            // 安全地处理取消请求
            try {
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
            } catch (Exception e) {
                System.err.println("Error getting cancellation request for booking " + booking.getId() + ": " + e.getMessage());
            }
            
        return dto;
        } catch (Exception e) {
            System.err.println("Error in convertToAdminBookingDto for booking " + booking.getId() + ": " + e.getMessage());
            e.printStackTrace();
            throw e;
        }
    }
}