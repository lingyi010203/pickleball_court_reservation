package com.pickleball_backend.pickleball.repository;

import com.pickleball_backend.pickleball.entity.Registration;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RegistrationRepository extends JpaRepository<Registration, Integer> {}
