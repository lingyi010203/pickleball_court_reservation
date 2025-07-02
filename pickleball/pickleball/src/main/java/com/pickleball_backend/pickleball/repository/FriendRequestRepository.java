package com.pickleball_backend.pickleball.repository;

import com.pickleball_backend.pickleball.entity.FriendRequest;
import com.pickleball_backend.pickleball.entity.User;
import com.pickleball_backend.pickleball.entity.FriendRequest.Status;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.Optional;

public interface FriendRequestRepository extends JpaRepository<FriendRequest, Long> {

    // For UserServiceImpl
    @Query("SELECT COUNT(fr) > 0 FROM FriendRequest fr " +
            "WHERE (fr.sender = :user1 AND fr.receiver = :user2) " +
            "OR (fr.sender = :user2 AND fr.receiver = :user1)")
    boolean existsBetweenUsers(@Param("user1") User user1, @Param("user2") User user2);

    @Query("SELECT COUNT(fr) > 0 FROM FriendRequest fr " +
            "WHERE ((fr.sender = :user1 AND fr.receiver = :user2) " +
            "OR (fr.sender = :user2 AND fr.receiver = :user1)) " +
            "AND fr.status = 'ACCEPTED'")
    boolean existsAcceptedBetweenUsers(@Param("user1") User user1, @Param("user2") User user2);

    @Query("SELECT fr FROM FriendRequest fr " +
            "WHERE fr.receiver = :user AND fr.status = 'PENDING'")
    List<FriendRequest> findByReceiverAndStatus(@Param("user") User user, Status status);

    @Query("SELECT CASE WHEN fr.sender = :user THEN fr.receiver ELSE fr.sender END " +
            "FROM FriendRequest fr " +
            "WHERE (fr.sender = :user OR fr.receiver = :user) " +
            "AND fr.status = 'ACCEPTED'")
    List<User> findFriendsByUser(@Param("user") User user);

    // For FriendshipService
    @Query("SELECT fr FROM FriendRequest fr " +
            "WHERE (fr.sender = :sender AND fr.receiver = :receiver) " +
            "OR (fr.sender = :receiver AND fr.receiver = :sender)")
    Optional<FriendRequest> findExistingRequest(
            @Param("sender") User sender,
            @Param("receiver") User receiver
    );

    @Query("SELECT fr FROM FriendRequest fr " +
            "WHERE fr.status = 'ACCEPTED' AND " +
            "(fr.sender = :user OR fr.receiver = :user)")
    List<FriendRequest> findAcceptedRequests(@Param("user") User user);

    @Query("SELECT COUNT(fr) > 0 FROM FriendRequest fr " +
            "WHERE fr.status = 'ACCEPTED' AND " +
            "((fr.sender = :user1 AND fr.receiver = :user2) " +
            "OR (fr.sender = :user2 AND fr.receiver = :user1))")
    boolean existsAcceptedFriendRequestBetween(
            @Param("user1") User user1,
            @Param("user2") User user2
    );
}