package com.pickleball_backend.pickleball.repository;

import com.pickleball_backend.pickleball.entity.EventRegistration;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
import java.util.List;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import com.pickleball_backend.pickleball.entity.User;
import com.pickleball_backend.pickleball.dto.ProfileDto;
import java.util.stream.Collectors;

public interface EventRegistrationRepository extends JpaRepository<EventRegistration, Integer> {
    Optional<EventRegistration> findByEvent_IdAndUser_Id(Integer eventId, Integer userId);
    List<EventRegistration> findByUser_Id(Integer userId);
    List<EventRegistration> findByEvent_Id(Integer eventId);

    @Query("SELECT er.user FROM EventRegistration er WHERE er.event.id = :eventId")
    List<User> findUsersRegisteredForEvent(@Param("eventId") Integer eventId);
}
