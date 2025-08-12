package com.pickleball_backend.pickleball.repository;

import com.pickleball_backend.pickleball.entity.GroupMember;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface GroupMemberRepository extends JpaRepository<GroupMember, Long> {
    
    @Query("SELECT gm FROM GroupMember gm WHERE gm.group.id = :groupId AND gm.user.id = :userId AND gm.isActive = true")
    Optional<GroupMember> findByGroupIdAndUserId(@Param("groupId") Long groupId, @Param("userId") Integer userId);
    
    @Query("SELECT gm FROM GroupMember gm WHERE gm.group.id = :groupId AND gm.isActive = true")
    List<GroupMember> findActiveMembersByGroupId(@Param("groupId") Long groupId);
    
    @Query("SELECT gm FROM GroupMember gm WHERE gm.user.id = :userId AND gm.isActive = true")
    List<GroupMember> findActiveGroupsByUserId(@Param("userId") Integer userId);
    
    @Query("SELECT COUNT(gm) FROM GroupMember gm WHERE gm.group.id = :groupId AND gm.isActive = true")
    long countActiveMembersByGroupId(@Param("groupId") Long groupId);
    
    @Query("SELECT gm FROM GroupMember gm WHERE gm.group.id = :groupId AND gm.isAdmin = true AND gm.isActive = true")
    List<GroupMember> findAdminsByGroupId(@Param("groupId") Long groupId);
}
