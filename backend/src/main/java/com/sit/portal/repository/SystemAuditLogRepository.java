package com.sit.portal.repository;

import com.sit.portal.entity.SystemAuditLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface SystemAuditLogRepository extends JpaRepository<SystemAuditLog, Long> {
    List<SystemAuditLog> findAllByOrderByCreatedAtDesc();
    List<SystemAuditLog> findByEntityTypeOrderByCreatedAtDesc(String entityType);
    List<SystemAuditLog> findByUserIdOrderByCreatedAtDesc(Long userId);
}
