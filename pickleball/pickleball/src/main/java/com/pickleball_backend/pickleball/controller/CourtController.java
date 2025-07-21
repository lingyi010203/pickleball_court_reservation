package com.pickleball_backend.pickleball.controller;

import com.pickleball_backend.pickleball.dto.CourtDto;
import com.pickleball_backend.pickleball.dto.CourtPricingDto;
import com.pickleball_backend.pickleball.entity.Court;
import com.pickleball_backend.pickleball.service.CourtService;
import jakarta.persistence.EntityNotFoundException;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.beans.factory.annotation.Autowired;
import com.pickleball_backend.pickleball.entity.Venue;
import com.pickleball_backend.pickleball.repository.CourtRepository;
import com.pickleball_backend.pickleball.repository.VenueRepository;
import org.springframework.web.multipart.MultipartFile;
import java.nio.file.*;
import com.pickleball_backend.pickleball.entity.CourtImage;
import com.pickleball_backend.pickleball.repository.CourtImageRepository;

import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.time.LocalDateTime;
import java.util.UUID;

@RestController
@RequestMapping("/api/admin/courts")
@RequiredArgsConstructor
public class CourtController {
    private final CourtService courtService;
    @Autowired
    private CourtRepository courtRepository;
    @Autowired
    private VenueRepository venueRepository;
    @Autowired
    private CourtImageRepository courtImageRepository;

    @PostMapping
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<?> createCourt(@RequestBody CourtDto courtDto) {
        try {
            Court newCourt = courtService.createCourt(courtDto);
            return ResponseEntity.status(HttpStatus.CREATED).body(Map.of("id", newCourt.getId()));
        } catch (EntityNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(e.getMessage());
        } catch (Exception e) {
            e.printStackTrace(); // 确保异常输出到控制台
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error creating court");
        }
    }

    @PostMapping("/add")
    public Integer addCourt(@RequestBody CourtDto courtDto) {
        Court court = new Court();
        court.setName(courtDto.getName());
        court.setLocation(courtDto.getLocation());
        court.setStatus(courtDto.getStatus());
        court.setOpeningTime(courtDto.getOpeningTime());
        court.setClosingTime(courtDto.getClosingTime());
        court.setOperatingDays(courtDto.getOperatingDays());
        court.setPeakHourlyPrice(courtDto.getPeakHourlyPrice());
        court.setOffPeakHourlyPrice(courtDto.getOffPeakHourlyPrice());
        court.setDailyPrice(courtDto.getDailyPrice());
        court.setPeakStartTime(courtDto.getPeakStartTime());
        court.setPeakEndTime(courtDto.getPeakEndTime());
        
        // 关键：设置所属场馆
        Venue venue = venueRepository.findById(courtDto.getVenueId()).orElseThrow();
        court.setVenue(venue);
        
        court = courtRepository.save(court);
        return court.getId();
    }


    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<?> updateCourt(
            @PathVariable Integer id,
            @RequestBody CourtDto courtDto) {
        try {
            Court updatedCourt = courtService.updateCourt(id, courtDto);
            return new ResponseEntity<>(updatedCourt, HttpStatus.OK);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error updating court");
        }
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<?> deleteCourt(@PathVariable Integer id) {
        try {
            courtService.deleteCourt(id);
            return ResponseEntity.ok("Court archived successfully");
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error archiving court");
        }
    }

    @PutMapping("/{id}/pricing")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<?> updateCourtPricing(
            @PathVariable Integer id,
            @RequestBody @Valid CourtPricingDto pricingDto) {
        try {
            courtService.updateCourtPricing(id, pricingDto);
            return ResponseEntity.ok("Pricing updated successfully");
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        } catch (Exception e) {
            e.printStackTrace(); // Add this for debugging
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error updating pricing");
        }
    }

    @GetMapping("/{id}/analytics")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<?> getCourtAnalytics(@PathVariable Integer id) {
        try {
            // TODO: Implement analytics service
            Map<String, Object> analytics = Map.of(
                    "bookingsLastMonth", 42,
                    "peakHours", Arrays.asList("18:00-20:00", "20:00-22:00"),
                    "revenue", 1250.00
            );
            return new ResponseEntity<>(analytics, HttpStatus.OK);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error fetching analytics");
        }
    }

    @GetMapping
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<?> getAllCourts() {
        try {
            List<Court> courts = courtService.getAllCourts();
            if (courts.isEmpty()) {
                return ResponseEntity.status(HttpStatus.OK).body("No courts have been added yet.");
            }
            return new ResponseEntity<>(courts, HttpStatus.OK);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error retrieving courts");
        }
    }

    @PostMapping("/{courtId}/images")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<?> uploadCourtImage(
            @PathVariable Integer courtId,
            @RequestParam("file") MultipartFile file) {
        try {
            if (file.isEmpty()) {
                return ResponseEntity.badRequest().body("File is empty");
            }
            // 保存文件到 uploads 目录
            String uploadsDir = "uploads/";
            Path uploadPath = Paths.get(uploadsDir).toAbsolutePath().normalize();
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }
            String originalFilename = file.getOriginalFilename();
            String extension = originalFilename.substring(originalFilename.lastIndexOf("."));
            String filename = UUID.randomUUID().toString() + extension;
            Path filePath = uploadPath.resolve(filename);
            Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

            // 保存到 court_image 表
            CourtImage courtImage = new CourtImage();
            courtImage.setCourtId(courtId);
            courtImage.setImagePath("/uploads/" + filename);
            courtImage.setUploadedAt(LocalDateTime.now());
            courtImageRepository.save(courtImage);

            return ResponseEntity.ok().body(courtImage);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Failed to upload image: " + e.getMessage());
        }
    }

    @GetMapping("/{courtId}/images")
    public ResponseEntity<?> getCourtImages(@PathVariable Integer courtId) {
        List<CourtImage> images = courtImageRepository.findByCourtId(courtId);
        return ResponseEntity.ok(images);
    }

    // 允许所有人访问的球场图片接口
    @GetMapping("/public/{courtId}/images")
    public ResponseEntity<?> getCourtImagesPublic(@PathVariable Integer courtId) {
        List<CourtImage> images = courtImageRepository.findByCourtId(courtId);
        return ResponseEntity.ok(images);
    }
}