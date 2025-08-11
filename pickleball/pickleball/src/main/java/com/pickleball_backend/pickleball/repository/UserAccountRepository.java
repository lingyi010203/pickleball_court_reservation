package com.pickleball_backend.pickleball.repository;

import com.pickleball_backend.pickleball.entity.UserAccount;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository // Add this annotation
public interface UserAccountRepository extends JpaRepository<UserAccount, Integer> {
    Optional<UserAccount> findByUsername(String username);
    Optional<UserAccount> findByUser_Email(String email);
    Optional<UserAccount> findByResetPasswordToken(String token);
    Optional<UserAccount> findByUser_Id(Integer userId);
    List<UserAccount> findByUser_IdIn(List<Integer> userIds);
    
    // Add missing method for username existence check
    boolean existsByUsername(String username);
    
    // Add missing method for counting by status
    long countByStatus(String status);

}