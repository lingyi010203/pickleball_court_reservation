package com.pickleball_backend.pickleball.service;

import com.pickleball_backend.pickleball.entity.Booking;
import com.pickleball_backend.pickleball.entity.Member;
import com.pickleball_backend.pickleball.entity.User;
import com.pickleball_backend.pickleball.entity.Court;
import com.pickleball_backend.pickleball.repository.BookingRepository;
import com.pickleball_backend.pickleball.repository.MemberRepository;
import com.pickleball_backend.pickleball.repository.UserRepository;
import com.pickleball_backend.pickleball.repository.CourtRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;
import java.util.Objects;
import java.util.LinkedHashMap;

@Service
@RequiredArgsConstructor
public class ReportServiceImpl implements ReportService {

    private final BookingRepository bookingRepository;
    private final MemberRepository memberRepository;
    private final UserRepository userRepository;
    private final CourtRepository courtRepository;

    @Override
    public Map<String, Object> generateRevenueReport(String startDate, String endDate) {
        LocalDate start = LocalDate.parse(startDate);
        LocalDate end = LocalDate.parse(endDate);
        
        // 转换为LocalDateTime
        java.time.LocalDateTime startDateTime = start.atStartOfDay();
        java.time.LocalDateTime endDateTime = end.atTime(23, 59, 59);
        
        // 获取当前期间的预订数据，排除所有取消和待处理的预订
        List<Booking> currentBookings = filterValidBookings(
                bookingRepository.findBookingsByDateRange(startDateTime, endDateTime)
        );
        
        // 获取上一期间的数据用于比较
        long daysDiff = java.time.temporal.ChronoUnit.DAYS.between(start, end);
        LocalDate previousStart = start.minusDays(daysDiff);
        LocalDate previousEnd = start.minusDays(1);
        java.time.LocalDateTime previousStartDateTime = previousStart.atStartOfDay();
        java.time.LocalDateTime previousEndDateTime = previousEnd.atTime(23, 59, 59);
        List<Booking> previousBookings = filterValidBookings(
                bookingRepository.findBookingsByDateRange(previousStartDateTime, previousEndDateTime)
        );
        
        // 计算收入指标
        double currentRevenue = currentBookings.stream()
                .mapToDouble(Booking::getTotalAmount)
                .sum();
        
        double previousRevenue = previousBookings.stream()
                .mapToDouble(Booking::getTotalAmount)
                .sum();
        
        double revenueChange = previousRevenue > 0 ? ((currentRevenue - previousRevenue) / previousRevenue) * 100 : 0;
        
        // 按状态统计收入
        Map<String, Double> revenueByStatus = currentBookings.stream()
                .collect(Collectors.groupingBy(
                        Booking::getStatus,
                        Collectors.summingDouble(Booking::getTotalAmount)
                ));
        
        // 按日期统计收入趋势
        Map<String, Double> dailyRevenue = currentBookings.stream()
                .collect(Collectors.groupingBy(
                        booking -> booking.getBookingDate().toLocalDate().toString(),
                        Collectors.summingDouble(Booking::getTotalAmount)
                ));
        
        // 计算平均订单价值
        double avgOrderValue = currentBookings.isEmpty() ? 0 : currentRevenue / currentBookings.size();
        
        Map<String, Object> summary = new HashMap<>();
        summary.put("keyMetrics", Arrays.asList(
                Map.of("name", "Total Revenue", "value", String.format("RM %.2f", currentRevenue), "change", String.format("%.1f%%", revenueChange)),
                Map.of("name", "Total Bookings", "value", String.valueOf(currentBookings.size()), "change", String.format("%.1f%%", calculateChange((long)currentBookings.size(), previousBookings.size()))),
                Map.of("name", "Average Order Value", "value", String.format("RM %.2f", avgOrderValue), "change", "N/A")
        ));
        summary.put("highlights", Arrays.asList(
                String.format("Total revenue of RM %.2f generated (confirmed and completed bookings only)", currentRevenue),
                String.format("Average order value: RM %.2f", avgOrderValue),
                String.format("Revenue %s by %.1f%% compared to previous period", revenueChange >= 0 ? "increased" : "decreased", Math.abs(revenueChange))
        ));
        
        Map<String, Object> trends = new HashMap<>();
        trends.put("dailyRevenue", dailyRevenue);
        trends.put("revenueByStatus", revenueByStatus);
        
        Map<String, Object> breakdown = new HashMap<>();
        breakdown.put("revenueByStatus", revenueByStatus);
        breakdown.put("topRevenueDays", getTopRevenueDays(dailyRevenue, 5));
        
        Map<String, Object> result = new HashMap<>();
        result.put("summary", summary);
        result.put("trends", trends);
        result.put("breakdown", breakdown);
        result.put("insights", generateRevenueInsights(currentRevenue, previousRevenue, currentBookings.size(), (int)previousBookings.size(), avgOrderValue));
        
        return result;
    }

    @Override
    public Map<String, Object> generateBookingReport(String startDate, String endDate) {
        LocalDate start = LocalDate.parse(startDate);
        LocalDate end = LocalDate.parse(endDate);
        
        // 转换为LocalDateTime
        java.time.LocalDateTime startDateTime = start.atStartOfDay();
        java.time.LocalDateTime endDateTime = end.atTime(23, 59, 59);
        
        // 获取当前期间的预订数据，排除所有取消和待处理的预订
        List<Booking> currentBookings = filterValidBookings(
                bookingRepository.findBookingsByDateRange(startDateTime, endDateTime)
        );
        
        // 获取上一期间的数据用于比较
        long daysDiff = java.time.temporal.ChronoUnit.DAYS.between(start, end);
        LocalDate previousStart = start.minusDays(daysDiff);
        LocalDate previousEnd = start.minusDays(1);
        java.time.LocalDateTime previousStartDateTime = previousStart.atStartOfDay();
        java.time.LocalDateTime previousEndDateTime = previousEnd.atTime(23, 59, 59);
        List<Booking> previousBookings = filterValidBookings(
                bookingRepository.findBookingsByDateRange(previousStartDateTime, previousEndDateTime)
        );
        
        // 按状态统计预订
        Map<String, Long> bookingsByStatus = currentBookings.stream()
                .collect(Collectors.groupingBy(Booking::getStatus, Collectors.counting()));
        
        // 按日期统计预订趋势
        Map<String, Long> dailyBookings = currentBookings.stream()
                .collect(Collectors.groupingBy(
                        booking -> booking.getBookingDate().toLocalDate().toString(),
                        Collectors.counting()
                ));
        
        // 计算预订成功率
        long completedBookings = bookingsByStatus.getOrDefault("COMPLETED", 0L);
        long totalBookings = currentBookings.size();
        double completionRate = totalBookings > 0 ? (double) completedBookings / totalBookings * 100 : 0;
        
        // 计算取消率
        long cancelledBookings = bookingsByStatus.getOrDefault("CANCELLED", 0L);
        double cancellationRate = totalBookings > 0 ? (double) cancelledBookings / totalBookings * 100 : 0;
        
        Map<String, Object> summary = new HashMap<>();
        summary.put("keyMetrics", Arrays.asList(
                Map.of("name", "Total Bookings", "value", String.valueOf(totalBookings), "change", String.format("%.1f%%", calculateChange((long)totalBookings, previousBookings.size()))),
                Map.of("name", "Completion Rate", "value", String.format("%.1f%%", completionRate), "change", "N/A"),
                Map.of("name", "Cancellation Rate", "value", String.format("%.1f%%", cancellationRate), "change", "N/A")
        ));
        summary.put("highlights", Arrays.asList(
                String.format("Total of %d bookings during the period", totalBookings),
                String.format("%.1f%% of bookings were completed successfully", completionRate),
                String.format("%.1f%% of bookings were cancelled", cancellationRate)
        ));
        
        Map<String, Object> trends = new HashMap<>();
        trends.put("dailyBookings", dailyBookings);
        trends.put("bookingsByStatus", bookingsByStatus);
        
        Map<String, Object> breakdown = new HashMap<>();
        breakdown.put("bookingsByStatus", bookingsByStatus);
        breakdown.put("topBookingDays", getTopBookingDays(dailyBookings, 5));
        
        Map<String, Object> result = new HashMap<>();
        result.put("summary", summary);
        result.put("trends", trends);
        result.put("breakdown", breakdown);
        result.put("insights", generateBookingInsights((int)totalBookings, (int)previousBookings.size(), completionRate, cancellationRate));
        
        return result;
    }

