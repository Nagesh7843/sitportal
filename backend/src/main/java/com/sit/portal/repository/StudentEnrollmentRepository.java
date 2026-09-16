package com.sit.portal.repository;

import com.sit.portal.entity.StudentEnrollment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface StudentEnrollmentRepository extends JpaRepository<StudentEnrollment, Long> {
    List<StudentEnrollment> findByPrnOrderByCreatedAtDesc(String prn);
    Optional<StudentEnrollment> findByPrnAndIsCurrentTrue(String prn);
    List<StudentEnrollment> findByBatchIdAndIsCurrentTrue(Long batchId);
    List<StudentEnrollment> findByDepartmentIdAndIsCurrentTrue(Long departmentId);
    List<StudentEnrollment> findByDivisionIdAndIsCurrentTrue(Long divisionId);
}
