package com.odyssey.controller;

import com.odyssey.dto.AdminStatsDto;
import com.odyssey.dto.ReportDto;
import com.odyssey.dto.ReportRequest;
import com.odyssey.dto.ReportResolveRequest;
import com.odyssey.service.ModerationService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
public class ModerationController {

    private final ModerationService moderationService;

    public ModerationController(ModerationService moderationService) {
        this.moderationService = moderationService;
    }

    @PostMapping("/api/reports")
    public ResponseEntity<ReportDto> report(@Valid @RequestBody ReportRequest request,
                                            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(moderationService.createReport(request, userDetails.getUsername()));
    }

    @GetMapping("/api/admin/reports")
    public ResponseEntity<List<ReportDto>> listReports(@RequestParam(required = false) String status) {
        return ResponseEntity.ok(moderationService.listReports(status));
    }

    @PatchMapping("/api/admin/reports/{id}")
    public ResponseEntity<ReportDto> resolveReport(@PathVariable String id,
                                                   @Valid @RequestBody ReportResolveRequest request,
                                                   @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(moderationService.resolveReport(id, request, userDetails.getUsername()));
    }

    @GetMapping("/api/admin/stats")
    public ResponseEntity<AdminStatsDto> stats() {
        return ResponseEntity.ok(moderationService.stats());
    }

    @PatchMapping("/api/admin/journals/{id}/visibility")
    public ResponseEntity<Void> hideJournal(@PathVariable String id,
                                            @RequestParam boolean hidden) {
        moderationService.setJournalHidden(id, hidden);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/api/admin/comments/{id}/visibility")
    public ResponseEntity<Void> hideComment(@PathVariable String id,
                                            @RequestParam boolean hidden) {
        moderationService.setCommentHidden(id, hidden);
        return ResponseEntity.noContent().build();
    }
}
