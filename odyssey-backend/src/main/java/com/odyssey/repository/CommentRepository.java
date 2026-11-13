package com.odyssey.repository;

import com.odyssey.entity.Comment;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CommentRepository extends JpaRepository<Comment, String> {
    @EntityGraph(attributePaths = {"user"})
    List<Comment> findByJournalIdOrderByCreatedAtAsc(String journalId);

    @EntityGraph(attributePaths = {"user"})
    List<Comment> findByParentIdOrderByCreatedAtAsc(String parentId);
    List<Comment> findByUserId(String userId);
    long countByJournalId(String journalId);

    @Modifying
    @Query("delete from Comment c where c.user.id = :userId")
    int deleteByUserId(@Param("userId") String userId);

    @Modifying
    @Query("delete from Comment c where c.parent.id = :parentId")
    int deleteByParentId(@Param("parentId") String parentId);
}
