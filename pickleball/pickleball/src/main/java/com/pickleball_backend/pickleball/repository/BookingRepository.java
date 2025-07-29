package com.pickleball_backend.pickleball.repository;

import com.pickleball_backend.pickleball.entity.Booking;
import com.pickleball_backend.pickleball.entity.Court;
import com.pickleball_backend.pickleball.entity.Member;
import com.pickleball_backend.pickleball.entity.User;
import com.pickleball_backend.pickleball.entity.Slot;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.Date;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface BookingRepository extends JpaRepository<Booking, Integer> {

    @Query("SELECT DISTINCT b FROM Booking b " +
           "LEFT JOIN FETCH b.bookingSlots bs " +
           "LEFT JOIN FETCH bs.slot " +
           "LEFT JOIN FETCH b.member m " +
           "LEFT JOIN FETCH m.user " +
           "LEFT JOIN FETCH b.payment " +
           "WHERE b.member.id = :memberId")
    List<Booking> findByMemberId(@Param("memberId") Integer memberId);

    @Query("SELECT b FROM Booking b LEFT JOIN FETCH b.cancellationRequest WHERE b.id = :id")
    Optional<Booking> findByIdWithCancellation(@Param("id") Integer id);

    @Query("SELECT b FROM Booking b LEFT JOIN FETCH b.cancellationRequest WHERE b.id IN :ids")
    List<Booking> findAllWithCancellationByIds(@Param("ids") List<Integer> ids);

    @EntityGraph(attributePaths = {"member.user", "cancellationRequest", "bookingSlots", "bookingSlots.slot", "payment"})
    @Query("SELECT b FROM Booking b WHERE b.id IN :ids")
    List<Booking> findAllWithAdminRelationsByIds(@Param("ids") List<Integer> ids);

    @Query("SELECT b FROM Booking b " +
            "LEFT JOIN b.member m " +
            "LEFT JOIN m.user u " +
            "WHERE " +
            "(:search IS NULL OR u.name LIKE %:search% OR u.email LIKE %:search%) " +
            "AND (:status IS NULL OR b.status = :status) " +
            "AND (:startDate IS NULL OR DATE(b.bookingDate) >= :startDate) " +
            "AND (:endDate IS NULL OR DATE(b.bookingDate) <= :endDate)")
    Page<Booking> findByAdminFilters(
            @Param("search") String search,
            @Param("status") String status,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate,
            Pageable pageable
    );

    // 简单的查询方法，用于调试
    @Query("SELECT b FROM Booking b ORDER BY b.bookingDate DESC")
    Page<Booking> findAllBookings(Pageable pageable);

    @org.springframework.data.jpa.repository.Query("SELECT COUNT(b) FROM Booking b WHERE b.bookingDate BETWEEN :start AND :end")
    long countByBookingDateBetween(java.time.LocalDateTime start, java.time.LocalDateTime end);

    @org.springframework.data.jpa.repository.Query("SELECT COUNT(DISTINCT b.member.id) FROM Booking b WHERE b.bookingDate BETWEEN :start AND :end")
    long countDistinctMemberIdByBookingDateBetween(java.time.LocalDateTime start, java.time.LocalDateTime end);

    @EntityGraph(attributePaths = {"member.user"})
    List<Booking> findTop5ByOrderByBookingDateDesc();

    boolean existsByMember_User_IdAndBookingSlots_Slot_CourtId(Integer userId, Integer courtId);

    @Query("SELECT COUNT(b) > 0 FROM Booking b " +
           "JOIN b.bookingSlots bs " +
           "JOIN bs.slot s " +
           "WHERE b.member.user.id = :userId " +
           "AND s.courtId = :courtId " +
           "AND b.status = 'COMPLETED'")
    boolean existsByMember_User_IdAndCompletedBookingForCourt(Integer userId, Integer courtId);

    @Query("SELECT b FROM Booking b " +
           "JOIN b.bookingSlots bs " +
           "JOIN bs.slot s " +
           "WHERE b.member.user.id = :userId " +
           "AND b.status = 'COMPLETED' " +
           "ORDER BY b.bookingDate DESC")
    List<Booking> findCompletedBookingsByUserId(Integer userId);

    @Query("SELECT b FROM Booking b " +
           "JOIN b.bookingSlots bs " +
           "JOIN bs.slot s " +
           "WHERE b.member.user.id = :userId " +
           "AND s.courtId = :courtId " +
           "AND b.status = 'COMPLETED' " +
           "ORDER BY b.bookingDate DESC")
    List<Booking> findCompletedBookingsByUserIdAndCourtId(Integer userId, Integer courtId);

    // 根据日期范围查找预订
    List<Booking> findByBookingDateBetween(java.time.LocalDateTime startDate, java.time.LocalDateTime endDate);

    // 新的查询方法，使用@Query注解明确指定参数类型
    @Query("SELECT b FROM Booking b WHERE b.bookingDate >= :startDate AND b.bookingDate <= :endDate")
    List<Booking> findBookingsByDateRange(
            @Param("startDate") java.time.LocalDateTime startDate,
            @Param("endDate") java.time.LocalDateTime endDate
    );

    @Query("SELECT b FROM Booking b JOIN b.bookingSlots bs JOIN bs.slot s WHERE s.courtId = :courtId AND b.status = 'active' AND s.startTime < :endTime AND s.endTime > :startTime")
    List<Booking> findConflictingBookings(
            @Param("courtId") int courtId,
            @Param("startTime") Date startTime,
            @Param("endTime") Date endTime);

    // 新增：查詢可預約的球場時段（排除課程預約）
    @Query("SELECT DISTINCT s FROM Slot s WHERE s.courtId = :courtId AND s.date = :date AND s.isAvailable = true " +
            "AND NOT EXISTS (SELECT bs FROM BookingSlot bs WHERE bs.slot.id = s.id AND bs.status = 'BOOKED') " +
            "AND NOT EXISTS (SELECT b FROM Booking b JOIN b.bookingSlots bs2 JOIN bs2.slot s2 WHERE b.status = 'active' " +
            "AND s2.startTime <= :endTime AND s2.endTime >= :startTime)")
    List<Slot> findAvailableSlotsForUserBooking(
            @Param("courtId") int courtId,
            @Param("date") LocalDate date,
            @Param("startTime") LocalTime startTime,
            @Param("endTime") LocalTime endTime);

    // 新增：檢查球場時段是否可用（排除課程預約）
    @Query("SELECT COUNT(b) FROM Booking b JOIN b.bookingSlots bs JOIN bs.slot s WHERE b.status = 'active' AND s.courtId = :courtId AND s.startTime < :endTime AND s.endTime > :startTime")
    long countClassBookingsInTimeRange(
            @Param("courtId") int courtId,
            @Param("startTime") LocalDateTime startTime,
            @Param("endTime") LocalDateTime endTime);

    @Query("SELECT COUNT(b) > 0 FROM Booking b " +
            "JOIN b.bookingSlots bs " +
            "JOIN bs.slot s " +
            "WHERE s.courtId = :courtId " +
            "AND b.status NOT IN ('CANCELLED', 'COMPLETED') " +
            "AND s.date = :date " +
            "AND s.startTime < :endTime AND s.endTime > :startTime")
    boolean existsActiveBookingForCourtAndTime(
            @Param("courtId") Integer courtId,
            @Param("date") LocalDate date,
            @Param("startTime") LocalTime startTime,
            @Param("endTime") LocalTime endTime);

    List<Booking> findByMemberAndBookingDateAfter(Member member, LocalDateTime date);

    @Query("SELECT DISTINCT b FROM Booking b JOIN b.bookingSlots bs JOIN bs.slot s WHERE b.member = :member AND (s.date > :today OR (s.date = :today AND s.endTime > :nowTime))")
    List<Booking> findUpcomingBookingsByMember(@Param("member") Member member, @Param("today") java.time.LocalDate today, @Param("nowTime") java.time.LocalTime nowTime);

    @Query("SELECT b FROM Booking b WHERE b.bookingDate < :now")
    List<Booking> findAllExpired(@Param("now") LocalDateTime now);

    // 查詢某個 class session 下所有指定狀態的 booking
    @Query("SELECT b FROM Booking b WHERE b.purpose = 'CLASS_SESSION' AND b.purposeId = :sessionId AND b.status = :status")
    List<Booking> findByClassSessionPurposeAndStatus(@Param("sessionId") Integer sessionId, @Param("status") String status);
}