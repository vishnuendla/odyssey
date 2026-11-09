
package com.odyssey.service;

import com.odyssey.dto.CommentDto;
import com.odyssey.entity.Comment;
import com.odyssey.entity.Journal;
import com.odyssey.entity.User;
import com.odyssey.exception.ForbiddenException;
import com.odyssey.exception.ResourceNotFoundException;
import com.odyssey.exception.UnauthorizedException;
import com.odyssey.repository.CommentRepository;
import com.odyssey.repository.JournalRepository;
import com.odyssey.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
public class CommentService {

    private final CommentRepository commentRepository;
    private final JournalRepository journalRepository;
    private final UserRepository userRepository;

    public CommentService(CommentRepository commentRepository,
                          JournalRepository journalRepository,
                          UserRepository userRepository) {
        this.commentRepository = commentRepository;
        this.journalRepository = journalRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public CommentDto addComment(String journalId, String content, String userEmail) {
        Journal journal = journalRepository.findById(journalId)
                .orElseThrow(() -> new ResourceNotFoundException("Journal not found"));
        
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new UnauthorizedException("User not found"));
        if (!user.isEmailVerified()) {
            throw new ForbiddenException(
                    "Please verify your email address before commenting. Check your inbox for the verification link.");
        }
        
        Comment comment = new Comment();
        comment.setContent(content.trim());
        comment.setJournal(journal);
        comment.setUser(user);
        comment.setCreatedAt(LocalDateTime.now());
        
        Comment savedComment = commentRepository.save(comment);
        
        return convertToDto(savedComment);
    }

    @Transactional
    public void deleteComment(String journalId, String commentId, String userEmail) {
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new ResourceNotFoundException("Comment not found"));
        
        // Verify the comment belongs to the specified journal
        if (!comment.getJournal().getId().equals(journalId)) {
            throw new ResourceNotFoundException("Comment not found for this journal");
        }
        
        // Verify the user owns the comment or the journal
        if (!comment.getUser().getEmail().equals(userEmail) && 
            !comment.getJournal().getUser().getEmail().equals(userEmail)) {
            throw new UnauthorizedException("You do not have permission to delete this comment");
        }
        
        commentRepository.delete(comment);
    }

    private CommentDto convertToDto(Comment comment) {
        CommentDto dto = new CommentDto();
        dto.setId(comment.getId());
        dto.setContent(comment.getContent());
        dto.setUserId(comment.getUser().getId());
        dto.setUserName(comment.getUser().getName());
        dto.setUserAvatar(comment.getUser().getAvatar());
        dto.setCreatedAt(comment.getCreatedAt());
        return dto;
    }
}
