package com.sit.portal.controller;

import com.sit.portal.entity.Notice;
import com.sit.portal.service.NoticeService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/notices")
public class NoticeController {

    @Autowired
    private NoticeService noticeService;

    @GetMapping
    public List<Notice> getAllNotices(@RequestParam(required = false) Integer limit) {
        if (limit != null && limit > 0) {
            return noticeService.getTopNotices(limit);
        }
        return noticeService.getAllNotices();
    }

    public List<Notice> getAllNotices() {
        return getAllNotices(null);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Notice> getNoticeById(@PathVariable Long id) {
        return noticeService.getNoticeById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<Notice> createNotice(@RequestBody Notice notice) {
        Notice savedNotice = noticeService.createNotice(notice);
        return ResponseEntity.status(201).body(savedNotice);
    }

    @PostMapping("/{id}/read")
    public ResponseEntity<?> markNoticeAsRead(
            @PathVariable Long id,
            @RequestBody(required = false) Map<String, String> body,
            Authentication authentication
    ) {
        String userIdentifier = null;
        if (authentication != null && authentication.getName() != null) {
            userIdentifier = authentication.getName();
        } else if (body != null && body.containsKey("userIdentifier")) {
            userIdentifier = body.get("userIdentifier");
        }
        return noticeService.markNoticeAsRead(id, userIdentifier)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}")
    public ResponseEntity<Notice> updateNotice(@PathVariable Long id, @RequestBody Notice notice) {
        Notice updated = noticeService.updateNotice(id, notice);
        if (updated != null) {
            return ResponseEntity.ok(updated);
        }
        return ResponseEntity.notFound().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteNotice(@PathVariable String id) {
        try {
            Long numericId = Long.parseLong(id.trim());
            deleteNotice(numericId);
        } catch (NumberFormatException ignored) {
            // Client-side or non-numeric ID - return 204 gracefully so UI can remove it
        }
        return ResponseEntity.noContent().build();
    }

    public ResponseEntity<Void> deleteNotice(Long id) {
        noticeService.deleteNotice(id);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/cleanup-expired")
    public ResponseEntity<Map<String, Object>> cleanupExpiredNotices(
            @RequestParam(defaultValue = "20") int days) {
        int deletedCount = noticeService.cleanupNoticesOlderThanDays(days);
        return ResponseEntity.ok(Map.of(
                "status", "SUCCESS",
                "retentionDays", days,
                "deletedCount", deletedCount,
                "message", "Cleaned up " + deletedCount + " notices older than " + days + " days."
        ));
    }
}
