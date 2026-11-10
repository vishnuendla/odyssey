package com.odyssey.repository;

import com.odyssey.entity.Bookmark;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.Set;

@Repository
public interface BookmarkRepository extends JpaRepository<Bookmark, String> {

    Optional<Bookmark> findByUserIdAndJournalId(String userId, String journalId);

    List<Bookmark> findByUserIdOrderByCreatedAtDesc(String userId);

    @Query("select b.journal.id from Bookmark b where b.user.id = :userId")
    Set<String> findJournalIdsByUserId(@Param("userId") String userId);

    @Modifying
    @Query("delete from Bookmark b where b.user.id = :userId")
    int deleteByUserId(@Param("userId") String userId);

    @Modifying
    @Query("delete from Bookmark b where b.journal.id = :journalId")
    int deleteByJournalId(@Param("journalId") String journalId);
}
