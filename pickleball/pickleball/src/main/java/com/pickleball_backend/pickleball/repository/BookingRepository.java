package com.pickleball_backend.pickleball.repository;

import com.pickleball_backend.pickleball.entity.Booking;
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

    List<Booking> findByMemberId(Integer memberId);

    @Query("SELECT b FROM Booking b LEFT JOIN FETCH b.cancellationRequest WHERE b.id = :id")
    Optional<Booking> findByIdWithCancellation(@Param("id") Integer id);

    @Query("SELECT b FROM Booking b LEFT JOIN FETCH b.cancellationRequest WHERE b.id IN :ids")
    List<Booking> findAllWithCancellationByIds(@Param("ids") List<Integer> ids);

    @EntityGraph(attributePaths = {"member.user", "cancellationRequest"})
    @Query("SELECT b FROM Booking b WHERE b.id IN :ids")
    List<Booking> findAllWithAdminRelationsByIds(@Param("ids") List<Integer> ids);

    @Query("SELECT b FROM Booking b " +
           "LEFT JOIN b.member m " +
           "LEFT JOIN m.user u " +
           "WHERE " +
           "(:search IS NULL OR u.name LIKE %:search% OR u.email LIKE %:search%) " +
           "AND (:status IS NULL OR b.status = :status) " +
           "AND (:startDate IS NULL OR b.bookingDate >= :startDate) " +
           "AND (:endDate IS NULL OR b.bookingDate <= :endDate)")
    Page<Booking> findByAdminFilters(
        @Param("search") String search,
        @Param("status") String status,
        @Param("startDate") LocalDate startDate,
        @Param("endDate") LocalDate endDate,
        Pageable pageable
    );
}