
package com.odyssey.repository;

import com.odyssey.entity.Journal;
import com.odyssey.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface JournalRepository extends JpaRepository<Journal, String> {
    List<Journal> findByUser(User user);
    List<Journal> findByIsPublicTrue();
}
