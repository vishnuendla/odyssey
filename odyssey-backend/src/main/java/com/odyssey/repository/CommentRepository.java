
package com.odyssey.repository;

import com.odyssey.entity.Comment;
import com.odyssey.entity.Journal;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CommentRepository extends JpaRepository<Comment, String> {
    List<Comment> findByJournal(Journal journal);
}
