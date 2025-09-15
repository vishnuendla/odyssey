package com.odyssey.service;

import com.odyssey.dto.*;
import com.odyssey.entity.*;
import com.odyssey.exception.ResourceNotFoundException;
import com.odyssey.exception.UnauthorizedException;
import com.odyssey.repository.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class JournalService {

    private final JournalRepository journalRepository;
    private final UserRepository userRepository;
    private final LocationRepository locationRepository;
    private final ImageRepository imageRepository;
    private final CommentRepository commentRepository;
    private final ReactionRepository reactionRepository;

    public JournalService(JournalRepository journalRepository,
                          UserRepository userRepository,
                          LocationRepository locationRepository,
                          ImageRepository imageRepository,
                          CommentRepository commentRepository,
                          ReactionRepository reactionRepository) {
        this.journalRepository = journalRepository;
        this.userRepository = userRepository;
        this.locationRepository = locationRepository;
        this.imageRepository = imageRepository;
        this.commentRepository = commentRepository;
        this.reactionRepository = reactionRepository;
    }

    public List<JournalDto> getAllJournals() {
        return journalRepository.findAll().stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    public Page<JournalDto> getPublicJournals(Pageable pageable) {
        Page<Journal> journalPage = journalRepository.findByIsPublicTrue(pageable);
        return journalPage.map(this::convertToDto);
    }

    public UserDto updateUser(String id, UserDto request) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new UnauthorizedException("User not found"));
    
        user.setName(request.getName() != null ? request.getName() : user.getName());
        user.setAvatar(request.getAvatar() != null ? request.getAvatar() : user.getAvatar());
        user.setBio(request.getBio() != null ? request.getBio() : user.getBio());
        user.setLocation(request.getLocation() != null ? request.getLocation() : user.getLocation());
    
        return convertUserToDto(userRepository.save(user));
    }
    
        private UserDto convertUserToDto(User user) {
            UserDto userDto = new UserDto();
            userDto.setId(user.getId());
            userDto.setName(user.getName());
            userDto.setEmail(user.getEmail());
            userDto.setBio(user.getBio());
            userDto.setLocation(user.getLocation());
            userDto.setAvatar(user.getAvatar());
            return userDto;
    }

    public List<JournalDto> getUserJournals(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new UnauthorizedException("User not found"));
        
        return journalRepository.findByUser(user).stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    public JournalDto getJournalById(String id, String userEmail) {
        Journal journal = journalRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Journal not found"));
        
        if (!journal.isPublic() && !journal.getUser().getEmail().equals(userEmail)) {
            throw new UnauthorizedException("You do not have permission to view this journal");
        }
        
        return convertToDto(journal);
    }

    public JournalDto shareJournal(String id, String userEmail) {
        Journal journal = journalRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Journal not found"));
        
        // Check if journal is private and not owned by the requesting user
        if (!journal.isPublic() && !journal.getUser().getEmail().equals(userEmail)) {
            throw new UnauthorizedException("You do not have permission to share this journal");
        }
        
        return convertToDto(journal);
    }

    @Transactional
    public JournalDto createJournal(JournalRequest journalRequest, String userEmail) {
        System.out.println("Journal Request: " + journalRequest.getIsPublic());
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new UnauthorizedException("User not found"));
        
        Journal journal = new Journal();
        journal.setTitle(journalRequest.getTitle());
        journal.setContent(journalRequest.getContent());
        journal.setPublic(journalRequest.getIsPublic());
        journal.setUser(user);
        journal.setCreatedAt(LocalDateTime.now());
        journal.setUpdatedAt(LocalDateTime.now());
        
        Journal savedJournal = journalRepository.save(journal);
        
        // Create location
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
        
        // Add images
        if (journalRequest.getImages() != null && !journalRequest.getImages().isEmpty()) {
            for (String imageUrl : journalRequest.getImages()) {
                Image image = new Image();
                image.setUrl(imageUrl);
                image.setJournal(savedJournal);
                imageRepository.save(image);
                savedJournal.getImages().add(image);
            }
        }
        
        return convertToDto(savedJournal);
    }

    @Transactional
    public JournalDto updateJournal(String id, JournalRequest journalRequest, String userEmail) {
        Journal journal = journalRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Journal not found"));
        
        if (!journal.getUser().getEmail().equals(userEmail)) {
            throw new UnauthorizedException("You do not have permission to update this journal");
        }
        
        journal.setTitle(journalRequest.getTitle());
        journal.setContent(journalRequest.getContent());
        journal.setPublic(journalRequest.getIsPublic());
        journal.setUpdatedAt(LocalDateTime.now());
        
        // Update location
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
        
        // Update images - always process the images list from request
        if (journalRequest.getImages() != null) {
            // Clear existing images
            imageRepository.deleteAll(journal.getImages());
            journal.getImages().clear();
            
            // Add new images (even if list is empty - this allows image removal)
            for (String imageUrl : journalRequest.getImages()) {
                Image image = new Image();
                image.setUrl(imageUrl);
                image.setJournal(journal);
                journal.getImages().add(image);
            }
        }
        
        Journal updatedJournal = journalRepository.save(journal);
        return convertToDto(updatedJournal);
    }

    @Transactional
    public void deleteJournal(String id, String userEmail) {
        Journal journal = journalRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Journal not found"));
        
        if (!journal.getUser().getEmail().equals(userEmail)) {
            throw new UnauthorizedException("You do not have permission to delete this journal");
        }
        
        journalRepository.delete(journal);
    }

    private JournalDto convertToDto(Journal journal) {
        JournalDto dto = new JournalDto();
        dto.setId(journal.getId());
        dto.setTitle(journal.getTitle());
        dto.setContent(journal.getContent());
        dto.setIsPublic(journal.isPublic());
        dto.setCreatedAt(journal.getCreatedAt());
        dto.setUpdatedAt(journal.getUpdatedAt());
        dto.setUserId(journal.getUser().getId());
        
        // Set location
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
        
        dto.setComments(journal.getComments().stream().map(comment -> {
            CommentDto commentDto = new CommentDto();
            commentDto.setId(comment.getId());
            commentDto.setContent(comment.getContent());
            commentDto.setUserId(comment.getUser().getId());
            commentDto.setUserName(comment.getUser().getName());
            commentDto.setUserAvatar(comment.getUser().getAvatar());
            commentDto.setCreatedAt(comment.getCreatedAt());
            return commentDto;
        }).collect(Collectors.toList()));
        
        // Set reactions summary
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
}
