package com.pickleball_backend.pickleball.repository;

import com.pickleball_backend.pickleball.entity.BookingSlot;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BookingSlotRepository extends JpaRepository<BookingSlot, Integer> {
    boolean existsBySlotIdAndStatus(Integer slotId, String status);

    // 查询某个球场下所有状态为 BOOKED 的 BookingSlot
    @org.springframework.data.jpa.repository.Query("SELECT bs FROM BookingSlot bs WHERE bs.slot.courtId = :courtId AND bs.status = 'BOOKED'")
    java.util.List<BookingSlot> findActiveByCourtId(@org.springframework.data.repository.query.Param("courtId") Integer courtId);
}