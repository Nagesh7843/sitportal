package com.sit.portal.repository;

import com.sit.portal.entity.Division;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface DivisionRepository extends JpaRepository<Division, Long> {
    List<Division> findByDepartmentId(Long departmentId);
    List<Division> findByDepartmentIdAndYearLevel(Long departmentId, String yearLevel);
}
