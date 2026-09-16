package com.sit.portal.repository;

import com.sit.portal.entity.StudentChangeRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface StudentChangeRequestRepository extends JpaRepository<StudentChangeRequest, Long> {
    List<StudentChangeRequest> findByPrnOrderByCreatedAtDesc(String prn);
    List<StudentChangeRequest> findByStatusOrderByCreatedAtDesc(String status);
}
