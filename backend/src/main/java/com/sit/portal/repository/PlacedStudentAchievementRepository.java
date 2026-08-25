package com.sit.portal.repository;

import com.sit.portal.entity.PlacedStudentAchievement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PlacedStudentAchievementRepository extends JpaRepository<PlacedStudentAchievement, Long> {
    List<PlacedStudentAchievement> findAllByOrderByIdDesc();
    List<PlacedStudentAchievement> findByBatchYearOrderByIdDesc(String batchYear);
}
