package com.pickleball_backend.pickleball.dto;

public class DashboardSummaryDto {
    private long totalUsers;
    private long totalBookings;
    private double totalRevenue;
    private double averageRating;
    private double totalUsersChange;
    private double totalBookingsChange;
    private double totalRevenueChange;
    private double averageRatingChange;

    public long getTotalUsers() { return totalUsers; }
    public void setTotalUsers(long totalUsers) { this.totalUsers = totalUsers; }
    public long getTotalBookings() { return totalBookings; }
    public void setTotalBookings(long totalBookings) { this.totalBookings = totalBookings; }
    public double getTotalRevenue() { return totalRevenue; }
    public void setTotalRevenue(double totalRevenue) { this.totalRevenue = totalRevenue; }
    public double getAverageRating() { return averageRating; }
    public void setAverageRating(double averageRating) { this.averageRating = averageRating; }
    public double getTotalUsersChange() { return totalUsersChange; }
    public void setTotalUsersChange(double totalUsersChange) { this.totalUsersChange = totalUsersChange; }
    public double getTotalBookingsChange() { return totalBookingsChange; }
    public void setTotalBookingsChange(double totalBookingsChange) { this.totalBookingsChange = totalBookingsChange; }
    public double getTotalRevenueChange() { return totalRevenueChange; }
    public void setTotalRevenueChange(double totalRevenueChange) { this.totalRevenueChange = totalRevenueChange; }
    public double getAverageRatingChange() { return averageRatingChange; }
    public void setAverageRatingChange(double averageRatingChange) { this.averageRatingChange = averageRatingChange; }
} 