package com.odyssey.repository;

import com.odyssey.entity.VerificationToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Optional;

@Repository
public interface VerificationTokenRepository extends JpaRepository<VerificationToken, String> {

    Optional<VerificationToken> findByTokenHash(String tokenHash);

    @Modifying
    @Query("delete from VerificationToken t where t.user.id = :userId and t.purpose = :purpose")
    int deleteByUserAndPurpose(@Param("userId") String userId, @Param("purpose") VerificationToken.Purpose purpose);

    @Modifying
    @Query("delete from VerificationToken t where t.user.id = :userId")
    int deleteAllForUser(@Param("userId") String userId);

    @Query("select count(t) from VerificationToken t where t.user.id = :userId and t.purpose = :purpose and t.createdAt > :since")
    long countRecent(@Param("userId") String userId,
                     @Param("purpose") VerificationToken.Purpose purpose,
                     @Param("since") LocalDateTime since);
}
