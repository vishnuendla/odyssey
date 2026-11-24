package com.odyssey.controller;

import com.odyssey.dto.PublicUserDto;
import com.odyssey.service.FollowService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users/{userId}")
public class FollowController {

    private static final int MAX_PAGE_SIZE = 50;

    private final FollowService followService;

    public FollowController(FollowService followService) {
        this.followService = followService;
    }

    @PostMapping("/follow")
    public ResponseEntity<PublicUserDto> follow(@PathVariable String userId,
                                                @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(followService.follow(userId, userDetails.getUsername()));
    }

    @DeleteMapping("/follow")
    public ResponseEntity<PublicUserDto> unfollow(@PathVariable String userId,
                                                  @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(followService.unfollow(userId, userDetails.getUsername()));
    }

    @GetMapping("/followers")
    public ResponseEntity<Page<PublicUserDto>> followers(
            @PathVariable String userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(followService.followers(userId, pageable(page, size), emailOf(userDetails)));
    }

    @GetMapping("/following")
    public ResponseEntity<Page<PublicUserDto>> following(
            @PathVariable String userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(followService.following(userId, pageable(page, size), emailOf(userDetails)));
    }

    private PageRequest pageable(int page, int size) {
        int safePage = Math.max(page, 0);
        int safeSize = Math.min(Math.max(size, 1), MAX_PAGE_SIZE);
        return PageRequest.of(safePage, safeSize);
    }

    private String emailOf(UserDetails userDetails) {
        return userDetails != null ? userDetails.getUsername() : null;
    }
}
