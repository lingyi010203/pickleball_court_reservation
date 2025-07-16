package com.pickleball_backend.pickleball.repository;

import com.pickleball_backend.pickleball.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Integer> {
    Optional<User> findByEmail(String email);
    Optional<User> findByUserAccount_Username(String username);
    List<User> findByRequestedUserTypeIsNotNull(); // New method for pending requests
    long countByUserAccount_Status(String status);

    @org.springframework.data.jpa.repository.Query("SELECT COUNT(u) FROM User u WHERE u.createdAt BETWEEN :start AND :end")
    long countByCreatedAtBetween(java.time.LocalDateTime start, java.time.LocalDateTime end);

    @Query("SELECT u FROM User u " +
            "JOIN u.userAccount ua " +
                    "WHERE (:search IS NULL OR u.name LIKE %:search% OR u.email LIKE %:search%) " +
                    "AND (:status IS NULL OR ua.status = :status) " +
                    "AND (:userType IS NULL OR u.userType = :userType)")
    Page<User> findByFilters(
            @Param("search") String search,
            @Param("status") String status,
            @Param("userType") String userType,
            Pageable pageable);

    java.util.List<User> findTop3ByOrderByCreatedAtDesc();
}