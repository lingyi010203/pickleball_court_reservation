package com.pickleball_backend.pickleball.repository;

import com.pickleball_backend.pickleball.entity.Feedback;
import com.pickleball_backend.pickleball.entity.Feedback.TargetType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface FeedbackRepository extends JpaRepository<Feedback, Integer> {
    List<Feedback> findByTargetTypeAndTargetIdOrderByCreatedAtDesc(
            TargetType targetType,
            Integer targetId
    );

    @Query("SELECT AVG(f.rating) FROM Feedback f WHERE f.targetType = :targetType AND f.targetId = :targetId")
    Double findAverageRatingByTarget(
            @Param("targetType") TargetType targetType,
            @Param("targetId") Integer targetId
    );

    @Query("SELECT COUNT(f) FROM Feedback f WHERE f.targetType = :targetType AND f.targetId = :targetId")
    Integer countByTarget(
            @Param("targetType") TargetType targetType,
            @Param("targetId") Integer targetId
    );

    @Query("SELECT AVG(f.rating) FROM Feedback f")
    Double findAverageRating();

    @org.springframework.data.jpa.repository.Query("SELECT AVG(f.rating) FROM Feedback f WHERE f.createdAt BETWEEN :start AND :end")
    Double findAverageRatingByDate(java.time.LocalDateTime start, java.time.LocalDateTime end);

    List<Feedback> findByUserId(Integer userId);

    java.util.List<Feedback> findTop2ByOrderByCreatedAtDesc();
    
    // 通过bookingId查找feedback
    List<Feedback> findByBookingIdOrderByCreatedAtDesc(Integer bookingId);
    
    // 统计用户的总评价数
    @Query("SELECT COUNT(f) FROM Feedback f WHERE f.user.id = :userId")
    Long countByUserId(@Param("userId") Integer userId);
    
    // 计算用户的平均评分
    @Query("SELECT AVG(f.rating) FROM Feedback f WHERE f.user.id = :userId")
    Double findAverageRatingByUserId(@Param("userId") Integer userId);
}