    @Override
    public Map<String, Object> generateUserReport(String startDate, String endDate) {
        LocalDate start = LocalDate.parse(startDate);
        LocalDate end = LocalDate.parse(endDate);
        
        // 转换为LocalDateTime
        java.time.LocalDateTime startDateTime = start.atStartOfDay();
        java.time.LocalDateTime endDateTime = end.atTime(23, 59, 59);
        
        // 获取所有用户
        List<User> allUsers = userRepository.findAll();
        
        // 获取当前期间有预订的用户，排除所有取消和待处理的预订
        List<Booking> currentBookings = filterValidBookings(
                bookingRepository.findBookingsByDateRange(startDateTime, endDateTime)
        );
        Set<Integer> activeUserIds = currentBookings.stream()
                .map(booking -> booking.getMember().getUser().getId())
                .collect(Collectors.toSet());
        
        // 获取上一期间有预订的用户，排除所有取消和待处理的预订
        long daysDiff = java.time.temporal.ChronoUnit.DAYS.between(start, end);
        LocalDate previousStart = start.minusDays(daysDiff);
        LocalDate previousEnd = start.minusDays(1);
        java.time.LocalDateTime previousStartDateTime = previousStart.atStartOfDay();
        java.time.LocalDateTime previousEndDateTime = previousEnd.atTime(23, 59, 59);
        List<Booking> previousBookings = filterValidBookings(
                bookingRepository.findBookingsByDateRange(previousStartDateTime, previousEndDateTime)
        );
        Set<Integer> previousActiveUserIds = previousBookings.stream()
                .map(booking -> booking.getMember().getUser().getId())
                .collect(Collectors.toSet());
        
        // 计算用户指标
        long totalUsers = allUsers.size();
        long activeUsers = activeUserIds.size();
        long previousActiveUsers = previousActiveUserIds.size();
        double activeUserRate = totalUsers > 0 ? (double) activeUsers / totalUsers * 100 : 0;
        
        // 计算新用户（在当前期间首次预订的用户）
        Set<Integer> newUserIds = activeUserIds.stream()
                .filter(id -> !previousActiveUserIds.contains(id))
                .collect(Collectors.toSet());
        
        // 按用户统计预订次数
        Map<String, Long> bookingsPerUser = currentBookings.stream()
                .collect(Collectors.groupingBy(
                        booking -> booking.getMember().getUser().getName(),
                        Collectors.counting()
                ));
        
        Map<String, Object> summary = new HashMap<>();
        summary.put("keyMetrics", Arrays.asList(
                Map.of("name", "Total Users", "value", String.valueOf(totalUsers), "change", "N/A"),
                Map.of("name", "Active Users", "value", String.valueOf(activeUsers), "change", String.format("%.1f%%", calculateChange(activeUsers, previousActiveUsers))),
                Map.of("name", "New Users", "value", String.valueOf(newUserIds.size()), "change", "N/A")
        ));
        summary.put("highlights", Arrays.asList(
                String.format("Total of %d registered users", totalUsers),
                String.format("%d users were active during the period (%.1f%%)", activeUsers, activeUserRate),
                String.format("%d new users started booking during the period", newUserIds.size())
        ));
        
        Map<String, Object> trends = new HashMap<>();
        trends.put("activeUsers", activeUsers);
        trends.put("newUsers", newUserIds.size());
        trends.put("userActivityRate", activeUserRate);
        
        Map<String, Object> breakdown = new HashMap<>();
        breakdown.put("bookingsPerUser", bookingsPerUser);
        breakdown.put("topActiveUsers", getTopActiveUsers(bookingsPerUser, 10));
        
        Map<String, Object> result = new HashMap<>();
        result.put("summary", summary);
        result.put("trends", trends);
        result.put("breakdown", breakdown);
        result.put("insights", generateUserInsights(totalUsers, activeUsers, newUserIds.size(), activeUserRate));
        
        return result;
    }

    // New specialized report implementations
    // 辅助方法：过滤有效的预订（排除所有取消和待处理状态）
    private List<Booking> filterValidBookings(List<Booking> bookings) {
        return bookings.stream()
                .filter(booking -> {
                    String status = booking.getStatus();
                    // 只包含已确认和已完成的预订
                    return "CONFIRMED".equals(status) || "COMPLETED".equals(status);
                })
                .collect(Collectors.toList());
    }

    @Override
    public Map<String, Object> generateMonthlyRevenueReport(String startDate, String endDate) {
        LocalDate start = LocalDate.parse(startDate);
        LocalDate end = LocalDate.parse(endDate);
        
        // 转换为LocalDateTime
        java.time.LocalDateTime startDateTime = start.atStartOfDay();
        java.time.LocalDateTime endDateTime = end.atTime(23, 59, 59);
        
        // 获取当前期间的预订数据，排除所有取消和待处理的预订
        List<Booking> currentBookings = filterValidBookings(
                bookingRepository.findBookingsByDateRange(startDateTime, endDateTime)
        );
        
        // 获取上一期间的数据用于比较
        long daysDiff = java.time.temporal.ChronoUnit.DAYS.between(start, end);
        LocalDate previousStart = start.minusDays(daysDiff);
        LocalDate previousEnd = start.minusDays(1);
        java.time.LocalDateTime previousStartDateTime = previousStart.atStartOfDay();
        java.time.LocalDateTime previousEndDateTime = previousEnd.atTime(23, 59, 59);
        List<Booking> previousBookings = filterValidBookings(
                bookingRepository.findBookingsByDateRange(previousStartDateTime, previousEndDateTime)
        );
        
        // 按月份统计收入
        Map<String, Double> monthlyRevenue = currentBookings.stream()
                .collect(Collectors.groupingBy(
                        booking -> booking.getBookingDate().toLocalDate().format(DateTimeFormatter.ofPattern("yyyy-MM")),
                        Collectors.summingDouble(Booking::getTotalAmount)
                ));
        
        // 计算收入指标
        double currentRevenue = currentBookings.stream()
                .mapToDouble(Booking::getTotalAmount)
                .sum();
        
        double previousRevenue = previousBookings.stream()
                .mapToDouble(Booking::getTotalAmount)
                .sum();
        
        double revenueChange = previousRevenue > 0 ? ((currentRevenue - previousRevenue) / previousRevenue) * 100 : 0;
        
        // 计算平均月收入
        double avgMonthlyRevenue = monthlyRevenue.isEmpty() ? 0 : currentRevenue / monthlyRevenue.size();
        
        Map<String, Object> summary = new HashMap<>();
        summary.put("keyMetrics", Arrays.asList(
                Map.of("name", "Total Revenue (Valid Bookings Only)", "value", String.format("RM %.2f", currentRevenue), "change", String.format("%.1f%%", revenueChange)),
                Map.of("name", "Average Monthly Revenue", "value", String.format("RM %.2f", avgMonthlyRevenue), "change", "N/A"),
                Map.of("name", "Valid Bookings", "value", String.valueOf(currentBookings.size()), "change", String.format("%.1f%%", calculateChange((long)currentBookings.size(), previousBookings.size())))
        ));
        summary.put("highlights", Arrays.asList(
                String.format("Total revenue of RM %.2f generated (confirmed and completed bookings only)", currentRevenue),
                String.format("Average monthly revenue: RM %.2f", avgMonthlyRevenue),
                String.format("Revenue %s by %.1f%% compared to previous period", revenueChange >= 0 ? "increased" : "decreased", Math.abs(revenueChange))
        ));
        
        Map<String, Object> trends = new HashMap<>();
        trends.put("monthlyRevenue", monthlyRevenue);
        
        Map<String, Object> breakdown = new HashMap<>();
        breakdown.put("monthlyRevenue", monthlyRevenue);
        breakdown.put("topRevenueMonths", getTopRevenueMonths(monthlyRevenue, 6));
        
        Map<String, Object> result = new HashMap<>();
        result.put("summary", summary);
        result.put("trends", trends);
        result.put("breakdown", breakdown);
        result.put("insights", generateMonthlyRevenueInsights(currentRevenue, previousRevenue, currentBookings.size(), (int)previousBookings.size(), avgMonthlyRevenue));
        
        return result;
    }

