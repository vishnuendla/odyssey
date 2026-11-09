
package com.odyssey.controller;

import com.odyssey.dto.CommentDto;
import com.odyssey.dto.CommentRequest;
import com.odyssey.service.CommentService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/journals/{journalId}/comments")
public class CommentController {

    private final CommentService commentService;

    public CommentController(CommentService commentService) {
        this.commentService = commentService;
    }

    @PostMapping
    public ResponseEntity<CommentDto> addComment(
            @PathVariable String journalId,
            @Valid @RequestBody CommentRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(commentService.addComment(
                journalId, request.getContent(), userDetails.getUsername()));
    }

    @DeleteMapping("/{commentId}")
    public ResponseEntity<Void> deleteComment(
            @PathVariable String journalId,
            @PathVariable String commentId,
            @AuthenticationPrincipal UserDetails userDetails) {
        commentService.deleteComment(journalId, commentId, userDetails.getUsername());
        return ResponseEntity.ok().build();
    }
}
