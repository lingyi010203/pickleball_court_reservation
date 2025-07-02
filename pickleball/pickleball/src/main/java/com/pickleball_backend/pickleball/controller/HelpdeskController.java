// HelpdeskController.java
package com.pickleball_backend.pickleball.controller;

import com.pickleball_backend.pickleball.dto.EscalateFormRequest;
import com.pickleball_backend.pickleball.entity.HelpdeskQuery;
import com.pickleball_backend.pickleball.service.HelpdeskService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/helpdesk")
public class HelpdeskController {
    private final HelpdeskService helpdeskService;

    @Autowired
    public HelpdeskController(HelpdeskService helpdeskService) {
        this.helpdeskService = helpdeskService;
    }

    @PostMapping("/ask")
    public ResponseEntity<HelpdeskQuery> askQuestion(
            Authentication authentication,
            @RequestBody String question) {

        if (question == null || question.trim().isEmpty()) {
            return ResponseEntity.badRequest().build();
        }

        String username = authentication.getName();
        HelpdeskQuery response = helpdeskService.processQuery(username, question);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/escalate/{queryId}")
    public ResponseEntity<Void> escalateToHumanSupport(
            Authentication authentication,
            @PathVariable Long queryId) {

        helpdeskService.escalateToHumanSupport(queryId);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/escalate-form")
    public ResponseEntity<Void> escalateForm(
            Authentication authentication,
            @RequestBody HelpdeskQuery request) {

        String username = authentication.getName();
        helpdeskService.escalateForm(username, request.getTopic(), request.getMessage());
        return ResponseEntity.ok().build();
    }

    @GetMapping("/queries")
    public List<HelpdeskQuery> getUserQueries(Authentication authentication) {
        String username = authentication.getName();
        return helpdeskService.getQueriesByUsername(username);
    }
}