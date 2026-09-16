package com.sit.portal.repository;

import com.sit.portal.entity.FacultyBatchAssignment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface FacultyBatchAssignmentRepository extends JpaRepository<FacultyBatchAssignment, Long> {
    List<FacultyBatchAssignment> findByFacultyIdAndStatus(Long facultyId, String status);
    List<FacultyBatchAssignment> findByBatchId(Long batchId);
    Optional<FacultyBatchAssignment> findByFacultyIdAndBatchId(Long facultyId, Long batchId);
}
