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
        return noticeRepository.findByOrderByCreatedAtDesc();
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

    @CacheEvict(value = "notices", allEntries = true)
    public void deleteNotice(Long id) {
        noticeRepository.deleteById(id);
    }
}
