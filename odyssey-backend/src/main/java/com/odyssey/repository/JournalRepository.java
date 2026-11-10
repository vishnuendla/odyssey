package com.odyssey.repository;

import com.odyssey.entity.Journal;
import com.odyssey.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface JournalRepository extends JpaRepository<Journal, String> {
    List<Journal> findByUser(User user);
    List<Journal> findByUserOrderByCreatedAtDesc(User user);
    List<Journal> findByIsPublicTrue();
    Page<Journal> findByIsPublicTrue(Pageable pageable);

    List<Journal> findByUserIdAndIsPublicTrueOrderByCreatedAtDesc(String userId);
    long countByUserIdAndIsPublicTrue(String userId);

    @Query("""
            select distinct j from Journal j
            left join j.location l
            where j.isPublic = true
              and (:q is null
                   or lower(j.title) like lower(concat('%', :q, '%'))
                   or lower(j.content) like lower(concat('%', :q, '%')))
              and (:tag is null or :tag member of j.tags)
              and (:location is null
                   or lower(l.name) like lower(concat('%', :location, '%'))
                   or lower(l.city) like lower(concat('%', :location, '%'))
                   or lower(l.country) like lower(concat('%', :location, '%')))
            """)
    Page<Journal> searchPublic(@Param("q") String query,
                               @Param("tag") String tag,
                               @Param("location") String location,
                               Pageable pageable);

    @Query("select distinct t from Journal j join j.tags t where j.isPublic = true order by t")
    List<String> findPublicTags();
}
