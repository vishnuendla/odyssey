package com.odyssey.service;

import com.odyssey.dto.PublicUserDto;
import com.odyssey.entity.Follow;
import com.odyssey.entity.Notification;
import com.odyssey.entity.User;
import com.odyssey.exception.ResourceNotFoundException;
import com.odyssey.exception.UnauthorizedException;
import com.odyssey.repository.FollowRepository;
import com.odyssey.repository.JournalRepository;
import com.odyssey.repository.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;

@Service
public class FollowService {

    private final FollowRepository followRepository;
    private final UserRepository userRepository;
    private final JournalRepository journalRepository;
    private final NotificationService notificationService;

    public FollowService(FollowRepository followRepository,
                         UserRepository userRepository,
                         JournalRepository journalRepository,
                         NotificationService notificationService) {
        this.followRepository = followRepository;
        this.userRepository = userRepository;
        this.journalRepository = journalRepository;
        this.notificationService = notificationService;
    }

    @Transactional
    public PublicUserDto follow(String targetId, String email) {
        User follower = requireUser(email);
        User target = requireUserById(targetId);
        if (follower.getId().equals(target.getId())) {
            throw new IllegalArgumentException("You cannot follow yourself.");
        }

        followRepository.findByFollowerIdAndFollowingId(follower.getId(), target.getId())
                .orElseGet(() -> {
                    Follow follow = new Follow();
                    follow.setFollower(follower);
                    follow.setFollowing(target);
                    follow.setCreatedAt(LocalDateTime.now());
                    notificationService.notify(target, follower, Notification.Type.FOLLOW,
                            null, null, follower.getName() + " started following you.");
                    return followRepository.save(follow);
                });

        return convertToDto(target, follower.getId());
    }

    @Transactional
    public PublicUserDto unfollow(String targetId, String email) {
        User follower = requireUser(email);
        User target = requireUserById(targetId);

        followRepository.findByFollowerIdAndFollowingId(follower.getId(), target.getId())
                .ifPresent(followRepository::delete);

        return convertToDto(target, follower.getId());
    }

    @Transactional(readOnly = true)
    public PublicUserDto getProfile(String targetId, String viewerEmail) {
        User target = requireUserById(targetId);
        User viewer = viewerEmail == null ? null : userRepository.findByEmailIgnoreCase(viewerEmail).orElse(null);
        return convertToDto(target, viewer == null ? null : viewer.getId());
    }

    @Transactional(readOnly = true)
    public Page<PublicUserDto> followers(String targetId, Pageable pageable, String viewerEmail) {
        requireUserById(targetId);
        String viewerId = viewerId(viewerEmail);
        Page<Follow> page = followRepository.findByFollowingIdOrderByCreatedAtDesc(targetId, pageable);
        return mapBatched(page, Follow::getFollower, viewerId);
    }

    @Transactional(readOnly = true)
    public Page<PublicUserDto> following(String targetId, Pageable pageable, String viewerEmail) {
        requireUserById(targetId);
        String viewerId = viewerId(viewerEmail);
        Page<Follow> page = followRepository.findByFollowerIdOrderByCreatedAtDesc(targetId, pageable);
        return mapBatched(page, Follow::getFollowing, viewerId);
    }

    /**
     * Converts a page of follow rows with four aggregate queries in total instead
     * of the per-user counts {@link #convertToDto} issues (4N).
     */
    private Page<PublicUserDto> mapBatched(Page<Follow> page,
                                           Function<Follow, User> userOf,
                                           String viewerId) {
        List<String> userIds = page.getContent().stream()
                .map(userOf)
                .map(User::getId)
                .toList();
        if (userIds.isEmpty()) {
            return page.map(follow -> convertToDto(userOf.apply(follow), viewerId));
        }

        Map<String, Long> journals = toCountMap(journalRepository.countPublicJournalsByUserIds(userIds));
        Map<String, Long> followers = toCountMap(followRepository.countFollowersByFollowingIds(userIds));
        Map<String, Long> following = toCountMap(followRepository.countFollowingByFollowerIds(userIds));
        Set<String> followedByViewer = viewerId == null
                ? Set.of()
                : new HashSet<>(followRepository.findFollowingIds(viewerId, userIds));

        return page.map(follow -> {
            User user = userOf.apply(follow);
            PublicUserDto dto = baseDto(user);
            dto.setJournalsCount(journals.getOrDefault(user.getId(), 0L));
            dto.setFollowersCount(followers.getOrDefault(user.getId(), 0L));
            dto.setFollowingCount(following.getOrDefault(user.getId(), 0L));
            dto.setFollowing(followedByViewer.contains(user.getId()));
            return dto;
        });
    }

    private Map<String, Long> toCountMap(List<Object[]> rows) {
        Map<String, Long> counts = new HashMap<>();
        for (Object[] row : rows) {
            counts.put((String) row[0], ((Number) row[1]).longValue());
        }
        return counts;
    }

    private String viewerId(String viewerEmail) {
        if (viewerEmail == null) {
            return null;
        }
        return userRepository.findByEmailIgnoreCase(viewerEmail)
                .map(User::getId)
                .orElse(null);
    }

    public PublicUserDto convertToDto(User user, String viewerId) {
        PublicUserDto dto = baseDto(user);
        dto.setJournalsCount(journalRepository.countByUserIdAndIsPublicTrueAndHiddenFalse(user.getId()));
        dto.setFollowersCount(followRepository.countByFollowingId(user.getId()));
        dto.setFollowingCount(followRepository.countByFollowerId(user.getId()));
        dto.setFollowing(viewerId != null
                && followRepository.existsByFollowerIdAndFollowingId(viewerId, user.getId()));
        return dto;
    }

    private PublicUserDto baseDto(User user) {
        PublicUserDto dto = new PublicUserDto();
        dto.setId(user.getId());
        dto.setName(user.getName());
        dto.setAvatar(user.getAvatar());
        dto.setBio(user.getBio());
        dto.setLocation(user.getLocation());
        dto.setCreatedAt(user.getCreatedAt());
        return dto;
    }

    private User requireUser(String email) {
        return userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new UnauthorizedException("User not found"));
    }

    private User requireUserById(String id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }
}