    @Override
    public Map<String, Object> generatePeakHourRevenueReport(String startDate, String endDate) {
        LocalDate start = LocalDate.parse(startDate);
        LocalDate end = LocalDate.parse(endDate);
        
        // 转换为LocalDateTime
        java.time.LocalDateTime startDateTime = start.atStartOfDay();
        java.time.LocalDateTime endDateTime = end.atTime(23, 59, 59);
        
        // 获取当前期间的预订数据，排除所有取消和待处理的预订
        List<Booking> currentBookings = filterValidBookings(
                bookingRepository.findBookingsByDateRange(startDateTime, endDateTime)
        );
        
        // 按小时统计收入
        Map<String, Double> hourlyRevenue = currentBookings.stream()
                .collect(Collectors.groupingBy(
                        booking -> String.valueOf(booking.getBookingDate().getHour()),
                        Collectors.summingDouble(Booking::getTotalAmount)
                ));
        
        // 按时间段统计收入（上午、下午、晚上）
        Map<String, Double> timeSlotRevenue = new HashMap<>();
        timeSlotRevenue.put("Morning (6AM-12PM)", currentBookings.stream()
                .filter(booking -> booking.getBookingDate().getHour() >= 6 && booking.getBookingDate().getHour() < 12)
                .mapToDouble(Booking::getTotalAmount)
                .sum());
        timeSlotRevenue.put("Afternoon (12PM-6PM)", currentBookings.stream()
                .filter(booking -> booking.getBookingDate().getHour() >= 12 && booking.getBookingDate().getHour() < 18)
                .mapToDouble(Booking::getTotalAmount)
                .sum());
        timeSlotRevenue.put("Evening (6PM-12AM)", currentBookings.stream()
                .filter(booking -> booking.getBookingDate().getHour() >= 18 || booking.getBookingDate().getHour() < 6)
                .mapToDouble(Booking::getTotalAmount)
                .sum());
        
        // 找出收入最高的时间段
        String peakTimeSlot = timeSlotRevenue.entrySet().stream()
                .max(Map.Entry.comparingByValue())
                .map(Map.Entry::getKey)
                .orElse("N/A");
        
        double totalRevenue = currentBookings.stream()
                .mapToDouble(Booking::getTotalAmount)
                .sum();
        
        Map<String, Object> summary = new HashMap<>();
        summary.put("keyMetrics", Arrays.asList(
                Map.of("name", "Total Revenue", "value", String.format("RM %.2f", totalRevenue), "change", "N/A"),
                Map.of("name", "Peak Time Slot", "value", peakTimeSlot, "change", "N/A"),
                Map.of("name", "Peak Hour Revenue", "value", String.format("RM %.2f", timeSlotRevenue.get(peakTimeSlot)), "change", "N/A")
        ));
        summary.put("highlights", Arrays.asList(
                String.format("Total revenue of RM %.2f generated during peak hours", totalRevenue),
                String.format("Peak time slot: %s with RM %.2f revenue", peakTimeSlot, timeSlotRevenue.get(peakTimeSlot)),
                String.format("Evening hours generated the highest revenue at RM %.2f", timeSlotRevenue.get("Evening (6PM-12AM)"))
        ));
        
        Map<String, Object> trends = new HashMap<>();
        trends.put("hourlyRevenue", hourlyRevenue);
        trends.put("timeSlotRevenue", timeSlotRevenue);
        
        Map<String, Object> breakdown = new HashMap<>();
        breakdown.put("hourlyRevenue", hourlyRevenue);
        breakdown.put("timeSlotRevenue", timeSlotRevenue);
        breakdown.put("peakHours", getPeakHours(hourlyRevenue, 5));
        
        Map<String, Object> result = new HashMap<>();
        result.put("summary", summary);
        result.put("trends", trends);
        result.put("breakdown", breakdown);
        result.put("insights", generatePeakHourInsights(totalRevenue, timeSlotRevenue, peakTimeSlot));
        
        return result;
    }

    @Override
    public Map<String, Object> generateTotalRevenueReport(String startDate, String endDate) {
        LocalDate start = LocalDate.parse(startDate);
        LocalDate end = LocalDate.parse(endDate);
        
        // 转换为LocalDateTime
        java.time.LocalDateTime startDateTime = start.atStartOfDay();
        java.time.LocalDateTime endDateTime = end.atTime(23, 59, 59);
        
        // 获取当前期间的预订数据，排除所有取消和待处理的预订
        List<Booking> currentBookings = filterValidBookings(
                bookingRepository.findBookingsByDateRange(startDateTime, endDateTime)
        );
        
        // 获取上一期间的数据用于比较
        long daysDiff = java.time.temporal.ChronoUnit.DAYS.between(start, end);
        LocalDate previousStart = start.minusDays(daysDiff);
        LocalDate previousEnd = start.minusDays(1);
        java.time.LocalDateTime previousStartDateTime = previousStart.atStartOfDay();
        java.time.LocalDateTime previousEndDateTime = previousEnd.atTime(23, 59, 59);
        List<Booking> previousBookings = filterValidBookings(
                bookingRepository.findBookingsByDateRange(previousStartDateTime, previousEndDateTime)
        );
        
        // 计算总收入
        double totalRevenue = currentBookings.stream()
                .mapToDouble(Booking::getTotalAmount)
                .sum();
        
        double previousTotalRevenue = previousBookings.stream()
                .mapToDouble(Booking::getTotalAmount)
                .sum();
        
        double revenueGrowth = previousTotalRevenue > 0 ? ((totalRevenue - previousTotalRevenue) / previousTotalRevenue) * 100 : 0;
        
        // 按状态统计收入
        Map<String, Double> revenueByStatus = currentBookings.stream()
                .collect(Collectors.groupingBy(
                        Booking::getStatus,
                        Collectors.summingDouble(Booking::getTotalAmount)
                ));
        
        // 计算平均订单价值
        double avgOrderValue = currentBookings.isEmpty() ? 0 : totalRevenue / currentBookings.size();
        
        Map<String, Object> summary = new HashMap<>();
        summary.put("keyMetrics", Arrays.asList(
                Map.of("name", "Total Revenue", "value", String.format("RM %.2f", totalRevenue), "change", String.format("%.1f%%", revenueGrowth)),
                Map.of("name", "Average Order Value", "value", String.format("RM %.2f", avgOrderValue), "change", "N/A"),
                Map.of("name", "Total Bookings", "value", String.valueOf(currentBookings.size()), "change", String.format("%.1f%%", calculateChange((long)currentBookings.size(), previousBookings.size())))
        ));
        summary.put("highlights", Arrays.asList(
                String.format("Total revenue of RM %.2f generated during the period", totalRevenue),
                String.format("Average order value: RM %.2f", avgOrderValue),
                String.format("Revenue %s by %.1f%% compared to previous period", revenueGrowth >= 0 ? "increased" : "decreased", Math.abs(revenueGrowth))
        ));
        
        Map<String, Object> trends = new HashMap<>();
        trends.put("totalRevenue", totalRevenue);
        trends.put("revenueByStatus", revenueByStatus);
        
        Map<String, Object> breakdown = new HashMap<>();
        breakdown.put("revenueByStatus", revenueByStatus);
        breakdown.put("revenueGrowth", revenueGrowth);
        
        Map<String, Object> result = new HashMap<>();
        result.put("summary", summary);
        result.put("trends", trends);
        result.put("breakdown", breakdown);
        result.put("insights", generateTotalRevenueInsights(totalRevenue, previousTotalRevenue, currentBookings.size(), (int)previousBookings.size(), avgOrderValue));
        
        return result;
    }

