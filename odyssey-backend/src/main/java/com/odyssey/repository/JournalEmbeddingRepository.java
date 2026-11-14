package com.odyssey.repository;

import com.odyssey.entity.JournalEmbedding;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface JournalEmbeddingRepository extends JpaRepository<JournalEmbedding, String> {

    List<JournalEmbedding> findByJournalId(String journalId);

    long deleteByJournalId(String journalId);

    @Query("""
            select e from JournalEmbedding e
            join e.journal j
            where j.user.id = :userId
              and j.hidden = false
            """)
    List<JournalEmbedding> findAllByUserId(@Param("userId") String userId);

    @Query("""
            select e.journal.id from JournalEmbedding e
            join e.journal j
            where j.user.id = :userId
            """)
    List<String> findIndexedJournalIds(@Param("userId") String userId);
}
