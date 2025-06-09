
package com.odyssey.repository;

import com.odyssey.entity.Location;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LocationRepository extends JpaRepository<Location, String> {
    @Query("SELECT l FROM Location l WHERE " +
           "LOWER(l.name) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(l.country) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(l.city) LIKE LOWER(CONCAT('%', :query, '%'))")
    List<Location> searchByQuery(String query);
}
