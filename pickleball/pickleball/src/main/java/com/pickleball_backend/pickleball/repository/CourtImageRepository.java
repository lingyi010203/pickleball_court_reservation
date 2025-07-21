package com.pickleball_backend.pickleball.repository;

import com.pickleball_backend.pickleball.entity.CourtImage;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface CourtImageRepository extends JpaRepository<CourtImage, Integer> {
    List<CourtImage> findByCourtId(Integer courtId);
}