package com.sit.portal.controller;

import com.sit.portal.entity.Notice;
import com.sit.portal.service.NoticeService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/notices")
public class NoticeController {

    @Autowired
    private NoticeService noticeService;

    @GetMapping
    public List<Notice> getAllNotices() {
        return noticeService.getAllNotices();
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

    @PutMapping("/{id}")
    public ResponseEntity<Notice> updateNotice(@PathVariable Long id, @RequestBody Notice notice) {
        Notice updated = noticeService.updateNotice(id, notice);
        if (updated != null) {
            return ResponseEntity.ok(updated);
        }
        return ResponseEntity.notFound().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteNotice(@PathVariable Long id) {
        if (noticeService.getNoticeById(id).isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        noticeService.deleteNotice(id);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/cleanup-expired")
    public ResponseEntity<java.util.Map<String, Object>> cleanupExpiredNotices(
            @RequestParam(defaultValue = "20") int days) {
        int deletedCount = noticeService.cleanupNoticesOlderThanDays(days);
        return ResponseEntity.ok(java.util.Map.of(
                "status", "SUCCESS",
                "retentionDays", days,
                "deletedCount", deletedCount,
                "message", "Cleaned up " + deletedCount + " notices older than " + days + " days."
        ));
    }
}
