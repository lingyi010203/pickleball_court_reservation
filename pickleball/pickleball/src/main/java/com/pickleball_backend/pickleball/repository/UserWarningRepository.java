package com.pickleball_backend.pickleball.repository;

import com.pickleball_backend.pickleball.entity.User;
import com.pickleball_backend.pickleball.entity.UserWarning;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface UserWarningRepository extends JpaRepository<UserWarning, Integer> {
    List<UserWarning> findByUser(User user);

    @Query("SELECT w FROM UserWarning w WHERE w.user.id = :userId ORDER BY w.createdAt DESC")
    List<UserWarning> findByUserIdOrderByCreatedAtDesc(@Param("userId") Integer userId);

    @Query("SELECT w FROM UserWarning w WHERE w.user.userAccount.username = :username ORDER BY w.createdAt DESC")
    List<UserWarning> findByUsernameOrderByCreatedAtDesc(@Param("username") String username);

    long countByUser_Id(Integer userId);
}


