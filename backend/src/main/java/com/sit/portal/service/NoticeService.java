package com.sit.portal.service;

import com.sit.portal.entity.Notice;
import com.sit.portal.entity.NoticeRead;
import com.sit.portal.entity.FcmToken;
import com.sit.portal.repository.NoticeRepository;
import com.sit.portal.repository.NoticeReadRepository;
import com.sit.portal.repository.FcmTokenRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class NoticeService {

    @Autowired
    private NoticeRepository noticeRepository;

    @Autowired
    private NoticeReadRepository noticeReadRepository;

    @Autowired
    private FcmTokenRepository fcmTokenRepository;

    @Autowired
    private PushNotificationService pushNotificationService;

    @Autowired
    private SettingService settingService;

    @Cacheable(value = "notices")
    public List<Notice> getAllNotices() {
        return noticeRepository.findAllPrioritizedAndLatest();
    }

    /**
     * Automated Scheduler: Deletes notices published older than configured retention days (runs hourly).
     */
    @org.springframework.scheduling.annotation.Scheduled(cron = "0 0 * * * *")
    @CacheEvict(value = "notices", allEntries = true)
    public int autoCleanupExpiredNotices() {
        int retentionDays = 20;
        try {
            String daysStr = settingService.getSystemSettings().getRetentionDays();
            if (daysStr != null && !daysStr.trim().isEmpty()) {
                retentionDays = Integer.parseInt(daysStr.trim());
            }
        } catch (Exception ignored) {}

        LocalDateTime cutoffDate = LocalDateTime.now().minusDays(retentionDays);
        int deleted = noticeRepository.deleteNoticesOlderThan(cutoffDate);
        return deleted;
    }

    /**
     * Custom cleanup with specific retention days (e.g. 15 or 20 days).
     */
    @CacheEvict(value = "notices", allEntries = true)
    public int cleanupNoticesOlderThanDays(int days) {
        LocalDateTime cutoffDate = LocalDateTime.now().minusDays(days);
        return noticeRepository.deleteNoticesOlderThan(cutoffDate);
    }

    @CacheEvict(value = "notices", allEntries = true)
    public Notice createNotice(Notice notice) {
        if (notice.getPublishedAt() == null || notice.getPublishedAt().isEmpty() || "Just now".equals(notice.getPublishedAt())) {
            DateTimeFormatter formatter = DateTimeFormatter.ofPattern("MMM dd, yyyy 'at' hh:mm a");
            notice.setPublishedAt(LocalDateTime.now().format(formatter));
        }
        Notice savedNotice = noticeRepository.save(notice);

        // Broadcast Web Push Notification
        try {
            pushNotificationService.sendPushNotificationToAll(
                "New Notice: " + savedNotice.getTitle(),
                savedNotice.getContent()
            );
        } catch (Exception ignored) {}

        return savedNotice;
    }

    public Optional<Notice> getNoticeById(Long id) {
        return noticeRepository.findById(id);
    }

    @CacheEvict(value = "notices", allEntries = true)
    public Optional<Notice> markNoticeAsRead(Long noticeId, String userIdentifier) {
        if (userIdentifier == null || userIdentifier.trim().isEmpty()) {
            userIdentifier = "anonymous";
        }
        String cleanUser = userIdentifier.trim().toLowerCase();

        return noticeRepository.findById(noticeId).map(notice -> {
            boolean alreadyRead = noticeReadRepository.existsByNoticeIdAndUserIdentifier(noticeId, cleanUser);
            if (!alreadyRead) {
                noticeReadRepository.save(NoticeRead.builder()
                        .noticeId(noticeId)
                        .userIdentifier(cleanUser)
                        .readAt(LocalDateTime.now())
                        .build());

                List<String> reads = notice.getReadBy() != null ? new ArrayList<>(notice.getReadBy()) : new ArrayList<>();
                if (!reads.contains(cleanUser)) {
                    reads.add(cleanUser);
                    notice.setReadBy(reads);
                }
                notice.setViewsCount((notice.getViewsCount() != null ? notice.getViewsCount() : 0) + 1);
                return noticeRepository.save(notice);
            }
            return notice;
        });
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
    public boolean deleteNotice(Long id) {
        if (!noticeRepository.existsById(id)) {
            return false;
        }
        try {
            noticeReadRepository.deleteByNoticeId(id);
        } catch (Exception ignored) {}
        noticeRepository.deleteById(id);
        return true;
    }
}
