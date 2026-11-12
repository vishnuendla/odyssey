package com.odyssey.service;

import com.odyssey.dto.AdminStatsDto;
import com.odyssey.dto.ReportDto;
import com.odyssey.dto.ReportRequest;
import com.odyssey.dto.ReportResolveRequest;
import com.odyssey.entity.Comment;
import com.odyssey.entity.Journal;
import com.odyssey.entity.Notification;
import com.odyssey.entity.Report;
import com.odyssey.entity.User;
import com.odyssey.exception.ConflictException;
import com.odyssey.exception.ResourceNotFoundException;
import com.odyssey.exception.UnauthorizedException;
import com.odyssey.repository.CommentRepository;
import com.odyssey.repository.JournalRepository;
import com.odyssey.repository.ReportRepository;
import com.odyssey.repository.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
public class ModerationService {

    private static final int MAX_PAGE_SIZE = 100;

    private final ReportRepository reportRepository;
    private final JournalRepository journalRepository;
    private final CommentRepository commentRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;
    private final ModerationAuditLogger auditLogger;

    public ModerationService(ReportRepository reportRepository,
                             JournalRepository journalRepository,
                             CommentRepository commentRepository,
                             UserRepository userRepository,
                             NotificationService notificationService,
                             ModerationAuditLogger auditLogger) {
        this.reportRepository = reportRepository;
        this.journalRepository = journalRepository;
        this.commentRepository = commentRepository;
        this.userRepository = userRepository;
        this.notificationService = notificationService;
        this.auditLogger = auditLogger;
    }

    @Transactional
    public ReportDto createReport(ReportRequest request, String reporterEmail) {
        User reporter = requireUser(reporterEmail);
        Report.TargetType targetType = parseTargetType(request.getTargetType());

        String preview;
        String authorId;
        String authorName;
        boolean targetHidden;

        if (targetType == Report.TargetType.JOURNAL) {
            Journal journal = journalRepository.findById(request.getTargetId())
                    .orElseThrow(() -> new ResourceNotFoundException("Journal not found"));
            if (journal.getUser().getId().equals(reporter.getId())) {
                throw new IllegalArgumentException("You cannot report your own journal.");
            }
            preview = journal.getTitle();
            authorId = journal.getUser().getId();
            authorName = journal.getUser().getName();
            targetHidden = journal.isHidden();
        } else {
            Comment comment = commentRepository.findById(request.getTargetId())
                    .orElseThrow(() -> new ResourceNotFoundException("Comment not found"));
            if (comment.getUser().getId().equals(reporter.getId())) {
                throw new IllegalArgumentException("You cannot report your own comment.");
            }
            preview = comment.getContent();
            authorId = comment.getUser().getId();
            authorName = comment.getUser().getName();
            targetHidden = comment.isHidden();
        }

        if (reportRepository.existsByReporterIdAndTargetTypeAndTargetIdAndStatus(
                reporter.getId(), targetType, request.getTargetId(), Report.Status.OPEN)) {
            throw new ConflictException("You already have an open report for this content.");
        }

        Report report = new Report();
        report.setReporter(reporter);
        report.setTargetType(targetType);
        report.setTargetId(request.getTargetId());
        report.setReason(request.getReason().trim().toUpperCase());
        report.setDetails(request.getDetails() == null ? null : request.getDetails().trim());
        report.setStatus(Report.Status.OPEN);
        report.setCreatedAt(LocalDateTime.now());
        Report saved = reportRepository.save(report);

        return convertToDto(saved, preview, authorId, authorName, targetHidden);
    }

    @Transactional(readOnly = true)
    public Page<ReportDto> listReports(String status, int page, int size) {
        Pageable pageable = PageRequest.of(Math.max(page, 0), Math.min(Math.max(size, 1), MAX_PAGE_SIZE));
        Page<Report> reports;
        if (status == null || status.isBlank() || "ALL".equalsIgnoreCase(status)) {
            reports = reportRepository.findAllByOrderByCreatedAtDesc(pageable);
        } else {
            Report.Status parsed;
            try {
                parsed = Report.Status.valueOf(status.trim().toUpperCase());
            } catch (IllegalArgumentException e) {
                throw new IllegalArgumentException("Unknown report status: " + status);
            }
            reports = reportRepository.findByStatusOrderByCreatedAtDesc(parsed, pageable);
        }
        return reports.map(this::convertToDto);
    }

    @Transactional
    public ReportDto resolveReport(String reportId, ReportResolveRequest request, String adminEmail) {
        User admin = requireUser(adminEmail);
        Report report = reportRepository.findById(reportId)
                .orElseThrow(() -> new ResourceNotFoundException("Report not found"));
        if (report.getStatus() != Report.Status.OPEN) {
            throw new ConflictException("This report has already been reviewed.");
        }

        Report.Status status;
        if ("HIDE".equalsIgnoreCase(request.getAction())) {
            hideTarget(report.getTargetType(), report.getTargetId(), true);
            status = Report.Status.RESOLVED;
        } else if ("DISMISS".equalsIgnoreCase(request.getAction())) {
            status = Report.Status.DISMISSED;
        } else {
            throw new IllegalArgumentException("Action must be HIDE or DISMISS.");
        }

        report.setStatus(status);
        report.setResolvedAt(LocalDateTime.now());
        report.setResolvedBy(admin);
        report.setResolutionNote(request.getNote());
        reportRepository.save(report);

        auditLogger.reportResolved(adminEmail, report.getId(), report.getTargetType().name(),
                report.getTargetId(), request.getAction().toUpperCase(),
                request.getNote());

        // Close every other open report for the same content without scanning all reports.
        for (Report other : reportRepository.findByTargetTypeAndTargetIdAndStatusAndIdNot(
                report.getTargetType(), report.getTargetId(), Report.Status.OPEN, report.getId())) {
            other.setStatus(status);
            other.setResolvedAt(LocalDateTime.now());
            other.setResolvedBy(admin);
            other.setResolutionNote("Closed with report " + report.getId());
            reportRepository.save(other);
        }

        return convertToDto(report);
    }

