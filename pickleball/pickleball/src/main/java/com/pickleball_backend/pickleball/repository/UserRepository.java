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

    // Fixed: Query through UserAccount relationship
    @Query("SELECT u FROM User u JOIN u.userAccount ua WHERE ua.username = :username")
    Optional<User> findByUsername(@Param("username") String username);

    // Fixed: Query through UserAccount relationship
    Optional<User> findByUserAccount_Username(String username);
    List<User> findByRequestedUserTypeIsNotNull(); // New method for pending requests
    long countByUserAccount_Status(String status);
    List<User> findByNameContainingIgnoreCaseOrUserAccount_UsernameContainingIgnoreCase(String name, String username);

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

    List<User> findByUserTypeIn(List<String> userTypes);

    @Query("SELECT u FROM User u JOIN u.member m JOIN m.tier mt WHERE mt.tierName IN :tierNames AND u.email IS NOT NULL AND u.email != ''")
    List<User> findByMembershipTierNameIn(@Param("tierNames") List<String> tierNames);

    // Fixed: Use UserAccount relationship
    List<User> findByUserAccount_StatusAndNameContainingIgnoreCase(String status, String name);

    // Fixed: Use UserAccount relationship
    List<User> findByUserAccount_StatusAndUserAccount_UsernameContainingIgnoreCase(String status, String username);

    // Fixed: Use ua.username (UserAccount)
    @Query("SELECT DISTINCT u FROM User u " +
            "JOIN u.userAccount ua " +
            "WHERE (LOWER(ua.username) LIKE LOWER(CONCAT('%', :query, '%')) " +
            "OR LOWER(u.name) LIKE LOWER(CONCAT('%', :query, '%'))) " +
            "AND ua.status = 'ACTIVE'")
    List<User> searchActiveUsers(@Param("query") String query);

    // Fixed: Query through UserAccount
    @Query("SELECT u FROM User u JOIN u.userAccount ua WHERE ua.username = :username")
    List<User> findByUsernameList(@Param("username") String username);

    // Fixed: Use UserAccount relationship
    @Query("SELECT u FROM User u JOIN u.userAccount ua WHERE LOWER(ua.username) = LOWER(:username)")
    Optional<User> findByUsernameCaseInsensitive(@Param("username") String username);
}