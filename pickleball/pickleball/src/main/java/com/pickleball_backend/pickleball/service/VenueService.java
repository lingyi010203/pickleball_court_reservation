package com.pickleball_backend.pickleball.service;

import com.pickleball_backend.pickleball.dto.VenueDto;
import com.pickleball_backend.pickleball.entity.Venue;
import com.pickleball_backend.pickleball.repository.VenueRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class VenueService {
    @Autowired
    private VenueRepository venueRepository;

    public Venue createVenue(VenueDto venueDto) {
        if (venueRepository.existsByNameAndLocation(venueDto.getName(), venueDto.getLocation())) {
            throw new IllegalArgumentException("Venue with the same name and location already exists");
        }

        Venue venue = new Venue();
        venue.setName(venueDto.getName());
        venue.setLocation(venueDto.getLocation());
        venue.setDescription(venueDto.getDescription());
        return venueRepository.save(venue);
    }
}
