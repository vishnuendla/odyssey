package com.odyssey.controller;

import com.odyssey.dto.PublicUserDto;
import com.odyssey.service.FollowService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users/{userId}")
public class FollowController {

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
    public ResponseEntity<List<PublicUserDto>> followers(@PathVariable String userId) {
        return ResponseEntity.ok(followService.followers(userId));
    }

    @GetMapping("/following")
    public ResponseEntity<List<PublicUserDto>> following(@PathVariable String userId) {
        return ResponseEntity.ok(followService.following(userId));
    }
}
