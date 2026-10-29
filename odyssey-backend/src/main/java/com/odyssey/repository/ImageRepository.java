
package com.odyssey.repository;

import com.odyssey.entity.Image;
import com.odyssey.entity.Journal;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ImageRepository extends JpaRepository<Image, String> {
    List<Image> findByJournal(Journal journal);
}
