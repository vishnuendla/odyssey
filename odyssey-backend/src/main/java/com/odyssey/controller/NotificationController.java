package com.odyssey.controller;

import com.odyssey.dto.NotificationDto;
import com.odyssey.service.NotificationService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    private final NotificationService notificationService;

    public NotificationController(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @GetMapping
    public ResponseEntity<List<NotificationDto>> list(@AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(notificationService.list(userDetails.getUsername()));
    }

    @GetMapping("/unread-count")
    public ResponseEntity<Map<String, Long>> unreadCount(@AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(Map.of("count", notificationService.unreadCount(userDetails.getUsername())));
    }

    @PostMapping("/{id}/read")
    public ResponseEntity<Void> markRead(@PathVariable String id,
                                         @AuthenticationPrincipal UserDetails userDetails) {
        notificationService.markRead(id, userDetails.getUsername());
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/read-all")
    public ResponseEntity<Void> markAllRead(@AuthenticationPrincipal UserDetails userDetails) {
        notificationService.markAllRead(userDetails.getUsername());
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id,
                                       @AuthenticationPrincipal UserDetails userDetails) {
        notificationService.delete(id, userDetails.getUsername());
        return ResponseEntity.noContent().build();
    }
}
