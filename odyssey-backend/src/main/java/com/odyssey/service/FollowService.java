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
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

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
    public List<PublicUserDto> followers(String targetId) {
        requireUserById(targetId);
        return followRepository.findByFollowingIdOrderByCreatedAtDesc(targetId).stream()
                .map(Follow::getFollower)
                .map(user -> convertToDto(user, null))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<PublicUserDto> following(String targetId) {
        requireUserById(targetId);
        return followRepository.findByFollowerIdOrderByCreatedAtDesc(targetId).stream()
                .map(Follow::getFollowing)
                .map(user -> convertToDto(user, null))
                .toList();
    }

    public PublicUserDto convertToDto(User user, String viewerId) {
        PublicUserDto dto = new PublicUserDto();
        dto.setId(user.getId());
        dto.setName(user.getName());
        dto.setAvatar(user.getAvatar());
        dto.setBio(user.getBio());
        dto.setLocation(user.getLocation());
        dto.setCreatedAt(user.getCreatedAt());
        dto.setJournalsCount(journalRepository.countByUserIdAndIsPublicTrueAndHiddenFalse(user.getId()));
        dto.setFollowersCount(followRepository.countByFollowingId(user.getId()));
        dto.setFollowingCount(followRepository.countByFollowerId(user.getId()));
        dto.setFollowing(viewerId != null
                && followRepository.existsByFollowerIdAndFollowingId(viewerId, user.getId()));
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
