package com.pickleball_backend.pickleball;

import com.pickleball_backend.pickleball.dto.UserTypeChangeRequestDto;
import com.pickleball_backend.pickleball.dto.UserTypeChangeRequestFilterDto;
import com.pickleball_backend.pickleball.dto.UserTypeChangeRequestStatisticsDto;
import com.pickleball_backend.pickleball.entity.UserTypeChangeRequest;
import com.pickleball_backend.pickleball.service.UserTypeChangeRequestService;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
public class UserTypeChangeRequestTest {

    @Test
    public void testDtoClasses() {
        // Test that DTO classes can be instantiated
        UserTypeChangeRequestDto dto = new UserTypeChangeRequestDto();
        assertNotNull(dto);
        
        UserTypeChangeRequestFilterDto filterDto = new UserTypeChangeRequestFilterDto();
        assertNotNull(filterDto);
        
        UserTypeChangeRequestStatisticsDto statsDto = new UserTypeChangeRequestStatisticsDto();
        assertNotNull(statsDto);
    }

    @Test
    public void testEntityClass() {
        // Test that entity class can be instantiated
        UserTypeChangeRequest entity = new UserTypeChangeRequest();
        assertNotNull(entity);
        
        // Test enum values
        assertNotNull(UserTypeChangeRequest.RequestStatus.PENDING);
        assertNotNull(UserTypeChangeRequest.RequestStatus.APPROVED);
        assertNotNull(UserTypeChangeRequest.RequestStatus.REJECTED);
        assertNotNull(UserTypeChangeRequest.RequestStatus.CANCELLED);
    }

    @Test
    public void testServiceInterface() {
        // Test that service interface exists
        assertTrue(UserTypeChangeRequestService.class.isInterface());
    }
}
