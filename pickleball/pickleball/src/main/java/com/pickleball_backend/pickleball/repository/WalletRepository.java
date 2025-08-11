package com.pickleball_backend.pickleball.repository;

import com.pickleball_backend.pickleball.entity.Wallet;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface WalletRepository extends JpaRepository<Wallet, Integer> {
    @Query("SELECT w FROM Wallet w WHERE w.member.id = :memberId")
    Optional<Wallet> findByMemberId(Integer memberId);

    @Query("SELECT w FROM Wallet w WHERE w.member.id = :memberId")
    Optional<Wallet> findByMember(@Param("memberId") Integer memberId);
    
    // Add missing method for finding wallet by member ID
    Optional<Wallet> findByMember_Id(Integer memberId);
}