package com.odyssey.controller;

import com.odyssey.dto.AiStatusDto;
import com.odyssey.dto.AskAnswer;
import com.odyssey.dto.AskRequest;
import com.odyssey.dto.SearchRequest;
import com.odyssey.dto.SemanticSearchHit;
import com.odyssey.service.AskService;
import com.odyssey.service.ChatCompletionService;
import com.odyssey.service.EmbeddingService;
import com.odyssey.service.RateLimitService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/ai")
public class AiController {

    private static final int ASKS_PER_HOUR = 30;
    private static final int SEARCHES_PER_HOUR = 60;

    private final AskService askService;
    private final EmbeddingService embeddingService;
    private final ChatCompletionService chatCompletionService;
    private final RateLimitService rateLimitService;

    public AiController(AskService askService,
                        EmbeddingService embeddingService,
                        ChatCompletionService chatCompletionService,
                        RateLimitService rateLimitService) {
        this.askService = askService;
        this.embeddingService = embeddingService;
        this.chatCompletionService = chatCompletionService;
        this.rateLimitService = rateLimitService;
    }

    @GetMapping("/status")
    public ResponseEntity<AiStatusDto> status() {
        return ResponseEntity.ok(new AiStatusDto(
                embeddingService.isConfigured() && chatCompletionService.isConfigured(),
                embeddingService.model(),
                chatCompletionService.model()));
    }

    @PostMapping("/ask")
    public ResponseEntity<AskAnswer> ask(@Valid @RequestBody AskRequest request,
                                         @AuthenticationPrincipal UserDetails userDetails) {
        rateLimitService.check("ai-ask:" + userDetails.getUsername(), ASKS_PER_HOUR, 3600);
        return ResponseEntity.ok(askService.ask(userDetails.getUsername(), request.question().trim()));
    }

    @PostMapping("/search")
    public ResponseEntity<List<SemanticSearchHit>> search(@Valid @RequestBody SearchRequest request,
                                                          @AuthenticationPrincipal UserDetails userDetails) {
        rateLimitService.check("ai-search:" + userDetails.getUsername(), SEARCHES_PER_HOUR, 3600);
        return ResponseEntity.ok(askService.search(userDetails.getUsername(), request.query().trim()));
    }
}
