package com.pickleball_backend.pickleball.repository;

import com.pickleball_backend.pickleball.entity.HelpdeskQuery;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface HelpdeskQueryRepository extends JpaRepository<HelpdeskQuery, Long> {
    // Add this method for user query history
    java.util.List<HelpdeskQuery> findByUsername(String username);
}