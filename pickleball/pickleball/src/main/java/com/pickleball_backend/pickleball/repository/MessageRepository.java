package com.pickleball_backend.pickleball.repository;

import com.pickleball_backend.pickleball.entity.Message;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface MessageRepository extends JpaRepository<Message, Integer> {
    // Add these methods
    @EntityGraph(attributePaths = {
            "sender",
            "sender.userAccount",
            "receiver",
            "receiver.userAccount"
    })
    @Query("SELECT m FROM Message m WHERE m.conversationId = :conversationId ORDER BY m.timestamp ASC")
    List<Message> findByConversationId(@Param("conversationId") String conversationId);

    @Query("SELECT DISTINCT m.conversationId FROM Message m WHERE m.sender.id = :userId OR m.receiver.id = :userId")
    List<String> findConversationIdsByUserId(@Param("userId") Integer userId);

    @Query("SELECT m FROM Message m WHERE m.conversationId IN :conversationIds ORDER BY m.timestamp DESC")
    List<Message> findLatestMessagesByConversationIds(@Param("conversationIds") List<String> conversationIds);

    // New methods for user conversations
    @Query("SELECT m FROM Message m WHERE (m.sender.id = :userId OR m.receiver.id = :userId) ORDER BY m.timestamp DESC")
    List<Message> findByUserId(@Param("userId") Integer userId);

    @Query("SELECT m FROM Message m WHERE m.sender.id = :userId OR m.receiver.id = :userId ORDER BY m.timestamp DESC")
    List<Message> findBySenderIdOrReceiverIdOrderByTimestampDesc(@Param("userId") Integer userId);

}