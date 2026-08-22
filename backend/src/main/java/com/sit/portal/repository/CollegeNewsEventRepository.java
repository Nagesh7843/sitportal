package com.sit.portal.repository;

import com.sit.portal.entity.CollegeNewsEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface CollegeNewsEventRepository extends JpaRepository<CollegeNewsEvent, Long> {

    boolean existsByEventKey(String eventKey);

    Optional<CollegeNewsEvent> findByEventKey(String eventKey);

    List<CollegeNewsEvent> findAllByExpiresAtAfterOrderByEventDateDesc(LocalDateTime now);

    @Transactional
    @Modifying
    @Query("DELETE FROM CollegeNewsEvent e WHERE e.expiresAt < :now")
    int deleteExpiredEvents(@Param("now") LocalDateTime now);
}