    @Override
    public Map<String, Object> generateGrowthRateReport(String startDate, String endDate) {
        LocalDate start = LocalDate.parse(startDate);
        LocalDate end = LocalDate.parse(endDate);
        
        // 转换为LocalDateTime
        java.time.LocalDateTime startDateTime = start.atStartOfDay();
        java.time.LocalDateTime endDateTime = end.atTime(23, 59, 59);
        
        // 获取当前期间的预订数据，排除所有取消和待处理的预订
        List<Booking> currentBookings = filterValidBookings(
                bookingRepository.findBookingsByDateRange(startDateTime, endDateTime)
        );
        
        // 获取多个历史期间的数据用于趋势分析
        long daysDiff = java.time.temporal.ChronoUnit.DAYS.between(start, end);
        
        // 计算多个期间的增长率
        Map<String, Double> growthRates = new HashMap<>();
        for (int i = 1; i <= 3; i++) {
            LocalDate periodStart = start.minusDays(daysDiff * i);
            LocalDate periodEnd = start.minusDays(daysDiff * (i - 1) + 1);
            java.time.LocalDateTime periodStartDateTime = periodStart.atStartOfDay();
            java.time.LocalDateTime periodEndDateTime = periodEnd.atTime(23, 59, 59);
            
            List<Booking> periodBookings = filterValidBookings(
                    bookingRepository.findBookingsByDateRange(periodStartDateTime, periodEndDateTime)
            );
            
            double periodRevenue = periodBookings.stream()
                    .mapToDouble(Booking::getTotalAmount)
                    .sum();
            
            growthRates.put("Period " + i, periodRevenue);
        }
        
        // 当前期间收入
        double currentRevenue = currentBookings.stream()
                .mapToDouble(Booking::getTotalAmount)
                .sum();
        growthRates.put("Current Period", currentRevenue);
        
        // 计算复合增长率
        double firstPeriodRevenue = growthRates.get("Period 3");
        double compoundGrowthRate = firstPeriodRevenue > 0 ? 
                (Math.pow(currentRevenue / firstPeriodRevenue, 1.0 / 3) - 1) * 100 : 0;
        
        Map<String, Object> summary = new HashMap<>();
        summary.put("keyMetrics", Arrays.asList(
                Map.of("name", "Current Revenue", "value", String.format("RM %.2f", currentRevenue), "change", "N/A"),
                Map.of("name", "Compound Growth Rate", "value", String.format("%.1f%%", compoundGrowthRate), "change", "N/A"),
                Map.of("name", "Periods Analyzed", "value", "4", "change", "N/A")
        ));
        summary.put("highlights", Arrays.asList(
                String.format("Current period revenue: RM %.2f", currentRevenue),
                String.format("Compound annual growth rate: %.1f%%", compoundGrowthRate),
                String.format("Growth trend analysis over %d periods", growthRates.size())
        ));
        
        Map<String, Object> trends = new HashMap<>();
        trends.put("growthRates", growthRates);
        
        Map<String, Object> breakdown = new HashMap<>();
        breakdown.put("growthRates", growthRates);
        breakdown.put("compoundGrowthRate", compoundGrowthRate);
        
        Map<String, Object> result = new HashMap<>();
        result.put("summary", summary);
        result.put("trends", trends);
        result.put("breakdown", breakdown);
        result.put("insights", generateGrowthRateInsights(currentRevenue, compoundGrowthRate, growthRates));
        
        return result;
    }

    @Override
    public Map<String, Object> generateVenueComparisonReport(String startDate, String endDate) {
        LocalDate start = LocalDate.parse(startDate);
        LocalDate end = LocalDate.parse(endDate);
        
        // 转换为LocalDateTime
        java.time.LocalDateTime startDateTime = start.atStartOfDay();
        java.time.LocalDateTime endDateTime = end.atTime(23, 59, 59);
        
        // 获取当前期间的预订数据，排除所有取消和待处理的预订
        List<Booking> currentBookings = filterValidBookings(
                bookingRepository.findBookingsByDateRange(startDateTime, endDateTime)
        );
        
        // 按场地统计收入
        Map<String, Double> venueRevenue = currentBookings.stream()
                .collect(Collectors.groupingBy(
                        booking -> {
                            // Get court name through booking slots
                            return booking.getBookingSlots().stream()
                                    .map(bookingSlot -> bookingSlot.getSlot().getCourtId())
                                    .filter(Objects::nonNull)
                                    .findFirst()
                                    .map(courtId -> {
                                        Court court = courtRepository.findById(courtId).orElse(null);
                                        return court != null ? court.getName() : "Court " + courtId;
                                    })
                                    .orElse("Unknown Court");
                        },
                        Collectors.summingDouble(Booking::getTotalAmount)
                ));
        
        // 按场地统计预订次数
        Map<String, Long> venueBookings = currentBookings.stream()
                .collect(Collectors.groupingBy(
                        booking -> {
                            // Get court name through booking slots
                            return booking.getBookingSlots().stream()
                                    .map(bookingSlot -> bookingSlot.getSlot().getCourtId())
                                    .filter(Objects::nonNull)
                                    .findFirst()
                                    .map(courtId -> {
                                        Court court = courtRepository.findById(courtId).orElse(null);
                                        return court != null ? court.getName() : "Court " + courtId;
                                    })
                                    .orElse("Unknown Court");
                        },
                        Collectors.counting()
                ));
        
        // 计算场地利用率
        Map<String, Double> venueUtilization = new HashMap<>();
        double totalRevenue = currentBookings.stream()
                .mapToDouble(Booking::getTotalAmount)
                .sum();
        
        venueRevenue.forEach((venue, revenue) -> {
            double utilization = totalRevenue > 0 ? (revenue / totalRevenue) * 100 : 0;
            venueUtilization.put(venue, utilization);
        });
        
        // 找出表现最好的场地
        String topVenue = venueRevenue.entrySet().stream()
                .max(Map.Entry.comparingByValue())
                .map(Map.Entry::getKey)
                .orElse("N/A");
        
        Map<String, Object> summary = new HashMap<>();
        summary.put("keyMetrics", Arrays.asList(
                Map.of("name", "Total Revenue", "value", String.format("RM %.2f", totalRevenue), "change", "N/A"),
                Map.of("name", "Top Performing Venue", "value", topVenue, "change", "N/A"),
                Map.of("name", "Venues Analyzed", "value", String.valueOf(venueRevenue.size()), "change", "N/A")
        ));
        summary.put("highlights", Arrays.asList(
                String.format("Total revenue of RM %.2f across all venues", totalRevenue),
                String.format("Top performing venue: %s with RM %.2f revenue", topVenue, venueRevenue.get(topVenue)),
                String.format("Revenue distribution across %d venues", venueRevenue.size())
        ));
        
        Map<String, Object> trends = new HashMap<>();
        trends.put("venueRevenue", venueRevenue);
        trends.put("venueBookings", venueBookings);
        trends.put("venueUtilization", venueUtilization);
        
        Map<String, Object> breakdown = new HashMap<>();
        breakdown.put("venueRevenue", venueRevenue);
        breakdown.put("venueBookings", venueBookings);
        breakdown.put("venueUtilization", venueUtilization);
        breakdown.put("topVenues", getTopVenues(venueRevenue, 5));
        
        Map<String, Object> result = new HashMap<>();
        result.put("summary", summary);
        result.put("trends", trends);
        result.put("breakdown", breakdown);
        result.put("insights", generateVenueComparisonInsights(totalRevenue, venueRevenue, topVenue));
        
        return result;
    }
    
    // 辅助方法
    private double calculateChange(long current, long previous) {
        return previous > 0 ? ((double) (current - previous) / previous) * 100 : 0;
    }
    
    private List<Map<String, Object>> getTopRevenueDays(Map<String, Double> dailyRevenue, int limit) {
        return dailyRevenue.entrySet().stream()
                .sorted(Map.Entry.<String, Double>comparingByValue().reversed())
                .limit(limit)
                .map(entry -> {
                    Map<String, Object> result = new HashMap<>();
                    result.put("date", entry.getKey());
                    result.put("revenue", entry.getValue());
                    return result;
                })
                .collect(Collectors.toList());
    }
    
    private List<Map<String, Object>> getTopBookingDays(Map<String, Long> dailyBookings, int limit) {
        return dailyBookings.entrySet().stream()
                .sorted(Map.Entry.<String, Long>comparingByValue().reversed())
                .limit(limit)
                .map(entry -> {
                    Map<String, Object> result = new HashMap<>();
                    result.put("date", entry.getKey());
                    result.put("bookings", entry.getValue());
                    return result;
                })
                .collect(Collectors.toList());
    }
    
    private List<Map<String, Object>> getTopActiveUsers(Map<String, Long> bookingsPerUser, int limit) {
        return bookingsPerUser.entrySet().stream()
                .sorted(Map.Entry.<String, Long>comparingByValue().reversed())
                .limit(limit)
                .map(entry -> {
                    Map<String, Object> result = new HashMap<>();
                    result.put("user", entry.getKey());
                    result.put("bookings", entry.getValue());
                    return result;
                })
                .collect(Collectors.toList());
    }
    
    private List<String> generateRevenueInsights(double currentRevenue, double previousRevenue, int currentBookings, int previousBookings, double avgOrderValue) {
        List<String> insights = new ArrayList<>();
        
        // 收入趋势洞察
        if (currentRevenue > previousRevenue) {
            insights.add("Revenue is growing compared to the previous period");
        } else if (currentRevenue < previousRevenue) {
            insights.add("Revenue has decreased compared to the previous period");
        } else if (currentRevenue == previousRevenue && currentRevenue > 0) {
            insights.add("Revenue is stable compared to the previous period");
        }
        
        // 平均订单价值洞察
        if (avgOrderValue > 100) {
            insights.add("High average order value (RM " + String.format("%.2f", avgOrderValue) + ") indicates premium customer spending");
        } else if (avgOrderValue > 50) {
            insights.add("Good average order value (RM " + String.format("%.2f", avgOrderValue) + ") shows healthy customer spending");
        } else if (avgOrderValue > 0) {
            insights.add("Average order value (RM " + String.format("%.2f", avgOrderValue) + ") could be improved through upselling");
        }
        
        // 预订量洞察
        if (currentBookings > previousBookings) {
            insights.add("Increased booking volume (" + currentBookings + " vs " + previousBookings + ") contributing to revenue growth");
        } else if (currentBookings < previousBookings) {
            insights.add("Decreased booking volume (" + currentBookings + " vs " + previousBookings + ") affecting revenue");
        } else if (currentBookings == previousBookings && currentBookings > 0) {
            insights.add("Stable booking volume (" + currentBookings + ") maintaining consistent revenue");
        }
        
        // 总体表现洞察
        if (currentRevenue > 0) {
            insights.add("Total revenue of RM " + String.format("%.2f", currentRevenue) + " generated from " + currentBookings + " bookings");
        }
        
        // 如果没有数据，提供指导性洞察
        if (insights.isEmpty()) {
            insights.add("No revenue data available for the selected period");
            insights.add("Consider expanding the date range or checking data availability");
        }
        
        return insights;
    }
    
