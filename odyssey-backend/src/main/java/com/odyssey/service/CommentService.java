package com.odyssey.service;

import com.odyssey.dto.CommentDto;
import com.odyssey.entity.Comment;
import com.odyssey.entity.Journal;
import com.odyssey.entity.Notification;
import com.odyssey.entity.Report;
import com.odyssey.entity.User;
import com.odyssey.exception.ForbiddenException;
import com.odyssey.exception.ResourceNotFoundException;
import com.odyssey.exception.UnauthorizedException;
import com.odyssey.repository.CommentRepository;
import com.odyssey.repository.JournalRepository;
import com.odyssey.repository.NotificationRepository;
import com.odyssey.repository.ReportRepository;
import com.odyssey.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
public class CommentService {

    private final CommentRepository commentRepository;
    private final JournalRepository journalRepository;
    private final UserRepository userRepository;
    private final NotificationRepository notificationRepository;
    private final ReportRepository reportRepository;
    private final NotificationService notificationService;

    public CommentService(CommentRepository commentRepository,
                          JournalRepository journalRepository,
                          UserRepository userRepository,
                          NotificationRepository notificationRepository,
                          ReportRepository reportRepository,
                          NotificationService notificationService) {
        this.commentRepository = commentRepository;
        this.journalRepository = journalRepository;
        this.userRepository = userRepository;
        this.notificationRepository = notificationRepository;
        this.reportRepository = reportRepository;
        this.notificationService = notificationService;
    }

    @Transactional
    public CommentDto addComment(String journalId, String content, String parentId, String userEmail) {
        Journal journal = journalRepository.findById(journalId)
                .orElseThrow(() -> new ResourceNotFoundException("Journal not found"));

        User user = requireUser(userEmail);
        if (!user.isEmailVerified()) {
            throw new ForbiddenException(
                    "Please verify your email address before commenting. Check your inbox for the verification link.");
        }

        boolean isOwner = journal.getUser().getId().equals(user.getId());
        if (journal.isHidden() && !isOwner && !user.isAdmin()) {
            throw new ResourceNotFoundException("Journal not found");
        }
        if (!journal.isPublic() && !isOwner && !user.isAdmin()) {
            throw new ResourceNotFoundException("Journal not found");
        }

        Comment parent = null;
        if (parentId != null && !parentId.isBlank()) {
            parent = commentRepository.findById(parentId)
                    .orElseThrow(() -> new ResourceNotFoundException("Parent comment not found"));
            if (!parent.getJournal().getId().equals(journalId)) {
                throw new IllegalArgumentException("The reply target belongs to another journal.");
            }
            if (parent.getParent() != null) {
                throw new IllegalArgumentException("Replies can only be one level deep.");
            }
            if (parent.isHidden() && !user.isAdmin()) {
                throw new ResourceNotFoundException("Parent comment not found");
            }
        }

        Comment comment = new Comment();
        comment.setContent(content.trim());
        comment.setJournal(journal);
        comment.setUser(user);
        comment.setParent(parent);
        comment.setCreatedAt(LocalDateTime.now());

        Comment savedComment = commentRepository.save(comment);
        String preview = preview(savedComment.getContent());

        if (parent != null) {
            notificationService.notify(parent.getUser(), user, Notification.Type.REPLY,
                    journal.getId(), savedComment.getId(), user.getName() + " replied: \"" + preview + "\"");
            if (!parent.getUser().getId().equals(journal.getUser().getId())) {
                notificationService.notify(journal.getUser(), user, Notification.Type.COMMENT,
                        journal.getId(), savedComment.getId(), user.getName() + " commented: \"" + preview + "\"");
            }
        } else {
            notificationService.notify(journal.getUser(), user, Notification.Type.COMMENT,
                    journal.getId(), savedComment.getId(), user.getName() + " commented: \"" + preview + "\"");
        }

        return convertToDto(savedComment);
    }

    @Transactional
    public void deleteComment(String journalId, String commentId, String userEmail) {
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new ResourceNotFoundException("Comment not found"));

        if (!comment.getJournal().getId().equals(journalId)) {
            throw new ResourceNotFoundException("Comment not found for this journal");
        }

        User user = requireUser(userEmail);
        boolean canModerate = comment.getUser().getId().equals(user.getId())
                || comment.getJournal().getUser().getId().equals(user.getId())
                || user.isAdmin();
        if (!canModerate) {
            throw new ForbiddenException("You do not have permission to delete this comment");
        }

        deleteCommentTree(comment);
    }

    private void deleteCommentTree(Comment comment) {
        for (Comment reply : commentRepository.findByParentIdOrderByCreatedAtAsc(comment.getId())) {
            deleteCommentTree(reply);
        }
        notificationRepository.deleteByCommentId(comment.getId());
        reportRepository.deleteByTarget(Report.TargetType.COMMENT, comment.getId());
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
        dto.setParentId(comment.getParent() == null ? null : comment.getParent().getId());
        return dto;
    }

    private String preview(String content) {
        return content.length() <= 80 ? content : content.substring(0, 77) + "...";
    }

    private User requireUser(String email) {
        return userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new UnauthorizedException("User not found"));
    }
}
