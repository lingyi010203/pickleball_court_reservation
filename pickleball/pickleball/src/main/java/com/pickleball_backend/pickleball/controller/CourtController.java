package com.pickleball_backend.pickleball.controller;

import com.pickleball_backend.pickleball.dto.CourtDto;
import com.pickleball_backend.pickleball.dto.CourtPricingDto;
import com.pickleball_backend.pickleball.dto.CourtDeletePreviewDto;
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
import com.pickleball_backend.pickleball.entity.CourtType;

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

    @GetMapping("/{id}/delete-preview")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<?> getDeletePreview(@PathVariable Integer id) {
        try {
            CourtDeletePreviewDto preview = courtService.getDeletePreview(id);
            return ResponseEntity.ok(preview);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error fetching delete preview");
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
            System.out.println("=== Uploading image for court ID: " + courtId + " ===");
            System.out.println("File name: " + file.getOriginalFilename());
            System.out.println("File size: " + file.getSize());
            
            if (file.isEmpty()) {
                System.out.println("File is empty!");
                return ResponseEntity.badRequest().body("File is empty");
            }
            
            // 保存文件到 uploads 目录
            String uploadsDir = "uploads/";
            Path uploadPath = Paths.get(uploadsDir).toAbsolutePath().normalize();
            System.out.println("Upload path: " + uploadPath);
            
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
                System.out.println("Created uploads directory");
            }
            
            String originalFilename = file.getOriginalFilename();
            String extension = originalFilename.substring(originalFilename.lastIndexOf("."));
            String filename = UUID.randomUUID().toString() + extension;
            Path filePath = uploadPath.resolve(filename);
            System.out.println("File path: " + filePath);
            
            Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);
            System.out.println("File saved to disk successfully");

            // 保存到 court_image 表
            CourtImage courtImage = new CourtImage();
            courtImage.setCourtId(courtId);
            courtImage.setImagePath("/uploads/" + filename);
            courtImage.setUploadedAt(LocalDateTime.now());
            
            System.out.println("CourtImage object created:");
            System.out.println("  - Court ID: " + courtImage.getCourtId());
            System.out.println("  - Image Path: " + courtImage.getImagePath());
            System.out.println("  - Uploaded At: " + courtImage.getUploadedAt());
            
            CourtImage savedImage = courtImageRepository.save(courtImage);
            System.out.println("Image saved to database with ID: " + savedImage.getId());

            return ResponseEntity.ok().body(savedImage);
        } catch (Exception e) {
            System.err.println("Error uploading image: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Failed to upload image: " + e.getMessage());
        }
    }

    @GetMapping("/{courtId}/images")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<?> getCourtImages(@PathVariable Integer courtId) {
        System.out.println("=== Getting images for court ID: " + courtId + " ===");
        List<CourtImage> images = courtImageRepository.findByCourtId(courtId);
        System.out.println("Found " + images.size() + " images in database");
        for (CourtImage image : images) {
            System.out.println("  - Image ID: " + image.getId() + ", Path: " + image.getImagePath());
        }
        return ResponseEntity.ok(images);
    }

    // 允许所有人访问的球场图片接口
    @GetMapping("/public/{courtId}/images")
    public ResponseEntity<?> getCourtImagesPublic(@PathVariable Integer courtId) {
        List<CourtImage> images = courtImageRepository.findByCourtId(courtId);
        return ResponseEntity.ok(images);
    }

    @PutMapping("/{id}/type")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<?> updateCourtType(
            @PathVariable Integer id,
            @RequestBody Map<String, String> request) {
        try {
            String courtTypeStr = request.get("courtType");
            if (courtTypeStr == null) {
                return ResponseEntity.badRequest().body("courtType is required");
            }
            
            CourtType courtType;
            try {
                courtType = CourtType.valueOf(courtTypeStr.toUpperCase());
            } catch (IllegalArgumentException e) {
                return ResponseEntity.badRequest().body("Invalid court type. Must be STANDARD, VIP, or OTHER");
            }
            
            Court court = courtRepository.findById(id)
                    .orElseThrow(() -> new EntityNotFoundException("Court not found"));
            
            court.setCourtType(courtType);
            courtRepository.save(court);
            
            return ResponseEntity.ok(Map.of("message", "Court type updated successfully"));
        } catch (EntityNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error updating court type");
        }
    }
}