package com.pickleball_backend.pickleball.repository;

import com.pickleball_backend.pickleball.entity.Slot;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

public interface SlotRepository extends JpaRepository<Slot, Integer> {
    List<Slot> findByCourtIdAndDateBetween(Integer courtId, LocalDate startDate, LocalDate endDate);
    List<Slot> findByDateBetween(LocalDate startDate, LocalDate endDate);
    List<Slot> findByCourtIdAndDateAndIsAvailableTrue(Integer courtId, LocalDate date);
    List<Slot> findByDateAndIsAvailableTrue(LocalDate date);
    List<Slot> findByCourtIdAndDateAndStatus(Integer courtId, LocalDate date, String status);
    List<Slot> findByCourtIdAndStatus(Integer courtId, String status);
    List<Slot> findByCourtIdAndDateBetweenAndStatus(Integer courtId, LocalDate startDate, LocalDate endDate, String status);
    List<Slot> findByCourtIdAndDateBetweenAndIsAvailableTrue(
            Integer courtId,
            LocalDate startDate,
            LocalDate endDate
    );
    
    // 新增：檢查特定 slot 是否已存在
    Optional<Slot> findByCourtIdAndDateAndStartTimeAndEndTime(
            Integer courtId, LocalDate date, LocalTime startTime, LocalTime endTime);
    
    // 场地利用率相关方法
    @org.springframework.data.jpa.repository.Query("SELECT COUNT(s) FROM Slot s WHERE s.courtId = :courtId AND s.date BETWEEN :startDate AND :endDate")
    long countByCourtIdAndDateBetween(Integer courtId, LocalDate startDate, LocalDate endDate);
    
    @org.springframework.data.jpa.repository.Query("SELECT COUNT(s) FROM Slot s WHERE s.date BETWEEN :startDate AND :endDate AND s.startTime BETWEEN :startTime AND :endTime AND s.endTime BETWEEN :startTime AND :endTime")
    long countByDateBetweenAndStartTimeBetweenAndEndTimeBetween(LocalDate startDate, LocalDate endDate, LocalTime startTime, LocalTime endTime);
    
    // 重新生成slots相关方法
    List<Slot> findByCourtIdAndDateGreaterThanEqual(Integer courtId, LocalDate date);
}