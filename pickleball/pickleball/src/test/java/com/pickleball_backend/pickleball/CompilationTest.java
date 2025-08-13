package com.pickleball_backend.pickleball;

import com.pickleball_backend.pickleball.dto.UserTypeChangeRequestDto;
import com.pickleball_backend.pickleball.dto.UserTypeChangeRequestFilterDto;
import com.pickleball_backend.pickleball.dto.UserTypeChangeRequestStatisticsDto;
import com.pickleball_backend.pickleball.dto.CreateUserTypeChangeRequestDto;
import com.pickleball_backend.pickleball.dto.ProcessUserTypeChangeRequestDto;
import com.pickleball_backend.pickleball.entity.UserTypeChangeRequest;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

public class CompilationTest {

    @Test
    public void testAllDtoClassesCanBeImported() {
        // Test that all DTO classes can be instantiated
        assertNotNull(new UserTypeChangeRequestDto());
        assertNotNull(new UserTypeChangeRequestFilterDto());
        assertNotNull(new UserTypeChangeRequestStatisticsDto());
        assertNotNull(new CreateUserTypeChangeRequestDto());
        assertNotNull(new ProcessUserTypeChangeRequestDto());
        
        // Test entity class
        assertNotNull(new UserTypeChangeRequest());
        
        // Test enum values
        assertNotNull(UserTypeChangeRequest.RequestStatus.PENDING);
        assertNotNull(UserTypeChangeRequest.RequestStatus.APPROVED);
        assertNotNull(UserTypeChangeRequest.RequestStatus.REJECTED);
        assertNotNull(UserTypeChangeRequest.RequestStatus.CANCELLED);
    }
}
