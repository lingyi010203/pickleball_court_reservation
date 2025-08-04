package com.pickleball_backend.pickleball.repository;

import com.pickleball_backend.pickleball.entity.ClassRegistration;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface ClassRegistrationRepository extends JpaRepository<ClassRegistration, Integer> {
    boolean existsByClassSessionIdAndMemberId(Integer sessionId, Integer memberId);

    @Query("SELECT COUNT(r) FROM ClassRegistration r WHERE r.classSession.id = :sessionId")
    int countByClassSessionId(@Param("sessionId") Integer sessionId);

    List<ClassRegistration> findByClassSessionId(Integer sessionId);

    @Query("SELECT r.member.id, r.member.user.name, r.member.user.email, COUNT(r) as sessionCount " +
           "FROM ClassRegistration r WHERE r.classSession.coach.id = :coachId GROUP BY r.member.id, r.member.user.name, r.member.user.email")
    List<Object[]> findStudentsByCoachId(@Param("coachId") Integer coachId);

    @Query("SELECT r FROM ClassRegistration r WHERE r.member.user.id = :userId")
    List<ClassRegistration> findByMemberUserId(@Param("userId") Integer userId);
    
    @Query("SELECT r FROM ClassRegistration r WHERE r.member.user.id = :userId AND r.classSession.id = :sessionId")
    ClassRegistration findByMemberUserIdAndClassSessionId(@Param("userId") Integer userId, @Param("sessionId") Integer sessionId);
    
    @Query("SELECT COUNT(r) > 0 FROM ClassRegistration r WHERE r.classSession = :classSession AND r.member.user.id = :userId")
    boolean existsByClassSessionAndMemberUserId(@Param("classSession") com.pickleball_backend.pickleball.entity.ClassSession classSession, @Param("userId") Integer userId);
}