package com.odyssey.repository;

import com.odyssey.entity.Follow;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FollowRepository extends JpaRepository<Follow, String> {

    Optional<Follow> findByFollowerIdAndFollowingId(String followerId, String followingId);

    boolean existsByFollowerIdAndFollowingId(String followerId, String followingId);

    List<Follow> findByFollowingIdOrderByCreatedAtDesc(String followingId);

    List<Follow> findByFollowerIdOrderByCreatedAtDesc(String followerId);

    long countByFollowingId(String followingId);

    long countByFollowerId(String followerId);

    @Modifying
    @Query("delete from Follow f where f.follower.id = :userId or f.following.id = :userId")
    int deleteByUserId(@Param("userId") String userId);
}
