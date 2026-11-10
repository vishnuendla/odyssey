package com.odyssey.repository;

import com.odyssey.entity.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, String> {

    List<Notification> findByUserIdOrderByCreatedAtDesc(String userId);

    long countByUserIdAndReadFalse(String userId);

    Optional<Notification> findByIdAndUserId(String id, String userId);

    @Modifying
    @Query("update Notification n set n.read = true where n.user.id = :userId and n.read = false")
    int markAllRead(@Param("userId") String userId);

    @Modifying
    @Query("delete from Notification n where n.user.id = :userId or n.actor.id = :userId")
    int deleteByUserId(@Param("userId") String userId);

    @Modifying
    @Query("delete from Notification n where n.journalId = :journalId")
    int deleteByJournalId(@Param("journalId") String journalId);

    @Modifying
    @Query("delete from Notification n where n.commentId = :commentId")
    int deleteByCommentId(@Param("commentId") String commentId);
}
