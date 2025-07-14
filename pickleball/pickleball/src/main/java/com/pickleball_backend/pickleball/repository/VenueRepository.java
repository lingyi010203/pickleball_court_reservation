package com.pickleball_backend.pickleball.repository;

import com.pickleball_backend.pickleball.entity.Venue;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface VenueRepository extends JpaRepository<Venue, Integer> {
   boolean existsByNameAndLocation(String name, String location);
}