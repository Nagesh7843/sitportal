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

    @Autowired
    private com.sit.portal.repository.StudentRepository studentRepository;

    @Autowired
    private com.sit.portal.repository.UserRepository userRepository;

    @Cacheable(value = "notices")
    public List<Notice> getAllNotices() {
        return noticeRepository.findAllPrioritizedAndLatest();
    }

    public List<Notice> getTopNotices(int limit) {
        int max = limit <= 0 ? 15 : limit;
        return noticeRepository.findTopNotices(org.springframework.data.domain.PageRequest.of(0, max));
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

        // Targeted Web Push Notification
        try {
            List<String> targetEmails = resolveNoticeTargetEmails(savedNotice);
            if (targetEmails != null && !targetEmails.isEmpty()) {
                pushNotificationService.sendPushNotificationToUsers(
                    targetEmails,
                    "New Notice: " + savedNotice.getTitle(),
                    savedNotice.getContent()
                );
            } else if (targetEmails == null) {
                // College-wide notice (no filtering applied)
                pushNotificationService.sendPushNotificationToAll(
                    "New Notice: " + savedNotice.getTitle(),
                    savedNotice.getContent()
                );
            }
        } catch (Exception ignored) {}

        return savedNotice;
    }

    private List<String> resolveNoticeTargetEmails(Notice notice) {
        if (notice.getTargetAudience() == null || notice.getTargetAudience().isEmpty()) {
            return null; // Indicates college-wide
        }

        java.util.Map<String, Object> target = notice.getTargetAudience();
        List<String> depts = parseStringList(target.get("departments"));
        List<String> roles = parseStringList(target.get("roles"));
        List<String> years = parseStringList(target.get("academicYears"));
        List<String> divs = parseStringList(target.get("divisions"));
        List<String> batches = parseStringList(target.get("batches"));

        if (depts.isEmpty() && roles.isEmpty() && years.isEmpty() && divs.isEmpty() && batches.isEmpty()) {
            return null;
        }

        java.util.Set<String> matchedEmails = new java.util.HashSet<>();

        boolean includeStudents = roles.isEmpty() || roles.stream().anyMatch(r -> r.equalsIgnoreCase("STUDENT") || r.equalsIgnoreCase("STUDENTS"));
        boolean includeFaculty = roles.isEmpty() || roles.stream().anyMatch(r -> r.equalsIgnoreCase("FACULTY") || r.equalsIgnoreCase("TEACHER"));
        boolean includeParents = roles.isEmpty() || roles.stream().anyMatch(r -> r.equalsIgnoreCase("PARENT") || r.equalsIgnoreCase("PARENTS"));

        if (includeStudents || includeParents) {
            List<com.sit.portal.entity.Student> students = studentRepository.findAll();
            for (com.sit.portal.entity.Student s : students) {
                boolean deptMatch = depts.isEmpty() || depts.stream().anyMatch(d -> d.equalsIgnoreCase("ALL") || (s.getDepartment() != null && s.getDepartment().equalsIgnoreCase(d)));
                boolean yearMatch = years.isEmpty() || years.stream().anyMatch(y -> y.equalsIgnoreCase("ALL") || (s.getAcademicYear() != null && s.getAcademicYear().equalsIgnoreCase(y)));
                boolean divMatch = divs.isEmpty() || divs.stream().anyMatch(dv -> dv.equalsIgnoreCase("ALL") || (s.getDivision() != null && s.getDivision().toLowerCase().contains(dv.toLowerCase().replace("div", "").trim())));
                boolean batchMatch = batches.isEmpty() || batches.stream().anyMatch(b -> b.equalsIgnoreCase("ALL") || (s.getBatchGroup() != null && s.getBatchGroup().toLowerCase().contains(b.toLowerCase().replace("batch", "").trim())));

                if (deptMatch && yearMatch && divMatch && batchMatch) {
                    if (includeStudents && s.getEmail() != null) {
                        matchedEmails.add(s.getEmail().trim().toLowerCase());
                    }
                    if (includeParents && s.getParentEmail() != null) {
                        matchedEmails.add(s.getParentEmail().trim().toLowerCase());
                    }
                }
            }
        }

        if (includeFaculty) {
            List<com.sit.portal.entity.User> users = userRepository.findAll();
            for (com.sit.portal.entity.User u : users) {
                if ("FACULTY".equalsIgnoreCase(u.getRole()) || "HOD".equalsIgnoreCase(u.getRole())) {
                    boolean deptMatch = depts.isEmpty() || depts.stream().anyMatch(d -> d.equalsIgnoreCase("ALL") || (u.getDepartment() != null && u.getDepartment().equalsIgnoreCase(d)));
                    if (deptMatch && u.getEmail() != null) {
                        matchedEmails.add(u.getEmail().trim().toLowerCase());
                    }
                }
            }
        }

        return new ArrayList<>(matchedEmails);
    }

    @SuppressWarnings("unchecked")
    private List<String> parseStringList(Object obj) {
        List<String> list = new ArrayList<>();
        if (obj instanceof List<?>) {
            for (Object item : (List<?>) obj) {
                if (item != null) list.add(item.toString().trim());
            }
        } else if (obj instanceof String && !((String) obj).trim().isEmpty()) {
            list.add(((String) obj).trim());
        }
        return list;
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
