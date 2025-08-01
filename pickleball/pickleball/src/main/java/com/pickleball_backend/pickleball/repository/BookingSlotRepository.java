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

    // 查詢三個月內某場館所有已被book的日期
    @org.springframework.data.jpa.repository.Query("SELECT DISTINCT s.date FROM BookingSlot bs JOIN Slot s ON bs.slot.id = s.id JOIN Court c ON s.courtId = c.id WHERE c.venue.id = :venueId AND bs.status = 'BOOKED' AND s.date BETWEEN :start AND :end")
    java.util.List<java.time.LocalDate> findBookedDatesByVenueIdAndDateRange(@org.springframework.data.repository.query.Param("venueId") Integer venueId,
                                                                             @org.springframework.data.repository.query.Param("start") java.time.LocalDate start,
                                                                             @org.springframework.data.repository.query.Param("end") java.time.LocalDate end);
}