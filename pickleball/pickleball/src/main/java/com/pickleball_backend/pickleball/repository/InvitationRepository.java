package com.pickleball_backend.pickleball.repository;

import com.pickleball_backend.pickleball.entity.Invitation;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface InvitationRepository extends JpaRepository<Invitation, Integer> {
    Optional<Invitation> findByToken(String token);
    Optional<Invitation> findByEmailAndUsedFalse(String email);
}
