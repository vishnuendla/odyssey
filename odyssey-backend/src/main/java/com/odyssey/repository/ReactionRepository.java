
package com.odyssey.repository;

import com.odyssey.entity.Journal;
import com.odyssey.entity.Reaction;
import com.odyssey.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ReactionRepository extends JpaRepository<Reaction, String> {
    List<Reaction> findByJournal(Journal journal);
    Optional<Reaction> findByJournalAndUserAndType(Journal journal, User user, Reaction.ReactionType type);
    List<Reaction> findByJournalAndType(Journal journal, Reaction.ReactionType type);

    @Modifying
    @Query("delete from Reaction r where r.user.id = :userId")
    int deleteByUserId(@Param("userId") String userId);
}
