package com.pickleball_backend.pickleball.service;

import com.pickleball_backend.pickleball.entity.Booking;
import com.pickleball_backend.pickleball.entity.Member;
import com.pickleball_backend.pickleball.entity.User;
import com.pickleball_backend.pickleball.repository.BookingRepository;
import com.pickleball_backend.pickleball.repository.MemberRepository;
import com.pickleball_backend.pickleball.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ReportServiceImpl implements ReportService {

    private final BookingRepository bookingRepository;
    private final MemberRepository memberRepository;
    private final UserRepository userRepository;

    @Override
    public Map<String, Object> generateRevenueReport(String startDate, String endDate) {
        LocalDate start = LocalDate.parse(startDate);
        LocalDate end = LocalDate.parse(endDate);
        
        // 转换为LocalDateTime
        java.time.LocalDateTime startDateTime = start.atStartOfDay();
        java.time.LocalDateTime endDateTime = end.atTime(23, 59, 59);
        
        // 获取当前期间的预订数据
        List<Booking> currentBookings = bookingRepository.findBookingsByDateRange(startDateTime, endDateTime);
        
        // 获取上一期间的数据用于比较
        long daysDiff = java.time.temporal.ChronoUnit.DAYS.between(start, end);
        LocalDate previousStart = start.minusDays(daysDiff);
        LocalDate previousEnd = start.minusDays(1);
        java.time.LocalDateTime previousStartDateTime = previousStart.atStartOfDay();
        java.time.LocalDateTime previousEndDateTime = previousEnd.atTime(23, 59, 59);
        List<Booking> previousBookings = bookingRepository.findBookingsByDateRange(previousStartDateTime, previousEndDateTime);
        
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
                String.format("Total revenue of RM %.2f generated during the period", currentRevenue),
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
        
        // 获取当前期间的预订数据
        List<Booking> currentBookings = bookingRepository.findBookingsByDateRange(startDateTime, endDateTime);
        
        // 获取上一期间的数据用于比较
        long daysDiff = java.time.temporal.ChronoUnit.DAYS.between(start, end);
        LocalDate previousStart = start.minusDays(daysDiff);
        LocalDate previousEnd = start.minusDays(1);
        java.time.LocalDateTime previousStartDateTime = previousStart.atStartOfDay();
        java.time.LocalDateTime previousEndDateTime = previousEnd.atTime(23, 59, 59);
        List<Booking> previousBookings = bookingRepository.findBookingsByDateRange(previousStartDateTime, previousEndDateTime);
        
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
        
        // 获取当前期间有预订的用户
        List<Booking> currentBookings = bookingRepository.findBookingsByDateRange(startDateTime, endDateTime);
        Set<Integer> activeUserIds = currentBookings.stream()
                .map(booking -> booking.getMember().getUser().getId())
                .collect(Collectors.toSet());
        
        // 获取上一期间有预订的用户
        long daysDiff = java.time.temporal.ChronoUnit.DAYS.between(start, end);
        LocalDate previousStart = start.minusDays(daysDiff);
        LocalDate previousEnd = start.minusDays(1);
        java.time.LocalDateTime previousStartDateTime = previousStart.atStartOfDay();
        java.time.LocalDateTime previousEndDateTime = previousEnd.atTime(23, 59, 59);
        List<Booking> previousBookings = bookingRepository.findBookingsByDateRange(previousStartDateTime, previousEndDateTime);
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
} 