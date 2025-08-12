package com.pickleball_backend.pickleball.repository;

import com.pickleball_backend.pickleball.entity.Group;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface GroupRepository extends JpaRepository<Group, Long> {
    
    @Query("SELECT g FROM Group g JOIN g.members gm WHERE gm.user.id = :userId AND gm.isActive = true AND g.isActive = true")
    List<Group> findGroupsByUserId(@Param("userId") Integer userId);
    
    @Query("SELECT g FROM Group g WHERE g.creator.id = :userId AND g.isActive = true")
    List<Group> findGroupsCreatedByUserId(@Param("userId") Integer userId);
    
    @Query("SELECT g FROM Group g WHERE g.name LIKE %:searchTerm% AND g.isActive = true")
    List<Group> findGroupsByNameContaining(@Param("searchTerm") String searchTerm);
    
    @Query("SELECT g FROM Group g JOIN g.members gm WHERE g.name LIKE %:searchTerm% AND gm.user.id = :userId AND gm.isActive = true AND g.isActive = true")
    List<Group> findGroupsByNameContainingAndUserId(@Param("searchTerm") String searchTerm, @Param("userId") Integer userId);
    
    @Query("SELECT CASE WHEN COUNT(gm) > 0 THEN true ELSE false END FROM GroupMember gm WHERE gm.group.id = :groupId AND gm.user.id = :userId AND gm.isActive = true")
    boolean isUserMemberOfGroup(@Param("groupId") Long groupId, @Param("userId") Integer userId);
    
    @Query("SELECT CASE WHEN g.creator.id = :userId THEN true ELSE false END FROM Group g WHERE g.id = :groupId")
    boolean isUserCreatorOfGroup(@Param("groupId") Long groupId, @Param("userId") Integer userId);
}
