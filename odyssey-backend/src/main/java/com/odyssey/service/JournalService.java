package com.odyssey.service;

import com.odyssey.dto.*;
import com.odyssey.entity.*;
import com.odyssey.exception.ForbiddenException;
import com.odyssey.exception.ResourceNotFoundException;
import com.odyssey.exception.UnauthorizedException;
import com.odyssey.repository.*;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class JournalService {

    private static final int MAX_TAGS = 8;

    private final JournalRepository journalRepository;
    private final UserRepository userRepository;
    private final LocationRepository locationRepository;
    private final ImageRepository imageRepository;
    private final BookmarkRepository bookmarkRepository;
    private final NotificationRepository notificationRepository;
    private final ReportRepository reportRepository;
    private final NotificationService notificationService;
    private final StorageService storageService;

    public JournalService(JournalRepository journalRepository,
                          UserRepository userRepository,
                          LocationRepository locationRepository,
                          ImageRepository imageRepository,
                          BookmarkRepository bookmarkRepository,
                          NotificationRepository notificationRepository,
                          ReportRepository reportRepository,
                          NotificationService notificationService,
                          StorageService storageService) {
        this.journalRepository = journalRepository;
        this.userRepository = userRepository;
        this.locationRepository = locationRepository;
        this.imageRepository = imageRepository;
        this.bookmarkRepository = bookmarkRepository;
        this.notificationRepository = notificationRepository;
        this.reportRepository = reportRepository;
        this.notificationService = notificationService;
        this.storageService = storageService;
    }

    @Transactional(readOnly = true)
    public List<JournalDto> getAllJournals(String userEmail) {
        User viewer = requireUser(userEmail);
        Set<String> bookmarked = bookmarkRepository.findJournalIdsByUserId(viewer.getId());
        List<Journal> journals = viewer.isAdmin()
                ? journalRepository.findAll()
                : journalRepository.findVisibleToUser(viewer.getId());
        return journals.stream()
                .map(journal -> convertToDto(journal, bookmarked))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Page<JournalDto> getPublicJournals(Pageable pageable, String userEmail) {
        Set<String> bookmarked = bookmarkedJournalIds(userEmail);
        return journalRepository.findByIsPublicTrueAndHiddenFalse(pageable)
                .map(journal -> convertToDto(journal, bookmarked));
    }

    @Transactional(readOnly = true)
    public Page<JournalDto> searchPublicJournals(String query, String tag, String location,
                                                 Pageable pageable, String userEmail) {
        Set<String> bookmarked = bookmarkedJournalIds(userEmail);
        String viewerId = userEmail == null ? null
                : userRepository.findByEmailIgnoreCase(userEmail).map(User::getId).orElse(null);
        return journalRepository.searchPublic(
                        blankToNull(query), blankToNull(tag), blankToNull(location), viewerId, pageable)
                .map(journal -> convertToDto(journal, bookmarked));
    }

    @Transactional(readOnly = true)
    @Cacheable(cacheNames = "publicTags", key = "'all'")
    public List<String> getPopularTags() {
        return journalRepository.findPublicTags();
    }

    @Transactional(readOnly = true)
    public List<JournalDto> getUserJournals(String userEmail) {
        User user = requireUser(userEmail);
        Set<String> bookmarked = bookmarkRepository.findJournalIdsByUserId(user.getId());
        return journalRepository.findByUserOrderByCreatedAtDesc(user).stream()
                .map(journal -> convertToDto(journal, bookmarked))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<JournalDto> getPublicUserJournals(String userId, String viewerEmail) {
        if (!userRepository.existsById(userId)) {
            throw new ResourceNotFoundException("User not found");
        }
        Set<String> bookmarked = bookmarkedJournalIds(viewerEmail);
        return journalRepository.findByUserIdAndIsPublicTrueAndHiddenFalseOrderByCreatedAtDesc(userId).stream()
                .map(journal -> convertToDto(journal, bookmarked))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<JournalDto> getBookmarkedJournals(String userEmail) {
        User user = requireUser(userEmail);
        Set<String> bookmarked = bookmarkRepository.findJournalIdsByUserId(user.getId());
        return bookmarkRepository.findByUserIdOrderByCreatedAtDesc(user.getId()).stream()
                .map(Bookmark::getJournal)
                .filter(journal -> journal.isPublic() && !journal.isHidden())
                .map(journal -> convertToDto(journal, bookmarked))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public JournalDto getJournalById(String id, String userEmail) {
        Journal journal = journalRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Journal not found"));

        User viewer = userEmail == null ? null : userRepository.findByEmailIgnoreCase(userEmail).orElse(null);
        boolean isOwner = viewer != null && journal.getUser().getId().equals(viewer.getId());
        boolean isAdmin = viewer != null && viewer.isAdmin();

        if (journal.isHidden() && !isOwner && !isAdmin) {
            throw new ResourceNotFoundException("Journal not found");
        }
        if (!journal.isPublic() && !isOwner && !isAdmin) {
            throw new UnauthorizedException("You do not have permission to view this journal");
        }

        return convertToDto(journal, bookmarkedJournalIds(userEmail));
    }

    @Transactional(readOnly = true)
    public JournalDto shareJournal(String id, String userEmail) {
        Journal journal = journalRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Journal not found"));

        User viewer = userEmail == null ? null : userRepository.findByEmailIgnoreCase(userEmail).orElse(null);
        boolean isOwner = viewer != null && journal.getUser().getId().equals(viewer.getId());
        if ((!journal.isPublic() || journal.isHidden()) && !isOwner
                && (viewer == null || !viewer.isAdmin())) {
            throw new UnauthorizedException("You do not have permission to share this journal");
        }

        return convertToDto(journal, bookmarkedJournalIds(userEmail));
    }

    @Transactional
    @CacheEvict(cacheNames = {"publicTags", "userProfiles"}, allEntries = true)
    public JournalDto createJournal(JournalRequest journalRequest, String userEmail) {
        User user = requireUser(userEmail);
        requireVerified(user);

        Journal journal = new Journal();
        journal.setTitle(journalRequest.getTitle());
        journal.setContent(journalRequest.getContent());
        journal.setPublic(journalRequest.getIsPublic());
        journal.setUser(user);
        journal.setCreatedAt(LocalDateTime.now());
        journal.setUpdatedAt(LocalDateTime.now());
        journal.setTags(normalizeTags(journalRequest.getTags()));

        Journal savedJournal = journalRepository.save(journal);

        if (journalRequest.getLocation() != null) {
            Location location = new Location();
            location.setName(journalRequest.getLocation().getName());
            location.setLatitude(journalRequest.getLocation().getLatitude());
            location.setLongitude(journalRequest.getLocation().getLongitude());
            location.setCountry(journalRequest.getLocation().getCountry());
            location.setCity(journalRequest.getLocation().getCity());
            location.setJournal(savedJournal);
            locationRepository.save(location);
            savedJournal.setLocation(location);
        }

        if (journalRequest.getImages() != null && !journalRequest.getImages().isEmpty()) {
            for (String imageUrl : journalRequest.getImages()) {
                Image image = new Image();
                image.setUrl(imageUrl);
                image.setJournal(savedJournal);
                imageRepository.save(image);
                savedJournal.getImages().add(image);
            }
        }

        return convertToDto(savedJournal, Set.of());
    }

    @Transactional
    @CacheEvict(cacheNames = {"publicTags", "userProfiles"}, allEntries = true)
    public JournalDto updateJournal(String id, JournalRequest journalRequest, String userEmail) {
        Journal journal = journalRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Journal not found"));

        if (!journal.getUser().getEmail().equalsIgnoreCase(userEmail)) {
            throw new UnauthorizedException("You do not have permission to update this journal");
        }
        requireVerified(journal.getUser());

        journal.setTitle(journalRequest.getTitle());
        journal.setContent(journalRequest.getContent());
        journal.setPublic(journalRequest.getIsPublic());
        journal.setUpdatedAt(LocalDateTime.now());
        journal.getTags().clear();
        journal.getTags().addAll(normalizeTags(journalRequest.getTags()));

        if (journalRequest.getLocation() != null) {
            if (journal.getLocation() == null) {
                Location location = new Location();
                location.setJournal(journal);
                journal.setLocation(location);
            }

            journal.getLocation().setName(journalRequest.getLocation().getName());
            journal.getLocation().setLatitude(journalRequest.getLocation().getLatitude());
            journal.getLocation().setLongitude(journalRequest.getLocation().getLongitude());
            journal.getLocation().setCountry(journalRequest.getLocation().getCountry());
            journal.getLocation().setCity(journalRequest.getLocation().getCity());
        }

        if (journalRequest.getImages() != null) {
            List<String> removedImageUrls = journal.getImages().stream()
                    .map(Image::getUrl)
                    .filter(url -> !journalRequest.getImages().contains(url))
                    .collect(Collectors.toList());

            imageRepository.deleteAll(journal.getImages());
            journal.getImages().clear();

            for (String imageUrl : journalRequest.getImages()) {
                Image image = new Image();
                image.setUrl(imageUrl);
                image.setJournal(journal);
                journal.getImages().add(image);
            }

            storageService.deleteFilesAfterCommit(removedImageUrls);
        }

        Journal updatedJournal = journalRepository.save(journal);
        return convertToDto(updatedJournal, bookmarkedJournalIds(userEmail));
    }

    @Transactional
    @CacheEvict(cacheNames = {"publicTags", "userProfiles"}, allEntries = true)
    public void deleteJournal(String id, String userEmail) {
        Journal journal = journalRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Journal not found"));

        if (!journal.getUser().getEmail().equalsIgnoreCase(userEmail)) {
            throw new UnauthorizedException("You do not have permission to delete this journal");
        }

        List<String> imageUrls = journal.getImages().stream()
                .map(Image::getUrl)
                .collect(Collectors.toList());
        bookmarkRepository.deleteByJournalId(journal.getId());
        notificationRepository.deleteByJournalId(journal.getId());
        reportRepository.deleteByTarget(Report.TargetType.JOURNAL, journal.getId());
        journalRepository.delete(journal);
        storageService.deleteFilesAfterCommit(imageUrls);
    }

    @Transactional
    public JournalDto addBookmark(String id, String userEmail) {
        User user = requireUser(userEmail);
        Journal journal = journalRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Journal not found"));
        if (!journal.isPublic() || journal.isHidden()) {
            throw new ResourceNotFoundException("Journal not found");
        }

        bookmarkRepository.findByUserIdAndJournalId(user.getId(), journal.getId())
                .orElseGet(() -> {
                    Bookmark bookmark = new Bookmark();
                    bookmark.setUser(user);
                    bookmark.setJournal(journal);
                    bookmark.setCreatedAt(LocalDateTime.now());
                    notificationService.notify(journal.getUser(), user, Notification.Type.BOOKMARK,
                            journal.getId(), null, user.getName() + " saved your journal.");
                    return bookmarkRepository.save(bookmark);
                });

        return convertToDto(journal, Set.of(journal.getId()));
    }

    @Transactional
    public JournalDto removeBookmark(String id, String userEmail) {
        User user = requireUser(userEmail);
        Journal journal = journalRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Journal not found"));

        bookmarkRepository.findByUserIdAndJournalId(user.getId(), journal.getId())
                .ifPresent(bookmarkRepository::delete);

        return convertToDto(journal, Set.of());
    }

    private Set<String> bookmarkedJournalIds(String userEmail) {
        if (userEmail == null) {
            return Set.of();
        }
        return userRepository.findByEmailIgnoreCase(userEmail)
                .map(user -> bookmarkRepository.findJournalIdsByUserId(user.getId()))
                .orElseGet(Set::of);
    }

    private Set<String> normalizeTags(List<String> tags) {
        if (tags == null) {
            return new LinkedHashSet<>();
        }
        return tags.stream()
                .filter(Objects::nonNull)
                .map(tag -> tag.trim().toLowerCase(Locale.ROOT))
                .filter(tag -> !tag.isEmpty())
                .distinct()
                .limit(MAX_TAGS)
                .collect(Collectors.toCollection(LinkedHashSet::new));
    }

    private JournalDto convertToDto(Journal journal, Set<String> bookmarkedJournalIds) {
        JournalDto dto = new JournalDto();
        dto.setId(journal.getId());
        dto.setTitle(journal.getTitle());
        dto.setContent(journal.getContent());
        dto.setIsPublic(journal.isPublic());
        dto.setHidden(journal.isHidden());
        dto.setCreatedAt(journal.getCreatedAt());
        dto.setUpdatedAt(journal.getUpdatedAt());
        dto.setUserId(journal.getUser().getId());
        dto.setUserName(journal.getUser().getName());
        dto.setUserAvatar(journal.getUser().getAvatar());
        dto.setBookmarked(bookmarkedJournalIds.contains(journal.getId()));
        dto.setTags(new ArrayList<>(journal.getTags()));

        if (journal.getLocation() != null) {
            LocationDto locationDto = new LocationDto();
            locationDto.setId(journal.getLocation().getId());
            locationDto.setName(journal.getLocation().getName());
            locationDto.setLatitude(journal.getLocation().getLatitude());
            locationDto.setLongitude(journal.getLocation().getLongitude());
            locationDto.setCountry(journal.getLocation().getCountry());
            locationDto.setCity(journal.getLocation().getCity());
            dto.setLocation(locationDto);
        }

        dto.setImages(journal.getImages().stream()
                .map(Image::getUrl)
                .collect(Collectors.toList()));

        dto.setComments(journal.getComments().stream()
                .filter(comment -> !comment.isHidden()
                        && (comment.getParent() == null || !comment.getParent().isHidden()))
                .map(comment -> {
                    CommentDto commentDto = new CommentDto();
                    commentDto.setId(comment.getId());
                    commentDto.setContent(comment.getContent());
                    commentDto.setUserId(comment.getUser().getId());
                    commentDto.setUserName(comment.getUser().getName());
                    commentDto.setUserAvatar(comment.getUser().getAvatar());
                    commentDto.setCreatedAt(comment.getCreatedAt());
                    commentDto.setParentId(comment.getParent() == null ? null : comment.getParent().getId());
                    return commentDto;
                }).collect(Collectors.toList()));

        Map<Reaction.ReactionType, Long> reactionCounts = journal.getReactions().stream()
                .collect(Collectors.groupingBy(Reaction::getType, Collectors.counting()));

        List<ReactionSummaryDto> reactionSummaries = new ArrayList<>();
        for (Map.Entry<Reaction.ReactionType, Long> entry : reactionCounts.entrySet()) {
            reactionSummaries.add(new ReactionSummaryDto(
                    entry.getKey().toString().toLowerCase(),
                    entry.getValue()
            ));
        }
        dto.setReactions(reactionSummaries);

        return dto;
    }

    private User requireUser(String email) {
        return userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new UnauthorizedException("User not found"));
    }

    private void requireVerified(User user) {
        if (!user.isEmailVerified()) {
            throw new ForbiddenException("Please verify your email address before publishing journals. "
                    + "Check your inbox for the verification link.");
        }
    }

    private String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
