package com.odyssey.repository;

import com.odyssey.entity.Report;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ReportRepository extends JpaRepository<Report, String> {

    List<Report> findAllByOrderByCreatedAtDesc();

    List<Report> findByStatusOrderByCreatedAtDesc(Report.Status status);

    Page<Report> findAllByOrderByCreatedAtDesc(Pageable pageable);

    Page<Report> findByStatusOrderByCreatedAtDesc(Report.Status status, Pageable pageable);

    List<Report> findByTargetTypeAndTargetIdAndStatusAndIdNot(
            Report.TargetType targetType, String targetId, Report.Status status, String id);

    long countByStatus(Report.Status status);

    boolean existsByReporterIdAndTargetTypeAndTargetIdAndStatus(
            String reporterId, Report.TargetType targetType, String targetId, Report.Status status);

    @Modifying
    @Query("delete from Report r where r.reporter.id = :userId")
    int deleteByReporterId(@Param("userId") String userId);

    @Modifying
    @Query("delete from Report r where r.targetType = :targetType and r.targetId = :targetId")
    int deleteByTarget(@Param("targetType") Report.TargetType targetType,
                       @Param("targetId") String targetId);
}