    private List<String> generateBookingInsights(int currentBookings, int previousBookings, double completionRate, double cancellationRate) {
        List<String> insights = new ArrayList<>();
        
        // 预订量趋势洞察
        if (currentBookings > previousBookings) {
            insights.add("Booking volume is increasing (" + currentBookings + " vs " + previousBookings + " in previous period)");
        } else if (currentBookings < previousBookings) {
            insights.add("Booking volume has decreased (" + currentBookings + " vs " + previousBookings + " in previous period)");
        } else if (currentBookings == previousBookings && currentBookings > 0) {
            insights.add("Booking volume is stable (" + currentBookings + " bookings)");
        }
        
        // 完成率洞察
        if (completionRate >= 90) {
            insights.add("Excellent completion rate (" + String.format("%.1f", completionRate) + "%) indicates high customer satisfaction");
        } else if (completionRate >= 80) {
            insights.add("Good completion rate (" + String.format("%.1f", completionRate) + "%) shows reliable service delivery");
        } else if (completionRate >= 70) {
            insights.add("Completion rate (" + String.format("%.1f", completionRate) + "%) could be improved through better service");
        } else if (completionRate > 0) {
            insights.add("Low completion rate (" + String.format("%.1f", completionRate) + "%) needs immediate attention");
        }
        
        // 取消率洞察
        if (cancellationRate <= 5) {
            insights.add("Very low cancellation rate (" + String.format("%.1f", cancellationRate) + "%) shows strong customer commitment");
        } else if (cancellationRate <= 10) {
            insights.add("Low cancellation rate (" + String.format("%.1f", cancellationRate) + "%) indicates good planning");
        } else if (cancellationRate <= 20) {
            insights.add("Moderate cancellation rate (" + String.format("%.1f", cancellationRate) + "%) - consider improving booking policies");
        } else if (cancellationRate > 20) {
            insights.add("High cancellation rate (" + String.format("%.1f", cancellationRate) + "%) may need policy review");
        }
        
        // 总体表现洞察
        if (currentBookings > 0) {
            insights.add("Total of " + currentBookings + " bookings processed during the period");
        }
        
        // 如果没有数据，提供指导性洞察
        if (insights.isEmpty()) {
            insights.add("No booking data available for the selected period");
            insights.add("Consider expanding the date range or checking data availability");
        }
        
        return insights;
    }
    
    private List<String> generateUserInsights(long totalUsers, long activeUsers, long newUsers, double activeUserRate) {
        List<String> insights = new ArrayList<>();
        
        // 用户参与度洞察
        if (activeUserRate >= 70) {
            insights.add("Excellent user engagement rate (" + String.format("%.1f", activeUserRate) + "%) indicates strong platform adoption");
        } else if (activeUserRate >= 50) {
            insights.add("High user engagement rate (" + String.format("%.1f", activeUserRate) + "%) shows good platform usage");
        } else if (activeUserRate >= 30) {
            insights.add("Moderate user engagement rate (" + String.format("%.1f", activeUserRate) + "%) - consider engagement strategies");
        } else if (activeUserRate > 0) {
            insights.add("Low user engagement rate (" + String.format("%.1f", activeUserRate) + "%) needs improvement");
        }
        
        // 新用户洞察
        if (newUsers > 0) {
            insights.add("New user acquisition is active (" + newUsers + " new users during the period)");
            if (newUsers > totalUsers * 0.1) {
                insights.add("Strong new user growth rate (" + String.format("%.1f", (double)newUsers/totalUsers*100) + "%)");
            }
        } else {
            insights.add("No new user acquisition during the period - consider marketing strategies");
        }
        
        // 用户保留洞察
        if (activeUsers > totalUsers * 0.5) {
            insights.add("Excellent user retention rate (" + String.format("%.1f", (double)activeUsers/totalUsers*100) + "%)");
        } else if (activeUsers > totalUsers * 0.3) {
            insights.add("Good user retention rate (" + String.format("%.1f", (double)activeUsers/totalUsers*100) + "%)");
        } else if (activeUsers > 0) {
            insights.add("User retention rate (" + String.format("%.1f", (double)activeUsers/totalUsers*100) + "%) could be improved");
        }
        
        // 总体用户洞察
        if (totalUsers > 0) {
            insights.add("Total of " + totalUsers + " registered users with " + activeUsers + " active users");
        }
        
        // 如果没有数据，提供指导性洞察
        if (insights.isEmpty()) {
            insights.add("No user data available for the selected period");
            insights.add("Consider expanding the date range or checking data availability");
        }
        
        return insights;
    }

    // New specialized report implementations
    private List<String> generateMonthlyRevenueInsights(double currentRevenue, double previousRevenue, int currentBookings, int previousBookings, double avgMonthlyRevenue) {
        List<String> insights = new ArrayList<>();
        
        // 收入趋势洞察
        if (currentRevenue > previousRevenue) {
            insights.add("Revenue is growing compared to the previous period");
        } else if (currentRevenue < previousRevenue) {
            insights.add("Revenue has decreased compared to the previous period");
        } else if (currentRevenue == previousRevenue && currentRevenue > 0) {
            insights.add("Revenue is stable compared to the previous period");
        }
        
        // 平均月收入洞察
        if (avgMonthlyRevenue > 1000) {
            insights.add("High average monthly revenue (RM " + String.format("%.2f", avgMonthlyRevenue) + ") indicates strong platform performance");
        } else if (avgMonthlyRevenue > 500) {
            insights.add("Good average monthly revenue (RM " + String.format("%.2f", avgMonthlyRevenue) + ") shows healthy platform growth");
        } else if (avgMonthlyRevenue > 0) {
            insights.add("Average monthly revenue (RM " + String.format("%.2f", avgMonthlyRevenue) + ") could be improved through better marketing or service offerings");
        }
        
        // 预订量洞察
        if (currentBookings > previousBookings) {
            insights.add("Increased booking volume (" + currentBookings + " vs " + previousBookings + ") contributing to revenue growth");
        } else if (currentBookings < previousBookings) {
            insights.add("Decreased booking volume (" + currentBookings + " vs " + previousBookings + ") affecting revenue");
        } else if (currentBookings == previousBookings && currentBookings > 0) {
            insights.add("Stable booking volume (" + currentBookings + ") maintaining consistent revenue");
        }
        
        // 总体表现洞察
        if (currentRevenue > 0) {
            insights.add("Total revenue of RM " + String.format("%.2f", currentRevenue) + " generated from " + currentBookings + " bookings");
        }
        
        // 如果没有数据，提供指导性洞察
        if (insights.isEmpty()) {
            insights.add("No revenue data available for the selected period");
            insights.add("Consider expanding the date range or checking data availability");
        }
        
        return insights;
    }

    private List<String> generatePeakHourInsights(double totalRevenue, Map<String, Double> timeSlotRevenue, String peakTimeSlot) {
        List<String> insights = new ArrayList<>();
        
        // 收入洞察
        if (totalRevenue > 0) {
            insights.add("Total revenue of RM " + String.format("%.2f", totalRevenue) + " generated during peak hours");
        }
        
        // 高峰时段洞察
        if (peakTimeSlot.equals("Evening (6PM-12AM)")) {
            insights.add("Evening hours (6PM-12AM) generated the highest revenue at RM " + String.format("%.2f", timeSlotRevenue.get("Evening (6PM-12AM)")));
        } else if (peakTimeSlot.equals("Afternoon (12PM-6PM)")) {
            insights.add("Afternoon hours (12PM-6PM) generated the highest revenue at RM " + String.format("%.2f", timeSlotRevenue.get("Afternoon (12PM-6PM)")));
        } else if (peakTimeSlot.equals("Morning (6AM-12PM)")) {
            insights.add("Morning hours (6AM-12PM) generated the highest revenue at RM " + String.format("%.2f", timeSlotRevenue.get("Morning (6AM-12PM)")));
        }
        
        // 如果没有数据，提供指导性洞察
        if (insights.isEmpty()) {
            insights.add("No peak hour data available for the selected period");
            insights.add("Consider expanding the date range or checking data availability");
        }
        
        return insights;
    }

