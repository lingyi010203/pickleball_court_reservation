package com.pickleball_backend.pickleball.repository;

import com.pickleball_backend.pickleball.entity.Booking;
import com.pickleball_backend.pickleball.entity.Court;
import com.pickleball_backend.pickleball.entity.Member;
import com.pickleball_backend.pickleball.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
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

    // 查找使用钱包支付的已完成预订
    @Query("SELECT b FROM Booking b JOIN b.payment p WHERE p.paymentMethod = :paymentMethod AND p.status = :status")
    List<Booking> findByPaymentPaymentMethodAndPaymentStatus(@Param("paymentMethod") String paymentMethod, @Param("status") String status);

    // 查找已退款的预订
    @Query("SELECT b FROM Booking b JOIN b.payment p WHERE p.status = :status")
    List<Booking> findByPaymentStatus(@Param("status") String status);

    // 查找会员的即将到来的预订
    @Query("SELECT DISTINCT b FROM Booking b " +
           "LEFT JOIN FETCH b.bookingSlots bs " +
           "LEFT JOIN FETCH bs.slot s " +
           "WHERE b.member = :member " +
           "AND s.date >= :today " +
           "AND (s.date > :today OR s.startTime > :nowTime) " +
           "AND b.status IN ('CONFIRMED', 'PENDING') " +
           "ORDER BY s.date ASC, s.startTime ASC")
    List<Booking> findUpcomingBookingsByMember(
            @Param("member") Member member,
            @Param("today") LocalDate today,
            @Param("nowTime") java.time.LocalTime nowTime);

    // 统计指定时间段内指定球场的课程预订数量
    // Note: This method is deprecated. Use ClassSessionRepository instead for class session queries.
    // The Booking entity doesn't have a 'type' field, so this query was incorrect.
    // Class sessions are handled by the ClassSession entity, not the Booking entity.
    @Deprecated
    default long countClassBookingsInTimeRange(
            @Param("courtId") Integer courtId,
            @Param("startDate") LocalDate startDate,
            @Param("startTime") java.time.LocalTime startTime,
            @Param("endTime") java.time.LocalTime endTime) {
        // This method is deprecated and should not be used.
        // Use ClassSessionRepository.findByCourtIdAndStartTimeBetween() instead.
        return 0;
    }

    // 检查指定时间段内指定球场是否有活跃预订
    @Query("SELECT COUNT(b) > 0 FROM Booking b " +
           "JOIN b.bookingSlots bs " +
           "JOIN bs.slot s " +
           "WHERE s.courtId = :courtId " +
           "AND b.status IN ('CONFIRMED', 'PENDING') " +
           "AND s.date = :date " +
           "AND s.startTime < :endTime " +
           "AND s.endTime > :startTime")
    boolean existsActiveBookingForCourtAndTime(
            @Param("courtId") Integer courtId,
            @Param("date") LocalDate date,
            @Param("startTime") java.time.LocalTime startTime,
            @Param("endTime") java.time.LocalTime endTime);

    // 查找所有过期的预订
    @Query("SELECT DISTINCT b FROM Booking b " +
           "JOIN b.bookingSlots bs " +
           "JOIN bs.slot s " +
           "WHERE b.status IN ('CONFIRMED', 'PENDING') " +
           "AND (s.date < :currentDate " +
           "OR (s.date = :currentDate AND s.endTime < :currentTime))")
    List<Booking> findAllExpired(
            @Param("currentDate") LocalDate currentDate,
            @Param("currentTime") java.time.LocalTime currentTime);
    
    // Add missing method for finding bookings by member user ID ordered by booking date
    List<Booking> findByMember_User_IdOrderByBookingDateDesc(Integer userId);
    
    // Add missing method for finding bookings by member user ID
    List<Booking> findByMember_User_Id(Integer userId);
    
    // Add missing method for finding bookings by member ID and purpose
    List<Booking> findByMember_IdAndPurpose(Integer memberId, String purpose);
    
    // Find bookings by date range and time slot
    @Query("SELECT DISTINCT b FROM Booking b " +
           "JOIN b.bookingSlots bs " +
           "JOIN bs.slot s " +
           "WHERE b.bookingDate >= :startDate " +
           "AND b.bookingDate <= :endDate " +
           "AND s.startTime >= :startTime " +
           "AND s.endTime <= :endTime " +
           "AND b.status IN ('CONFIRMED', 'COMPLETED')")
    List<Booking> findBookingsByDateRangeAndTimeSlot(
            @Param("startDate") java.time.LocalDateTime startDate,
            @Param("endDate") java.time.LocalDateTime endDate,
            @Param("startTime") java.time.LocalTime startTime,
            @Param("endTime") java.time.LocalTime endTime);
}