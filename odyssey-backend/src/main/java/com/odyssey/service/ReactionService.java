
package com.odyssey.service;

import com.odyssey.dto.ReactionDto;
import com.odyssey.dto.ReactionSummaryDto;
import com.odyssey.entity.Journal;
import com.odyssey.entity.Reaction;
import com.odyssey.entity.User;
import com.odyssey.exception.ResourceNotFoundException;
import com.odyssey.exception.UnauthorizedException;
import com.odyssey.repository.JournalRepository;
import com.odyssey.repository.ReactionRepository;
import com.odyssey.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class ReactionService {

    private final ReactionRepository reactionRepository;
    private final JournalRepository journalRepository;
    private final UserRepository userRepository;

    public ReactionService(ReactionRepository reactionRepository,
                           JournalRepository journalRepository,
                           UserRepository userRepository) {
        this.reactionRepository = reactionRepository;
        this.journalRepository = journalRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public List<ReactionSummaryDto> addReaction(String journalId, ReactionDto reactionDto, String userEmail) {
        Journal journal = journalRepository.findById(journalId)
                .orElseThrow(() -> new ResourceNotFoundException("Journal not found"));
        
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new UnauthorizedException("User not found"));
        
        Reaction.ReactionType reactionType;
        try {
            reactionType = Reaction.ReactionType.valueOf(reactionDto.getType().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Invalid reaction type: " + reactionDto.getType());
        }

        // Check if the user has already added this reaction
        Optional<Reaction> existingReaction = reactionRepository.findByJournalAndUserAndType(journal, user, reactionType);
        
        if (existingReaction.isEmpty()) {
            // Add new reaction
            Reaction reaction = new Reaction();
            reaction.setJournal(journal);
            reaction.setUser(user);
            reaction.setType(reactionType);
            reactionRepository.save(reaction);
        }
        
        return getReactionSummary(journal);
    }

    @Transactional
    public List<ReactionSummaryDto> removeReaction(String journalId, String reactionType, String userEmail) {
        Journal journal = journalRepository.findById(journalId)
                .orElseThrow(() -> new ResourceNotFoundException("Journal not found"));
        
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new UnauthorizedException("User not found"));
        
        Reaction.ReactionType type;
        try {
            type = Reaction.ReactionType.valueOf(reactionType.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Invalid reaction type: " + reactionType);
        }
        
        Optional<Reaction> reaction = reactionRepository.findByJournalAndUserAndType(journal, user, type);
        
        reaction.ifPresent(reactionRepository::delete);
        
        return getReactionSummary(journal);
    }

    private List<ReactionSummaryDto> getReactionSummary(Journal journal) {
        Map<Reaction.ReactionType, Long> reactionCounts = reactionRepository.findByJournal(journal).stream()
                .collect(Collectors.groupingBy(Reaction::getType, Collectors.counting()));
        
        return reactionCounts.entrySet().stream()
                .map(entry -> new ReactionSummaryDto(entry.getKey().toString().toLowerCase(), entry.getValue()))
                .collect(Collectors.toList());
    }
}
