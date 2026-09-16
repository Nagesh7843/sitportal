package com.sit.portal.repository;

import com.sit.portal.entity.StudentAcademicData;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface StudentAcademicDataRepository extends JpaRepository<StudentAcademicData, Long> {
    Optional<StudentAcademicData> findByPrn(String prn);
    Optional<StudentAcademicData> findByStudentId(Long studentId);
}
