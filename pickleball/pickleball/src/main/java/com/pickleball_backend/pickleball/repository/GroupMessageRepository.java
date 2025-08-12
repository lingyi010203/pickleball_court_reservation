package com.pickleball_backend.pickleball.repository;

import com.pickleball_backend.pickleball.entity.GroupMessage;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface GroupMessageRepository extends JpaRepository<GroupMessage, Long> {
    
    @Query("SELECT gm FROM GroupMessage gm WHERE gm.group.id = :groupId AND gm.isDeleted = false ORDER BY gm.createdAt DESC")
    Page<GroupMessage> findMessagesByGroupIdOrderByCreatedAtDesc(@Param("groupId") Long groupId, Pageable pageable);
    
    @Query("SELECT gm FROM GroupMessage gm WHERE gm.group.id = :groupId AND gm.isDeleted = false ORDER BY gm.createdAt ASC")
    List<GroupMessage> findMessagesByGroupIdOrderByCreatedAtAsc(@Param("groupId") Long groupId);
    
    @Query("SELECT COUNT(gm) FROM GroupMessage gm WHERE gm.group.id = :groupId AND gm.isDeleted = false")
    long countMessagesByGroupId(@Param("groupId") Long groupId);
    
    @Query("SELECT gm FROM GroupMessage gm WHERE gm.group.id = :groupId AND gm.id > :lastReadMessageId AND gm.isDeleted = false")
    List<GroupMessage> findUnreadMessagesByGroupIdAndLastReadMessageId(@Param("groupId") Long groupId, @Param("lastReadMessageId") Long lastReadMessageId);
    
    @Query("SELECT gm FROM GroupMessage gm WHERE gm.group.id = :groupId AND gm.createdAt > :since AND gm.isDeleted = false ORDER BY gm.createdAt ASC")
    List<GroupMessage> findMessagesByGroupIdAndCreatedAfter(@Param("groupId") Long groupId, @Param("since") java.time.LocalDateTime since);
}
