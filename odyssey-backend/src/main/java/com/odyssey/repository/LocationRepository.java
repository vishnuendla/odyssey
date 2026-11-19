
package com.odyssey.repository;

import com.odyssey.entity.Location;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LocationRepository extends JpaRepository<Location, String> {
    /**
     * Suggests places already attached to public, non-hidden journals. The
     * visibility filter lives in the query itself so a private place name can
     * never be probed through this unauthenticated endpoint.
     */
    @Query("SELECT l FROM Location l WHERE " +
           "l.journal.isPublic = true AND l.journal.hidden = false AND (" +
           "LOWER(l.name) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(l.country) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(l.city) LIKE LOWER(CONCAT('%', :query, '%'))) " +
           "ORDER BY l.name")
    List<Location> searchVisibleByQuery(String query, Pageable pageable);
}
