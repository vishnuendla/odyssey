package com.odyssey.controller;

import com.odyssey.dto.JournalDto;
import com.odyssey.dto.JournalRequest;
import com.odyssey.service.JournalService;

import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/journals")
public class JournalController {

    private final JournalService journalService;

    public JournalController(JournalService journalService) {
        this.journalService = journalService;
    }

    @GetMapping
    public ResponseEntity<List<JournalDto>> getAllJournals() {
        return ResponseEntity.ok(journalService.getAllJournals());
    }

    @GetMapping("/public")
    public ResponseEntity<Page<JournalDto>> getPublicJournals(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {
        
        Sort.Direction direction = sortDir.equalsIgnoreCase("desc") ? 
            Sort.Direction.DESC : Sort.Direction.ASC;
        Pageable pageable = PageRequest.of(page, size, Sort.by(direction, sortBy));
        
        Page<JournalDto> journals = journalService.getPublicJournals(pageable);
        return ResponseEntity.ok(journals);
    }

    @GetMapping("/my")
    public ResponseEntity<List<JournalDto>> getUserJournals(@AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(journalService.getUserJournals(userDetails.getUsername()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<JournalDto> getJournalById(
            @PathVariable String id, 
            @AuthenticationPrincipal UserDetails userDetails) {
        // Anonymous visitors may view public journals (see SecurityConfig).
        String userEmail = userDetails != null ? userDetails.getUsername() : null;
        return ResponseEntity.ok(journalService.getJournalById(id, userEmail));
    }

    @PostMapping
    public ResponseEntity<JournalDto> createJournal(
            @Valid @RequestBody JournalRequest journalRequest, 
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(journalService.createJournal(journalRequest, userDetails.getUsername()));
    }

    @GetMapping("/share/{id}")
    public ResponseEntity<JournalDto> shareJournal(
            @PathVariable String id, 
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(journalService.shareJournal(id, userDetails.getUsername()));
    }

    @PutMapping("/{id}")
    public ResponseEntity<JournalDto> updateJournal(
            @PathVariable String id, 
            @Valid @RequestBody JournalRequest journalRequest, 
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(journalService.updateJournal(id, journalRequest, userDetails.getUsername()));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteJournal(
            @PathVariable String id, 
            @AuthenticationPrincipal UserDetails userDetails) {
        journalService.deleteJournal(id, userDetails.getUsername());
        return ResponseEntity.ok().build();
    }
}