    private List<String> generateTotalRevenueInsights(double currentRevenue, double previousRevenue, int currentBookings, int previousBookings, double avgOrderValue) {
        List<String> insights = new ArrayList<>();
        
        // 收入趋势洞察
        if (currentRevenue > previousRevenue) {
            insights.add("Revenue is growing compared to the previous period");
        } else if (currentRevenue < previousRevenue) {
            insights.add("Revenue has decreased compared to the previous period");
        } else if (currentRevenue == previousRevenue && currentRevenue > 0) {
            insights.add("Revenue is stable compared to the previous period");
        }
        
        // 平均订单价值洞察
        if (avgOrderValue > 100) {
            insights.add("High average order value (RM " + String.format("%.2f", avgOrderValue) + ") indicates premium customer spending");
        } else if (avgOrderValue > 50) {
            insights.add("Good average order value (RM " + String.format("%.2f", avgOrderValue) + ") shows healthy customer spending");
        } else if (avgOrderValue > 0) {
            insights.add("Average order value (RM " + String.format("%.2f", avgOrderValue) + ") could be improved through upselling");
        }
        
        // 预订量洞察
        if (currentBookings > previousBookings) {
            insights.add("Increased booking volume (" + currentBookings + " vs " + previousBookings + ") contributing to revenue growth");
        } else if (currentBookings < previousBookings) {
            insights.add("Decreased booking volume (" + currentBookings + " vs " + previousBookings + ") affecting revenue");
        } else if (currentBookings == previousBookings && currentBookings > 0) {
            insights.add("Stable booking volume (" + currentBookings + ") maintaining consistent revenue");
        }
        
        // 总体表现洞察
        if (currentRevenue > 0) {
            insights.add("Total revenue of RM " + String.format("%.2f", currentRevenue) + " generated from " + currentBookings + " bookings");
        }
        
        // 如果没有数据，提供指导性洞察
        if (insights.isEmpty()) {
            insights.add("No revenue data available for the selected period");
            insights.add("Consider expanding the date range or checking data availability");
        }
        
        return insights;
    }

    private List<String> generateGrowthRateInsights(double currentRevenue, double compoundGrowthRate, Map<String, Double> growthRates) {
        List<String> insights = new ArrayList<>();
        
        // 复合增长率洞察
        if (compoundGrowthRate > 0) {
            insights.add("Compound annual growth rate of " + String.format("%.1f%%", compoundGrowthRate) + " indicates strong platform expansion");
        } else if (compoundGrowthRate < 0) {
            insights.add("Compound annual growth rate of " + String.format("%.1f%%", compoundGrowthRate) + " indicates a decline in platform performance");
        } else {
            insights.add("Compound annual growth rate is stable at 0%");
        }
        
        // 当前期间收入洞察
        if (currentRevenue > 0) {
            insights.add("Current period revenue: RM " + String.format("%.2f", currentRevenue));
        }
        
        // 历史期间收入洞察
        if (!growthRates.isEmpty()) {
            insights.add("Growth trend analysis over " + growthRates.size() + " periods");
            for (Map.Entry<String, Double> entry : growthRates.entrySet()) {
                insights.add("Period " + entry.getKey() + ": RM " + String.format("%.2f", entry.getValue()));
            }
        }
        
        // 如果没有数据，提供指导性洞察
        if (insights.isEmpty()) {
            insights.add("No growth rate data available for the selected period");
            insights.add("Consider expanding the date range or checking data availability");
        }
        
        return insights;
    }

    private List<String> generateVenueComparisonInsights(double totalRevenue, Map<String, Double> venueRevenue, String topVenue) {
        List<String> insights = new ArrayList<>();
        
        // 总收入洞察
        if (totalRevenue > 0) {
            insights.add("Total revenue of RM " + String.format("%.2f", totalRevenue) + " across all venues");
        }
        
        // 表现最好的场地洞察
        if (topVenue != null && !topVenue.equals("N/A")) {
            insights.add("Top performing venue: " + topVenue + " with RM " + String.format("%.2f", venueRevenue.get(topVenue)) + " revenue");
        }
        
        // 场地数量洞察
        if (venueRevenue.size() > 0) {
            insights.add("Revenue distribution across " + venueRevenue.size() + " venues");
        }
        
        // 如果没有数据，提供指导性洞察
        if (insights.isEmpty()) {
            insights.add("No venue data available for the selected period");
            insights.add("Consider expanding the date range or checking data availability");
        }
        
        return insights;
    }
    
    // Helper methods for new specialized reports
    private List<Map<String, Object>> getTopRevenueMonths(Map<String, Double> monthlyRevenue, int limit) {
        return monthlyRevenue.entrySet().stream()
                .sorted(Map.Entry.<String, Double>comparingByValue().reversed())
                .limit(limit)
                .map(entry -> {
                    Map<String, Object> result = new HashMap<>();
                    result.put("month", entry.getKey());
                    result.put("revenue", entry.getValue());
                    return result;
                })
                .collect(Collectors.toList());
    }
    
    private List<Map<String, Object>> getPeakHours(Map<String, Double> hourlyRevenue, int limit) {
        return hourlyRevenue.entrySet().stream()
                .sorted(Map.Entry.<String, Double>comparingByValue().reversed())
                .limit(limit)
                .map(entry -> {
                    Map<String, Object> result = new HashMap<>();
                    result.put("hour", entry.getKey());
                    result.put("revenue", entry.getValue());
                    return result;
                })
                .collect(Collectors.toList());
    }
    
    private List<Map<String, Object>> getTopVenues(Map<String, Double> venueRevenue, int limit) {
        return venueRevenue.entrySet().stream()
                .sorted(Map.Entry.<String, Double>comparingByValue().reversed())
                .limit(limit)
                .map(entry -> {
                    Map<String, Object> result = new HashMap<>();
                    result.put("venue", entry.getKey());
                    result.put("revenue", entry.getValue());
                    return result;
                })
                .collect(Collectors.toList());
    }

    @Override
    public Map<String, Object> generateVenueUtilizationReport(String startDate, String endDate) {
        LocalDate start = LocalDate.parse(startDate);
        LocalDate end = LocalDate.parse(endDate);
        
        // 转换为LocalDateTime
        java.time.LocalDateTime startDateTime = start.atStartOfDay();
        java.time.LocalDateTime endDateTime = end.atTime(23, 59, 59);
        
        // 获取当前期间的预订数据，排除所有取消和待处理的预订
        List<Booking> currentBookings = filterValidBookings(
                bookingRepository.findBookingsByDateRange(startDateTime, endDateTime)
        );
        
        // 获取所有活跃场地（排除 DELETED, MAINTENANCE, INACTIVE 状态的场地）
        List<Court> allCourts = courtRepository.findActiveCourts();
        
        // 计算场地利用率
        Map<String, Object> venueUtilizationDetails = new HashMap<>();
        Map<String, Double> utilizationTrend = new HashMap<>();
        Map<String, Double> utilizationStats = new HashMap<>();
        
        for (Court court : allCourts) {
            // 计算该场地的预订小时数
            long bookedHours = currentBookings.stream()
                    .filter(booking -> booking.getBookingSlots().stream()
                            .anyMatch(bookingSlot -> bookingSlot.getSlot().getCourtId().equals(court.getId())))
                    .count() * 2; // 假设每个预订是2小时
            
            // 计算总可用小时数（期间天数 * 24小时）
            long totalDays = java.time.temporal.ChronoUnit.DAYS.between(start, end) + 1;
            long totalHours = totalDays * 24;
            
            // 计算利用率
            double utilizationRate = totalHours > 0 ? (double) bookedHours / totalHours * 100 : 0;
            
            // 添加到详细数据
            Map<String, Object> courtData = new HashMap<>();
            courtData.put("utilizationRate", Math.round(utilizationRate * 100.0) / 100.0);
            courtData.put("totalHours", totalHours);
            courtData.put("bookedHours", bookedHours);
            venueUtilizationDetails.put(court.getName(), courtData);
            
            // 添加到趋势数据（按场地名称）
            String dateKey = court.getName() != null ? court.getName() : "Unknown Court";
            utilizationTrend.put(dateKey, utilizationRate);
            
            // 添加到统计数据
            utilizationStats.put(court.getName(), utilizationRate);
        }
        
        // 计算整体利用率
        double overallUtilization = venueUtilizationDetails.values().stream()
                .mapToDouble(data -> (Double) ((Map<String, Object>) data).get("utilizationRate"))
                .average()
                .orElse(0.0);
        
        Map<String, Object> summary = new HashMap<>();
        summary.put("keyMetrics", Arrays.asList(
                Map.of("name", "Overall Utilization Rate", "value", String.format("%.1f%%", overallUtilization), "change", "N/A"),
                Map.of("name", "Total Courts", "value", String.valueOf(allCourts.size()), "change", "N/A"),
                Map.of("name", "Active Courts", "value", String.valueOf(venueUtilizationDetails.size()), "change", "N/A")
        ));
        summary.put("highlights", Arrays.asList(
                String.format("Overall court utilization rate: %.1f%%", overallUtilization),
                String.format("Analysis covers %d courts", allCourts.size()),
                String.format("Data period: %s to %s", startDate, endDate)
        ));
        
        Map<String, Object> trends = new HashMap<>();
        trends.put("utilizationTrend", utilizationTrend);
        trends.put("utilizationStats", utilizationStats);
        trends.put("venueUtilization", venueUtilizationDetails.entrySet().stream()
                .collect(Collectors.toMap(
                        Map.Entry::getKey,
                        entry -> ((Map<String, Object>) entry.getValue()).get("utilizationRate")
                )));
        
        Map<String, Object> breakdown = new HashMap<>();
        breakdown.put("venueUtilizationDetails", venueUtilizationDetails);
        
        Map<String, Object> result = new HashMap<>();
        result.put("summary", summary);
        result.put("trends", trends);
        result.put("breakdown", breakdown);
        result.put("insights", generateVenueUtilizationInsights(overallUtilization, allCourts.size(), venueUtilizationDetails));
        
        return result;
    }

