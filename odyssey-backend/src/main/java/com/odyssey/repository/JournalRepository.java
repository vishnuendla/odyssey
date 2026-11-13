package com.odyssey.repository;

import com.odyssey.entity.Journal;
import com.odyssey.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface JournalRepository extends JpaRepository<Journal, String> {
    List<Journal> findByUser(User user);

    @EntityGraph(attributePaths = {"user", "location"})
    List<Journal> findByUserOrderByCreatedAtDesc(User user);

    List<Journal> findByIsPublicTrue();
    List<Journal> findByIsPublicTrueAndHiddenFalse();

    @EntityGraph(attributePaths = {"user", "location"})
    Page<Journal> findByIsPublicTrue(Pageable pageable);

    @EntityGraph(attributePaths = {"user", "location"})
    Page<Journal> findByIsPublicTrueAndHiddenFalse(Pageable pageable);

    @EntityGraph(attributePaths = {"user", "location"})
    List<Journal> findByUserIdAndIsPublicTrueOrderByCreatedAtDesc(String userId);

    @EntityGraph(attributePaths = {"user", "location"})
    List<Journal> findByUserIdAndIsPublicTrueAndHiddenFalseOrderByCreatedAtDesc(String userId);
    long countByUserIdAndIsPublicTrue(String userId);
    long countByUserIdAndIsPublicTrueAndHiddenFalse(String userId);
    long countByIsPublicTrueAndHiddenFalse();
    long countByHiddenTrue();

    @EntityGraph(attributePaths = {"user", "location"})
    @Query("""
            select j from Journal j
            where j.hidden = false
              and (j.isPublic = true or j.user.id = :userId)
            order by j.createdAt desc
            """)
    List<Journal> findVisibleToUser(@Param("userId") String userId);

    @EntityGraph(attributePaths = {"user", "location"})
    @Query("""
            select j from Journal j
            left join j.location l
            where j.isPublic = true
              and j.hidden = false
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

    /**
     * Same filters as {@link #searchPublic} but ordered by live reaction count.
     * Sorting in SQL keeps "popular" correct across pages; the client cannot
     * inject an arbitrary sort column.
     */
    @EntityGraph(attributePaths = {"user", "location"})
    @Query(value = """
            select j from Journal j
            left join j.location l
            where j.isPublic = true
              and j.hidden = false
              and (:q is null
                   or lower(j.title) like lower(concat('%', :q, '%'))
                   or lower(j.content) like lower(concat('%', :q, '%')))
              and (:tag is null or :tag member of j.tags)
              and (:location is null
                   or lower(l.name) like lower(concat('%', :location, '%'))
                   or lower(l.city) like lower(concat('%', :location, '%'))
                   or lower(l.country) like lower(concat('%', :location, '%')))
            order by (select count(r) from Reaction r where r.journal = j) desc, j.createdAt desc
            """,
            countQuery = """
            select count(j) from Journal j
            left join j.location l
            where j.isPublic = true
              and j.hidden = false
              and (:q is null
                   or lower(j.title) like lower(concat('%', :q, '%'))
                   or lower(j.content) like lower(concat('%', :q, '%')))
              and (:tag is null or :tag member of j.tags)
              and (:location is null
                   or lower(l.name) like lower(concat('%', :location, '%'))
                   or lower(l.city) like lower(concat('%', :location, '%'))
                   or lower(l.country) like lower(concat('%', :location, '%')))
            """)
    Page<Journal> searchPublicPopular(@Param("q") String query,
                                      @Param("tag") String tag,
                                      @Param("location") String location,
                                      Pageable pageable);

    @Query("select distinct t from Journal j join j.tags t where j.isPublic = true and j.hidden = false order by t")
    List<String> findPublicTags();
}
