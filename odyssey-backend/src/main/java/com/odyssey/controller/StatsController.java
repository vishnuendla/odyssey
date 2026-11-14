package com.odyssey.controller;

import com.odyssey.dto.UserStatsDto;
import com.odyssey.service.StatsService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/stats")
public class StatsController {

    private final StatsService statsService;

    public StatsController(StatsService statsService) {
        this.statsService = statsService;
    }

    @GetMapping("/me")
    public ResponseEntity<UserStatsDto> myStats(@AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(statsService.getMyStats(userDetails.getUsername()));
    }
}
