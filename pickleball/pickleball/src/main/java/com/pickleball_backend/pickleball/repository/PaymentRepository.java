package com.pickleball_backend.pickleball.repository;

import com.pickleball_backend.pickleball.entity.Payment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface PaymentRepository extends JpaRepository<Payment, Integer> {
    @org.springframework.data.jpa.repository.Query("SELECT COALESCE(SUM(CASE WHEN p.status IN ('PAID', 'COMPLETED') THEN p.amount WHEN p.status = 'REFUNDED' THEN -p.amount ELSE 0 END), 0) FROM Payment p WHERE p.paymentType = 'BOOKING'")
    Double sumTotalRevenue();

    @org.springframework.data.jpa.repository.Query("SELECT SUM(p.amount) FROM Payment p WHERE (p.status = 'PAID' OR p.status = 'REFUNDED') AND p.paymentDate BETWEEN :start AND :end")
    Double sumTotalRevenueByDate(java.time.LocalDateTime start, java.time.LocalDateTime end);

    @org.springframework.data.jpa.repository.Query("SELECT COALESCE(SUM(CASE WHEN p.status IN ('PAID', 'COMPLETED') THEN p.amount WHEN p.status = 'REFUNDED' THEN -p.amount ELSE 0 END), 0) FROM Payment p WHERE p.paymentType = :paymentType AND p.paymentDate BETWEEN :start AND :end")
    Double sumRevenueByDateAndType(java.time.LocalDateTime start, java.time.LocalDateTime end, String paymentType);
}