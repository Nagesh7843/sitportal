package com.sit.portal.controller;

import com.sit.portal.entity.SystemAuditLog;
import com.sit.portal.service.AuditService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping({"/api/audit-logs", "/api/v1/audit"})
@RequiredArgsConstructor
@CrossOrigin(originPatterns = "*")
public class AuditController {

    private final AuditService auditService;

    @GetMapping({"", "/logs"})
    public ResponseEntity<List<SystemAuditLog>> getAuditLogs(
            @RequestParam(required = false) String entityType) {
        if (entityType != null && !entityType.trim().isEmpty()) {
            return ResponseEntity.ok(auditService.getAuditLogsByEntityType(entityType));
        }
        return ResponseEntity.ok(auditService.getAuditLogs());
    }

    @GetMapping("/logs/stats")
    public ResponseEntity<java.util.Map<String, Object>> getAuditStats() {
        List<SystemAuditLog> allLogs = auditService.getAuditLogs();
        long totalActions = allLogs.size();
        long successfulActions = allLogs.stream()
                .filter(l -> !"FAILED".equalsIgnoreCase(l.getResult()) && !"ERROR".equalsIgnoreCase(l.getResult()))
                .count();
        long failedActions = totalActions - successfulActions;

        java.util.Map<String, Object> stats = new java.util.HashMap<>();
        stats.put("totalActions", totalActions);
        stats.put("successfulActions", successfulActions);
        stats.put("failedActions", failedActions);
        return ResponseEntity.ok(stats);
    }
}
