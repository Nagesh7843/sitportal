package com.sit.portal.repository;

import com.sit.portal.entity.Notice;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface NoticeRepository extends JpaRepository<Notice, Long> {
    
    @Query("SELECT n FROM Notice n ORDER BY CASE WHEN n.priority = 'URGENT' THEN 1 WHEN n.priority = 'HIGH' THEN 2 WHEN n.priority = 'NORMAL' THEN 3 ELSE 4 END ASC, n.id DESC")
    List<Notice> findAllPrioritizedAndLatest();

    List<Notice> findByOrderByCreatedAtDesc();

    List<Notice> findByOrderByIdDesc();

    List<Notice> findByCategoryOrderByCreatedAtDesc(String category);

    @Transactional
    @Modifying
    @Query("DELETE FROM Notice n WHERE n.createdAt < :cutoffDate")
    int deleteNoticesOlderThan(@Param("cutoffDate") LocalDateTime cutoffDate);
}
