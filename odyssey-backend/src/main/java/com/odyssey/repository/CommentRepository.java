
package com.odyssey.repository;

import com.odyssey.entity.Comment;
import com.odyssey.entity.Journal;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CommentRepository extends JpaRepository<Comment, String> {
    List<Comment> findByJournal(Journal journal);

    @Modifying
    @Query("delete from Comment c where c.user.id = :userId")
    int deleteByUserId(@Param("userId") String userId);
}
