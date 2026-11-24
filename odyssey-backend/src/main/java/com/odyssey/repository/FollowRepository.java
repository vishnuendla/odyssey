package com.odyssey.repository;

import com.odyssey.entity.Follow;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface FollowRepository extends JpaRepository<Follow, String> {

    Optional<Follow> findByFollowerIdAndFollowingId(String followerId, String followingId);

    boolean existsByFollowerIdAndFollowingId(String followerId, String followingId);

    List<Follow> findByFollowingIdOrderByCreatedAtDesc(String followingId);

    List<Follow> findByFollowerIdOrderByCreatedAtDesc(String followerId);

    Page<Follow> findByFollowingIdOrderByCreatedAtDesc(String followingId, Pageable pageable);

    Page<Follow> findByFollowerIdOrderByCreatedAtDesc(String followerId, Pageable pageable);

    long countByFollowingId(String followingId);

    long countByFollowerId(String followerId);

    /** Batched follower counts for a page of profile cards. */
    @Query("""
            select f.following.id, count(f) from Follow f
            where f.following.id in :userIds
            group by f.following.id
            """)
    List<Object[]> countFollowersByFollowingIds(@Param("userIds") Collection<String> userIds);

    /** Batched following counts for a page of profile cards. */
    @Query("""
            select f.follower.id, count(f) from Follow f
            where f.follower.id in :userIds
            group by f.follower.id
            """)
    List<Object[]> countFollowingByFollowerIds(@Param("userIds") Collection<String> userIds);

    /** Which of the given users the viewer already follows (one query per page). */
    @Query("""
            select f.following.id from Follow f
            where f.follower.id = :viewerId
              and f.following.id in :userIds
            """)
    List<String> findFollowingIds(@Param("viewerId") String viewerId,
                                  @Param("userIds") Collection<String> userIds);

    @Modifying
    @Query("delete from Follow f where f.follower.id = :userId or f.following.id = :userId")
    int deleteByUserId(@Param("userId") String userId);
}
