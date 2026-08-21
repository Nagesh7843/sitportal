package com.sit.portal.service;

import com.sit.portal.entity.Notice;
import com.sit.portal.entity.FcmToken;
import com.sit.portal.repository.NoticeRepository;
import com.sit.portal.repository.FcmTokenRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class NoticeService {

    @Autowired
    private NoticeRepository noticeRepository;

    @Autowired
    private FcmTokenRepository fcmTokenRepository;

    @Autowired
    private PushNotificationService pushNotificationService;

    @Cacheable(value = "notices")
    public List<Notice> getAllNotices() {
        return noticeRepository.findAllPrioritizedAndLatest();
    }

    /**
     * Automated Scheduler: Deletes notices published older than 20 days (runs hourly).
     */
    @org.springframework.scheduling.annotation.Scheduled(cron = "0 0 * * * *")
    @CacheEvict(value = "notices", allEntries = true)
    public int autoCleanupExpiredNotices() {
        int retentionDays = 20;
        java.time.LocalDateTime cutoffDate = java.time.LocalDateTime.now().minusDays(retentionDays);
        int deleted = noticeRepository.deleteNoticesOlderThan(cutoffDate);
        if (deleted > 0) {
            System.out.println("Automated Notice Expiry Scheduler: Successfully cleaned up " + deleted + " notices older than " + retentionDays + " days.");
        }
        return deleted;
    }

    /**
     * Custom cleanup with specific retention days (e.g. 15 or 20 days).
     */
    @CacheEvict(value = "notices", allEntries = true)
    public int cleanupNoticesOlderThanDays(int days) {
        java.time.LocalDateTime cutoffDate = java.time.LocalDateTime.now().minusDays(days);
        int deleted = noticeRepository.deleteNoticesOlderThan(cutoffDate);
        if (deleted > 0) {
            System.out.println("Notice Expiry Cleanup: Removed " + deleted + " notices older than " + days + " days.");
        }
        return deleted;
    }

    @CacheEvict(value = "notices", allEntries = true)
    public Notice createNotice(Notice notice) {
        if (notice.getPublishedAt() == null || notice.getPublishedAt().isEmpty() || "Just now".equals(notice.getPublishedAt())) {
            java.time.format.DateTimeFormatter formatter = java.time.format.DateTimeFormatter.ofPattern("MMM dd, yyyy 'at' hh:mm a");
            notice.setPublishedAt(java.time.LocalDateTime.now().format(formatter));
        }
        Notice savedNotice = noticeRepository.save(notice);
        
        // Broadcast Push Notification to all registered FCM tokens
        List<FcmToken> tokens = fcmTokenRepository.findAll();
        System.out.println("========== PUSH NOTIFICATION BROADCAST ==========");
        System.out.println("Title: New Notice Published - " + savedNotice.getTitle());
        System.out.println("Total Devices Targeted: " + tokens.size());
        for (FcmToken token : tokens) {
            System.out.println("-> Sending FCM push to device token: " + token.getToken() + " (User: " + token.getEmail() + ")");
        }
        System.out.println("=================================================");

        // Trigger Web Push
        try {
            pushNotificationService.sendPushNotificationToAll(
                "New Notice: " + savedNotice.getTitle(),
                savedNotice.getContent()
            );
        } catch (Exception e) {
            System.err.println("Error triggering Web Push: " + e.getMessage());
        }
        
        return savedNotice;
    }

    public java.util.Optional<Notice> getNoticeById(Long id) {
        return noticeRepository.findById(id);
    }

    @CacheEvict(value = "notices", allEntries = true)
    public Notice updateNotice(Long id, Notice updatedNotice) {
        return noticeRepository.findById(id).map(existing -> {
            if (updatedNotice.getTitle() != null) existing.setTitle(updatedNotice.getTitle());
            if (updatedNotice.getContent() != null) existing.setContent(updatedNotice.getContent());
            if (updatedNotice.getCategory() != null) existing.setCategory(updatedNotice.getCategory());
            if (updatedNotice.getTargetAudience() != null) existing.setTargetAudience(updatedNotice.getTargetAudience());
            if (updatedNotice.getAuthorName() != null) existing.setAuthorName(updatedNotice.getAuthorName());
            if (updatedNotice.getAuthorRole() != null) existing.setAuthorRole(updatedNotice.getAuthorRole());
            if (updatedNotice.getPriority() != null) existing.setPriority(updatedNotice.getPriority());
            if (updatedNotice.getStatus() != null) existing.setStatus(updatedNotice.getStatus());
            if (updatedNotice.getAttachments() != null) existing.setAttachments(updatedNotice.getAttachments());
            if (updatedNotice.getReadBy() != null) existing.setReadBy(updatedNotice.getReadBy());
            if (updatedNotice.getPublishedAt() != null) existing.setPublishedAt(updatedNotice.getPublishedAt());
            if (updatedNotice.getScheduledAt() != null) existing.setScheduledAt(updatedNotice.getScheduledAt());
            if (updatedNotice.getExpiresAt() != null) existing.setExpiresAt(updatedNotice.getExpiresAt());
            if (updatedNotice.getViewsCount() != null) existing.setViewsCount(updatedNotice.getViewsCount());
            return noticeRepository.save(existing);
        }).orElse(null);
    }

    @CacheEvict(value = "notices", allEntries = true)
    public void deleteNotice(Long id) {
        noticeRepository.deleteById(id);
    }
}

