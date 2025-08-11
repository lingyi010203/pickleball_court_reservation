package com.pickleball_backend.pickleball.dto;

public class DashboardSummaryDto {
    private long totalUsers;
    private long totalBookings;
    private double totalRevenue;
    private double averageRating;
    private long newUsersThisMonth;
    private long newBookingsThisMonth;
    private double newRevenueThisMonth;
    private long newRatingsThisMonth;

    public long getTotalUsers() { return totalUsers; }
    public void setTotalUsers(long totalUsers) { this.totalUsers = totalUsers; }
    public long getTotalBookings() { return totalBookings; }
    public void setTotalBookings(long totalBookings) { this.totalBookings = totalBookings; }
    public double getTotalRevenue() { return totalRevenue; }
    public void setTotalRevenue(double totalRevenue) { this.totalRevenue = totalRevenue; }
    public double getAverageRating() { return averageRating; }
    public void setAverageRating(double averageRating) { this.averageRating = averageRating; }
    public long getNewUsersThisMonth() { return newUsersThisMonth; }
    public void setNewUsersThisMonth(long newUsersThisMonth) { this.newUsersThisMonth = newUsersThisMonth; }
    public long getNewBookingsThisMonth() { return newBookingsThisMonth; }
    public void setNewBookingsThisMonth(long newBookingsThisMonth) { this.newBookingsThisMonth = newBookingsThisMonth; }
    public double getNewRevenueThisMonth() { return newRevenueThisMonth; }
    public void setNewRevenueThisMonth(double newRevenueThisMonth) { this.newRevenueThisMonth = newRevenueThisMonth; }
    public long getNewRatingsThisMonth() { return newRatingsThisMonth; }
    public void setNewRatingsThisMonth(long newRatingsThisMonth) { this.newRatingsThisMonth = newRatingsThisMonth; }
} 