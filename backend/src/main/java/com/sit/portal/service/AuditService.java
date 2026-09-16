package com.sit.portal.service;

import com.sit.portal.entity.SystemAuditLog;
import com.sit.portal.repository.SystemAuditLogRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuditService {

    private final SystemAuditLogRepository systemAuditLogRepository;

    @Transactional
    public SystemAuditLog logAction(Long userId, String userEmail, String action, String entityType,
                                    String entityId, String oldValue, String newValue, String result, String ipAddress) {
        SystemAuditLog auditLog = SystemAuditLog.builder()
                .userId(userId)
                .userEmail(userEmail)
                .action(action)
                .entityType(entityType)
                .entityId(entityId)
                .oldValue(oldValue)
                .newValue(newValue)
                .result(result != null ? result : "SUCCESS")
                .ipAddress(ipAddress)
                .createdAt(LocalDateTime.now())
                .build();
        return systemAuditLogRepository.save(auditLog);
    }

    public List<SystemAuditLog> getAuditLogs() {
        return systemAuditLogRepository.findAllByOrderByCreatedAtDesc();
    }

    public List<SystemAuditLog> getAuditLogsByEntityType(String entityType) {
        return systemAuditLogRepository.findByEntityTypeOrderByCreatedAtDesc(entityType);
    }
}
