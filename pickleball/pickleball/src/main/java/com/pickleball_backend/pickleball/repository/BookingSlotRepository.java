package com.pickleball_backend.pickleball.repository;

import com.pickleball_backend.pickleball.entity.BookingSlot;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BookingSlotRepository extends JpaRepository<BookingSlot, Integer> {
    boolean existsBySlotIdAndStatus(Integer slotId, String status);

    // Check for existing booking-slot combination to prevent duplicates
    boolean existsByBookingIdAndSlotId(Integer bookingId, Integer slotId);

    // 查询某个球场下所有状态为 BOOKED 的 BookingSlot
    @org.springframework.data.jpa.repository.Query("SELECT bs FROM BookingSlot bs WHERE bs.slot.courtId = :courtId AND bs.status = 'BOOKED'")
    java.util.List<BookingSlot> findActiveByCourtId(@org.springframework.data.repository.query.Param("courtId") Integer courtId);
    
    // 查询某个booking的所有slots
    @org.springframework.data.jpa.repository.Query("SELECT bs FROM BookingSlot bs WHERE bs.booking.id = :bookingId")
    java.util.List<BookingSlot> findByBookingId(@org.springframework.data.repository.query.Param("bookingId") Integer bookingId);
}