
package com.odyssey.controller;

import com.odyssey.dto.ReactionDto;
import com.odyssey.dto.ReactionSummaryDto;
import com.odyssey.service.ReactionService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/journals/{journalId}/reactions")
public class ReactionController {

    private final ReactionService reactionService;

    public ReactionController(ReactionService reactionService) {
        this.reactionService = reactionService;
    }

    @PostMapping
    public ResponseEntity<List<ReactionSummaryDto>> addReaction(
            @PathVariable String journalId,
            @RequestBody ReactionDto reactionDto,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(reactionService.addReaction(journalId, reactionDto, userDetails.getUsername()));
    }

    @DeleteMapping("/{type}")
    public ResponseEntity<List<ReactionSummaryDto>> removeReaction(
            @PathVariable String journalId,
            @PathVariable String type,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(reactionService.removeReaction(journalId, type, userDetails.getUsername()));
    }
}
