package com.pickleball_backend.pickleball.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;
import org.springframework.util.StringUtils;
import java.nio.file.StandardCopyOption;

@Service
public class FileStorageService {
    private static final Logger log = LoggerFactory.getLogger(FileStorageService.class);
    private final Path rootLocation = Paths.get("uploads");
    private static final long MAX_FILE_SIZE = 800 * 1024;

    public void init() {
        try {
            if (!Files.exists(rootLocation)) {
                Files.createDirectories(rootLocation);
            }
        } catch (IOException e) {
            throw new RuntimeException("Could not initialize storage directory: " + e.getMessage());
        }
    }

    public void delete(String filename) {
        if (filename == null || filename.isEmpty()) return;

        try {
            Path filePath = this.rootLocation.resolve(filename);
            if (Files.exists(filePath)) {
                Files.delete(filePath);
                log.info("Deleted file: {}", filename);
            }
        } catch (IOException e) {
            throw new RuntimeException("Failed to delete file: " + e.getMessage());
        }
    }

    // Add file validation
    public String store(MultipartFile file) {
        try {
            if (file.isEmpty()) {
                throw new RuntimeException("Failed to store empty file");
            }

            // Remove file size limit for documents
            if (file.getSize() > 5 * 1024 * 1024) { // 5MB limit
                throw new RuntimeException("File size exceeds 5MB limit");
            }

            // Generate unique filename
            String filename = UUID.randomUUID() + "_" + StringUtils.cleanPath(file.getOriginalFilename());
            String extension = filename.substring(filename.lastIndexOf(".")).toLowerCase();

            // Allow all document types
            List<String> allowedExtensions = Arrays.asList(
                    ".pdf", ".doc", ".docx", ".jpg", ".jpeg", ".png",
                    ".txt", ".xls", ".xlsx", ".ppt", ".pptx"
            );

            if (!allowedExtensions.contains(extension)) {
                throw new RuntimeException("Unsupported file type: " + extension);
            }

            // Create directory if not exists
            if (!Files.exists(rootLocation)) {
                Files.createDirectories(rootLocation);
            }

            // Save file
            Path destination = this.rootLocation.resolve(filename);
            Files.copy(file.getInputStream(), destination, StandardCopyOption.REPLACE_EXISTING);

            return filename;
        } catch (IOException e) {
            throw new RuntimeException("Failed to store file: " + e.getMessage());
        }
    }
}