    @Override
    public Map<String, Object> generateVenueRankingReport(String startDate, String endDate) {
        LocalDate start = LocalDate.parse(startDate);
        LocalDate end = LocalDate.parse(endDate);
        
        // 转换为LocalDateTime
        java.time.LocalDateTime startDateTime = start.atStartOfDay();
        java.time.LocalDateTime endDateTime = end.atTime(23, 59, 59);
        
        // 获取当前期间的预订数据，排除所有取消和待处理的预订
        List<Booking> currentBookings = filterValidBookings(
                bookingRepository.findBookingsByDateRange(startDateTime, endDateTime)
        );
        
        // 获取所有活跃场地（排除 DELETED, MAINTENANCE, INACTIVE 状态的场地）
        List<Court> allCourts = courtRepository.findActiveCourts();
        
        // 计算场地排名数据
        Map<String, Double> venueRanking = new HashMap<>();
        Map<String, Object> venueRankingDetails = new HashMap<>();
        
        for (Court court : allCourts) {
            // 计算该场地的预订小时数
            long bookedHours = currentBookings.stream()
                    .filter(booking -> booking.getBookingSlots().stream()
                            .anyMatch(bookingSlot -> bookingSlot.getSlot().getCourtId().equals(court.getId())))
                    .count() * 2; // 假设每个预订是2小时
            
            // 计算总可用小时数
            long totalDays = java.time.temporal.ChronoUnit.DAYS.between(start, end) + 1;
            long totalHours = totalDays * 24;
            
            // 计算利用率
            double utilizationRate = totalHours > 0 ? (double) bookedHours / totalHours * 100 : 0;
            
            // 计算性能评分（基于利用率和预订数量）
            double performanceScore = utilizationRate * 0.7 + (bookedHours * 0.3);
            
            venueRanking.put(court.getName(), utilizationRate);
            
            Map<String, Object> courtData = new HashMap<>();
            courtData.put("utilizationRate", Math.round(utilizationRate * 100.0) / 100.0);
            courtData.put("performanceScore", Math.round(performanceScore * 100.0) / 100.0);
            courtData.put("bookedHours", bookedHours);
            courtData.put("totalHours", totalHours);
            venueRankingDetails.put(court.getName(), courtData);
        }
        
        // 按利用率排序
        Map<String, Double> sortedRanking = venueRanking.entrySet().stream()
                .sorted(Map.Entry.<String, Double>comparingByValue().reversed())
                .collect(Collectors.toMap(
                        Map.Entry::getKey,
                        Map.Entry::getValue,
                        (e1, e2) -> e1,
                        LinkedHashMap::new
                ));
        
        Map<String, Object> summary = new HashMap<>();
        summary.put("keyMetrics", Arrays.asList(
                Map.of("name", "Top Performing Court", "value", sortedRanking.keySet().iterator().next(), "change", "N/A"),
                Map.of("name", "Average Utilization", "value", String.format("%.1f%%", sortedRanking.values().stream().mapToDouble(Double::doubleValue).average().orElse(0.0)), "change", "N/A"),
                Map.of("name", "Total Courts Ranked", "value", String.valueOf(sortedRanking.size()), "change", "N/A")
        ));
        summary.put("highlights", Arrays.asList(
                String.format("Top performing court: %s", sortedRanking.keySet().iterator().next()),
                String.format("Average utilization rate: %.1f%%", sortedRanking.values().stream().mapToDouble(Double::doubleValue).average().orElse(0.0)),
                String.format("Ranking based on utilization and performance metrics")
        ));
        
        Map<String, Object> trends = new HashMap<>();
        trends.put("venueRanking", sortedRanking);
        trends.put("venuePerformance", venueRankingDetails.entrySet().stream()
                .collect(Collectors.toMap(
                        Map.Entry::getKey,
                        entry -> ((Map<String, Object>) entry.getValue()).get("performanceScore")
                )));
        
        Map<String, Object> breakdown = new HashMap<>();
        breakdown.put("venueRankingDetails", venueRankingDetails);
        
        Map<String, Object> result = new HashMap<>();
        result.put("summary", summary);
        result.put("trends", trends);
        result.put("breakdown", breakdown);
        result.put("insights", generateVenueRankingInsights(sortedRanking, venueRankingDetails));
        
        return result;
    }

    @Override
    public Map<String, Object> generatePeakOffPeakReport(String startDate, String endDate) {
        LocalDate start = LocalDate.parse(startDate);
        LocalDate end = LocalDate.parse(endDate);
        
        // 转换为LocalDateTime
        java.time.LocalDateTime startDateTime = start.atStartOfDay();
        java.time.LocalDateTime endDateTime = end.atTime(23, 59, 59);
        
        // 获取当前期间的预订数据，排除所有取消和待处理的预订
        List<Booking> currentBookings = filterValidBookings(
                bookingRepository.findBookingsByDateRange(startDateTime, endDateTime)
        );
        
        // 定义高峰和非高峰时段
        Map<String, Double> peakUtilization = new HashMap<>();
        Map<String, Double> offPeakUtilization = new HashMap<>();
        Map<String, Double> peakVsOffPeak = new HashMap<>();
        
        // 按小时统计预订
        Map<Integer, Long> hourlyBookings = currentBookings.stream()
                .collect(Collectors.groupingBy(
                        booking -> booking.getBookingDate().getHour(),
                        Collectors.counting()
                ));
        
        // 计算高峰时段（18:00-22:00）和非高峰时段（6:00-18:00）
        long peakBookings = hourlyBookings.entrySet().stream()
                .filter(entry -> entry.getKey() >= 18 && entry.getKey() <= 22)
                .mapToLong(Map.Entry::getValue)
                .sum();
        
        long offPeakBookings = hourlyBookings.entrySet().stream()
                .filter(entry -> entry.getKey() >= 6 && entry.getKey() < 18)
                .mapToLong(Map.Entry::getValue)
                .sum();
        
        // 计算利用率
        long totalDays = java.time.temporal.ChronoUnit.DAYS.between(start, end) + 1;
        long peakHours = totalDays * 4; // 4小时高峰时段
        long offPeakHours = totalDays * 12; // 12小时非高峰时段
        
        double peakUtilizationRate = peakHours > 0 ? (double) peakBookings / peakHours * 100 : 0;
        double offPeakUtilizationRate = offPeakHours > 0 ? (double) offPeakBookings / offPeakHours * 100 : 0;
        
        peakUtilization.put("Peak Hours (18:00-22:00)", peakUtilizationRate);
        offPeakUtilization.put("Off-Peak Hours (6:00-18:00)", offPeakUtilizationRate);
        peakVsOffPeak.put("Peak Period", peakUtilizationRate);
        peakVsOffPeak.put("Off-Peak Period", offPeakUtilizationRate);
        
        Map<String, Object> summary = new HashMap<>();
        summary.put("keyMetrics", Arrays.asList(
                Map.of("name", "Peak Utilization", "value", String.format("%.1f%%", peakUtilizationRate), "change", "N/A"),
                Map.of("name", "Off-Peak Utilization", "value", String.format("%.1f%%", offPeakUtilizationRate), "change", "N/A"),
                Map.of("name", "Utilization Difference", "value", String.format("%.1f%%", Math.abs(peakUtilizationRate - offPeakUtilizationRate)), "change", "N/A")
        ));
        summary.put("highlights", Arrays.asList(
                String.format("Peak period utilization: %.1f%%", peakUtilizationRate),
                String.format("Off-peak period utilization: %.1f%%", offPeakUtilizationRate),
                String.format("Peak vs off-peak difference: %.1f%%", Math.abs(peakUtilizationRate - offPeakUtilizationRate))
        ));
        
        Map<String, Object> trends = new HashMap<>();
        trends.put("peakUtilization", peakUtilization);
        trends.put("offPeakUtilization", offPeakUtilization);
        trends.put("peakVsOffPeak", peakVsOffPeak);
        
        Map<String, Object> breakdown = new HashMap<>();
        breakdown.put("peakPeriodDetails", peakUtilization);
        breakdown.put("offPeakPeriodDetails", offPeakUtilization);
        
        Map<String, Object> result = new HashMap<>();
        result.put("summary", summary);
        result.put("trends", trends);
        result.put("breakdown", breakdown);
        result.put("insights", generatePeakOffPeakInsights(peakUtilizationRate, offPeakUtilizationRate));
        
        return result;
    }

