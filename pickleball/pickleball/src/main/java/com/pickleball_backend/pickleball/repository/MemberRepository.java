package com.pickleball_backend.pickleball.repository;

import com.pickleball_backend.pickleball.entity.Member;
import com.pickleball_backend.pickleball.entity.User;
import com.pickleball_backend.pickleball.entity.MembershipTier;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;

public interface MemberRepository extends JpaRepository<Member, Integer> {

    @Modifying
    @Transactional
    @Query("UPDATE Member m SET m.tier = :tier WHERE m.tierPointBalance BETWEEN :min AND :max")
    int updateMembersTier(
            @Param("min") int min,
            @Param("max") int max,
            @Param("tier") MembershipTier tier
    );

    @Modifying
    @Transactional
    @Query("UPDATE Member m SET m.tier = :newTier WHERE m.tier.id = :oldTierId")
    int reassignMembersFromTier(
            @Param("oldTierId") Integer oldTierId,
            @Param("newTier") MembershipTier newTier
    );

    Member findByUserId(Integer userId);

    @Query("SELECT m.user FROM Member m WHERE m.tier.tierName IN :tierNames")
    List<User> findUsersByTierNames(@Param("tierNames") List<String> tierNames);

    @Query("SELECT m FROM Member m WHERE m.user.userAccount.username = :username")
    Member findByUsername(@Param("username") String username);
    
    // 根據User查找Member
    Member findByUser(User user);
    
    // Check if member exists by user ID
    boolean existsByUserId(Integer userId);
    
    // Add missing method for counting members by tier ID
    long countByTier_Id(Integer tierId);
    
    // Add missing method for finding members by tier name
    List<Member> findByTier_TierName(String tierName);
}