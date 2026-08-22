package com.sit.portal.repository;

import com.sit.portal.entity.AcademicCalendar;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AcademicCalendarRepository extends JpaRepository<AcademicCalendar, Long> {
    Optional<AcademicCalendar> findByIsActiveTrue();
    List<AcademicCalendar> findAllByOrderByCreatedAtDesc();
}
