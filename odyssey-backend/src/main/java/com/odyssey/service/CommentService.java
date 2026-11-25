package com.odyssey.service;

import com.odyssey.dto.CommentAttachmentDto;
import com.odyssey.dto.CommentDto;
import com.odyssey.entity.Comment;
import com.odyssey.entity.CommentAttachment;
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
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

@Service
public class CommentService {

    private static final int MAX_ATTACHMENTS = StorageService.MAX_COMMENT_MEDIA_FILES;

    private final CommentRepository commentRepository;
    private final JournalRepository journalRepository;
    private final UserRepository userRepository;
    private final NotificationRepository notificationRepository;
    private final ReportRepository reportRepository;
    private final NotificationService notificationService;
    private final StorageService storageService;

    public CommentService(CommentRepository commentRepository,
                          JournalRepository journalRepository,
                          UserRepository userRepository,
                          NotificationRepository notificationRepository,
                          ReportRepository reportRepository,
                          NotificationService notificationService,
                          StorageService storageService) {
        this.commentRepository = commentRepository;
        this.journalRepository = journalRepository;
        this.userRepository = userRepository;
        this.notificationRepository = notificationRepository;
        this.reportRepository = reportRepository;
        this.notificationService = notificationService;
        this.storageService = storageService;
    }

    @Transactional
    public CommentDto addComment(String journalId, String content, String parentId,
                                 List<String> attachmentUrls, String userEmail) {
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

        String text = content == null ? "" : content.trim();
        List<AttachmentSpec> attachments = normalizeAttachments(attachmentUrls);
        if (text.isEmpty() && attachments.isEmpty()) {
            throw new IllegalArgumentException("Write a comment or attach a photo, GIF or video.");
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
        comment.setContent(text);
        comment.setJournal(journal);
        comment.setUser(user);
        comment.setParent(parent);
        comment.setCreatedAt(LocalDateTime.now());

        int position = 0;
        for (AttachmentSpec spec : attachments) {
            CommentAttachment attachment = new CommentAttachment();
            attachment.setUrl(spec.url());
            attachment.setMediaType(spec.type());
            attachment.setPosition(position++);
            comment.addAttachment(attachment);
        }

        Comment savedComment = commentRepository.save(comment);
        List<CommentAttachment.MediaType> mediaTypes = attachments.stream()
                .map(AttachmentSpec::type)
                .toList();
        String preview = preview(savedComment.getContent(), mediaTypes);

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

        List<String> mediaUrls = new ArrayList<>();
        deleteCommentTree(comment, mediaUrls);
        storageService.deleteFilesAfterCommit(mediaUrls);
    }

    private void deleteCommentTree(Comment comment, List<String> mediaUrls) {
        for (Comment reply : commentRepository.findByParentIdOrderByCreatedAtAsc(comment.getId())) {
            deleteCommentTree(reply, mediaUrls);
        }
        comment.getAttachments().forEach(attachment -> mediaUrls.add(attachment.getUrl()));
        notificationRepository.deleteByCommentId(comment.getId());
        reportRepository.deleteByTarget(Report.TargetType.COMMENT, comment.getId());
        commentRepository.delete(comment);
    }

    private List<AttachmentSpec> normalizeAttachments(List<String> attachmentUrls) {
        if (attachmentUrls == null || attachmentUrls.isEmpty()) {
            return List.of();
        }
        if (attachmentUrls.size() > MAX_ATTACHMENTS) {
            throw new IllegalArgumentException(
                    "You can attach up to " + MAX_ATTACHMENTS + " media files to a comment.");
        }

        Set<String> seen = new LinkedHashSet<>();
        List<AttachmentSpec> specs = new ArrayList<>();
        int videos = 0;

        for (String rawUrl : attachmentUrls) {
            String url = rawUrl == null ? "" : rawUrl.trim();
            CommentAttachment.MediaType type = StorageService.classifyCommentMedia(url);
            if (type == null) {
                throw new IllegalArgumentException("Comment media must be uploaded through Odyssey.");
            }
            if (!seen.add(url)) {
                throw new IllegalArgumentException("That media is already attached.");
            }
            if (type == CommentAttachment.MediaType.VIDEO) {
                videos++;
                if (videos > 1) {
                    throw new IllegalArgumentException("You can attach one video per comment.");
                }
            }
            specs.add(new AttachmentSpec(url, type));
        }

        return specs;
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
        dto.setAttachments(comment.getAttachments().stream()
                .map(attachment -> new CommentAttachmentDto(
                        attachment.getUrl(), attachment.getMediaType().name()))
                .toList());
        return dto;
    }

    private String preview(String content, List<CommentAttachment.MediaType> mediaTypes) {
        if (content == null || content.isBlank()) {
            if (mediaTypes.isEmpty()) {
                return "a comment";
            }
            return switch (mediaTypes.get(0)) {
                case GIF -> "a GIF";
                case VIDEO -> "a video";
                case IMAGE -> "a photo";
            };
        }
        return content.length() <= 80 ? content : content.substring(0, 77) + "...";
    }

    private User requireUser(String email) {
        return userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new UnauthorizedException("User not found"));
    }

    private record AttachmentSpec(String url, CommentAttachment.MediaType type) {
    }
}
