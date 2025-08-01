package com.pickleball_backend.pickleball.repository;

import com.pickleball_backend.pickleball.entity.JoinRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface JoinRequestRepository extends JpaRepository<JoinRequest, Integer> {
}