    @Transactional
    public void setJournalHidden(String journalId, boolean hidden, String adminEmail) {
        Journal journal = journalRepository.findById(journalId)
                .orElseThrow(() -> new ResourceNotFoundException("Journal not found"));
        boolean changed = journal.isHidden() != hidden;
        journal.setHidden(hidden);
        journalRepository.save(journal);
        auditLogger.visibilityChanged(adminEmail, Report.TargetType.JOURNAL.name(), journalId, hidden);
        if (changed && hidden) {
            notificationService.notifySystem(journal.getUser(), Notification.Type.MODERATION,
                    journal.getId(), null,
                    "Your journal \"" + journal.getTitle() + "\" was hidden by a moderator.");
        }
    }

    @Transactional
    public void setCommentHidden(String commentId, boolean hidden, String adminEmail) {
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new ResourceNotFoundException("Comment not found"));
        boolean changed = comment.isHidden() != hidden;
        comment.setHidden(hidden);
        commentRepository.save(comment);
        auditLogger.visibilityChanged(adminEmail, Report.TargetType.COMMENT.name(), commentId, hidden);
        if (changed && hidden) {
            notificationService.notifySystem(comment.getUser(), Notification.Type.MODERATION,
                    comment.getJournal().getId(), comment.getId(),
                    "A comment of yours was hidden by a moderator.");
        }
    }

    @Transactional(readOnly = true)
    public AdminStatsDto stats() {
        AdminStatsDto dto = new AdminStatsDto();
        dto.setUsers(userRepository.count());
        dto.setJournals(journalRepository.count());
        dto.setPublicJournals(journalRepository.countByIsPublicTrueAndHiddenFalse());
        dto.setComments(commentRepository.count());
        dto.setOpenReports(reportRepository.countByStatus(Report.Status.OPEN));
        return dto;
    }

    private void hideTarget(Report.TargetType targetType, String targetId, boolean hidden) {
        if (targetType == Report.TargetType.JOURNAL) {
            Journal journal = journalRepository.findById(targetId)
                    .orElseThrow(() -> new ResourceNotFoundException("Journal not found"));
            boolean changed = journal.isHidden() != hidden;
            journal.setHidden(hidden);
            journalRepository.save(journal);
            if (changed && hidden) {
                notificationService.notifySystem(journal.getUser(), Notification.Type.MODERATION,
                        journal.getId(), null,
                        "Your journal \"" + journal.getTitle() + "\" was hidden after a moderation review.");
            }
        } else {
            Comment comment = commentRepository.findById(targetId)
                    .orElseThrow(() -> new ResourceNotFoundException("Comment not found"));
            boolean changed = comment.isHidden() != hidden;
            comment.setHidden(hidden);
            commentRepository.save(comment);
            if (changed && hidden) {
                notificationService.notifySystem(comment.getUser(), Notification.Type.MODERATION,
                        comment.getJournal().getId(), comment.getId(),
                        "A comment of yours was hidden after a moderation review.");
            }
        }
    }

    private ReportDto convertToDto(Report report) {
        String preview = null;
        String authorId = null;
        String authorName = null;
        boolean targetHidden = false;

        if (report.getTargetType() == Report.TargetType.JOURNAL) {
            Journal journal = journalRepository.findById(report.getTargetId()).orElse(null);
            if (journal != null) {
                preview = journal.getTitle();
                authorId = journal.getUser().getId();
                authorName = journal.getUser().getName();
                targetHidden = journal.isHidden();
            }
        } else {
            Comment comment = commentRepository.findById(report.getTargetId()).orElse(null);
            if (comment != null) {
                preview = comment.getContent();
                authorId = comment.getUser().getId();
                authorName = comment.getUser().getName();
                targetHidden = comment.isHidden();
            }
        }

        return convertToDto(report, preview, authorId, authorName, targetHidden);
    }

    private ReportDto convertToDto(Report report, String preview, String authorId,
                                   String authorName, boolean targetHidden) {
        ReportDto dto = new ReportDto();
        dto.setId(report.getId());
        dto.setReporterId(report.getReporter().getId());
        dto.setReporterName(report.getReporter().getName());
        dto.setTargetType(report.getTargetType().name());
        dto.setTargetId(report.getTargetId());
        dto.setTargetPreview(preview);
        dto.setTargetAuthorId(authorId);
        dto.setTargetAuthorName(authorName);
        dto.setTargetHidden(targetHidden);
        dto.setReason(report.getReason());
        dto.setDetails(report.getDetails());
        dto.setStatus(report.getStatus().name());
        dto.setCreatedAt(report.getCreatedAt());
        dto.setResolvedAt(report.getResolvedAt());
        dto.setResolvedByName(report.getResolvedBy() == null ? null : report.getResolvedBy().getName());
        dto.setResolutionNote(report.getResolutionNote());
        return dto;
    }

    private Report.TargetType parseTargetType(String value) {
        try {
            return Report.TargetType.valueOf(value.trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Target type must be JOURNAL or COMMENT.");
        }
    }

    private User requireUser(String email) {
        return userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new UnauthorizedException("User not found"));
    }
}
