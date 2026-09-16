package com.sit.portal.repository;

import com.sit.portal.entity.ParentStudentRelationship;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface ParentStudentRelationshipRepository extends JpaRepository<ParentStudentRelationship, Long> {
    List<ParentStudentRelationship> findByParentIdAndStatus(Long parentId, String status);
    List<ParentStudentRelationship> findByPrn(String prn);
    Optional<ParentStudentRelationship> findByParentIdAndStudentId(Long parentId, Long studentId);
    Optional<ParentStudentRelationship> findByParentIdAndPrn(Long parentId, String prn);
}