    @Override
    public Map<String, Object> generateVenueTypePreferenceReport(String startDate, String endDate) {
        LocalDate start = LocalDate.parse(startDate);
        LocalDate end = LocalDate.parse(endDate);
        
        // 转换为LocalDateTime
        java.time.LocalDateTime startDateTime = start.atStartOfDay();
        java.time.LocalDateTime endDateTime = end.atTime(23, 59, 59);
        
        // 获取当前期间的预订数据，排除所有取消和待处理的预订
        List<Booking> currentBookings = filterValidBookings(
                bookingRepository.findBookingsByDateRange(startDateTime, endDateTime)
        );
        
        // 获取所有活跃场地（排除 DELETED, MAINTENANCE, INACTIVE 状态的场地）
        List<Court> allCourts = courtRepository.findActiveCourts();
        
        // 按场地类型统计
        Map<String, Long> venueTypeBookings = new HashMap<>();
        Map<String, Double> venueTypeUtilization = new HashMap<>();
        Map<String, Object> venueTypePreferenceDetails = new HashMap<>();
        
        // 初始化场地类型
        venueTypeBookings.put("VIP", 0L);
        venueTypeBookings.put("STANDARD", 0L);
        venueTypeBookings.put("OTHER", 0L);
        
        for (Court court : allCourts) {
            String courtType = court.getCourtType() != null ? court.getCourtType().name() : "OTHER";
            
            // 计算该场地的预订数量
            long bookings = currentBookings.stream()
                    .filter(booking -> booking.getBookingSlots().stream()
                            .anyMatch(bookingSlot -> bookingSlot.getSlot().getCourtId().equals(court.getId())))
                    .count();
            
            venueTypeBookings.put(courtType, venueTypeBookings.get(courtType) + bookings);
        }
        
        // 计算利用率
        long totalDays = java.time.temporal.ChronoUnit.DAYS.between(start, end) + 1;
        long totalHours = totalDays * 24;
        
        for (Map.Entry<String, Long> entry : venueTypeBookings.entrySet()) {
            String courtType = entry.getKey();
            long bookings = entry.getValue();
            double utilizationRate = totalHours > 0 ? (double) bookings / totalHours * 100 : 0;
            
            venueTypeUtilization.put(courtType, utilizationRate);
            
            Map<String, Object> typeData = new HashMap<>();
            typeData.put("bookingCount", bookings);
            typeData.put("utilizationRate", Math.round(utilizationRate * 100.0) / 100.0);
            typeData.put("averageRating", 4.5); // 默认评分，实际应该从数据库获取
            venueTypePreferenceDetails.put(courtType, typeData);
        }
        
        // 计算偏好分布
        long totalBookings = venueTypeBookings.values().stream().mapToLong(Long::longValue).sum();
        Map<String, Double> venueTypePreference = venueTypeBookings.entrySet().stream()
                .collect(Collectors.toMap(
                        Map.Entry::getKey,
                        entry -> totalBookings > 0 ? (double) entry.getValue() / totalBookings * 100 : 0
                ));
        
        Map<String, Object> summary = new HashMap<>();
        summary.put("keyMetrics", Arrays.asList(
                Map.of("name", "Most Popular Type", "value", venueTypePreference.entrySet().stream().max(Map.Entry.comparingByValue()).map(Map.Entry::getKey).orElse("N/A"), "change", "N/A"),
                Map.of("name", "Total Bookings", "value", String.valueOf(totalBookings), "change", "N/A"),
                Map.of("name", "Court Types", "value", String.valueOf(venueTypePreference.size()), "change", "N/A")
        ));
        summary.put("highlights", Arrays.asList(
                String.format("Most popular court type: %s", venueTypePreference.entrySet().stream().max(Map.Entry.comparingByValue()).map(Map.Entry::getKey).orElse("N/A")),
                String.format("Total bookings across all types: %d", totalBookings),
                String.format("Analysis covers %d court types", venueTypePreference.size())
        ));
        
        Map<String, Object> trends = new HashMap<>();
        trends.put("venueTypePreference", venueTypePreference);
        trends.put("venueTypeUtilization", venueTypeUtilization);
        trends.put("venueTypeTrend", venueTypeBookings.entrySet().stream()
                .collect(Collectors.toMap(
                        Map.Entry::getKey,
                        entry -> (double) entry.getValue()
                )));
        
        Map<String, Object> breakdown = new HashMap<>();
        breakdown.put("venueTypePreferenceDetails", venueTypePreferenceDetails);
        
        Map<String, Object> result = new HashMap<>();
        result.put("summary", summary);
        result.put("trends", trends);
        result.put("breakdown", breakdown);
        result.put("insights", generateVenueTypePreferenceInsights(venueTypePreference, totalBookings));
        
        return result;
    }

    // Helper methods for insights generation
    private List<String> generateVenueUtilizationInsights(double overallUtilization, int totalCourts, Map<String, Object> venueUtilizationDetails) {
        List<String> insights = new ArrayList<>();
        insights.add(String.format("Overall court utilization is %.1f%%, indicating %s", overallUtilization, 
                overallUtilization > 70 ? "high demand" : overallUtilization > 50 ? "moderate demand" : "low demand"));
        insights.add(String.format("Analysis covers %d courts with varying utilization rates", totalCourts));
        insights.add("Consider optimizing court availability based on utilization patterns");
        return insights;
    }

    private List<String> generateVenueRankingInsights(Map<String, Double> sortedRanking, Map<String, Object> venueRankingDetails) {
        List<String> insights = new ArrayList<>();
        if (!sortedRanking.isEmpty()) {
            String topCourt = sortedRanking.keySet().iterator().next();
            double topUtilization = sortedRanking.values().iterator().next();
            insights.add(String.format("Top performing court: %s with %.1f%% utilization", topCourt, topUtilization));
        }
        insights.add("Performance ranking helps identify high-demand courts for expansion");
        insights.add("Consider maintenance scheduling during low-utilization periods");
        return insights;
    }

    private List<String> generatePeakOffPeakInsights(double peakUtilization, double offPeakUtilization) {
        List<String> insights = new ArrayList<>();
        insights.add(String.format("Peak period utilization (%.1f%%) is %s than off-peak (%.1f%%)", 
                peakUtilization, peakUtilization > offPeakUtilization ? "higher" : "lower", offPeakUtilization));
        insights.add("Consider promotional pricing for off-peak hours to increase utilization");
        insights.add("Peak hours may require additional staff and resources");
        return insights;
    }

    private List<String> generateVenueTypePreferenceInsights(Map<String, Double> venueTypePreference, long totalBookings) {
        List<String> insights = new ArrayList<>();
        String mostPopular = venueTypePreference.entrySet().stream().max(Map.Entry.comparingByValue()).map(Map.Entry::getKey).orElse("N/A");
        insights.add(String.format("Most popular court type: %s", mostPopular));
        insights.add(String.format("Total bookings: %d across all court types", totalBookings));
        insights.add("Consider expanding the most popular court type to meet demand");
        return insights;
    }
} 