package com.sit.portal.controller;

import com.sit.portal.entity.Notice;
import com.sit.portal.entity.FcmToken;
import com.sit.portal.repository.NoticeRepository;
import com.sit.portal.repository.FcmTokenRepository;
import com.sit.portal.service.PushNotificationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/notices")
public class NoticeController {

    @Autowired
    private NoticeRepository noticeRepository;

    @Autowired
    private FcmTokenRepository fcmTokenRepository;

    @Autowired
    private PushNotificationService pushNotificationService;

    @GetMapping
    public List<Notice> getAllNotices() {
        return noticeRepository.findByOrderByCreatedAtDesc();
    }

    @PostMapping
    public ResponseEntity<Notice> createNotice(@RequestBody Notice notice) {
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
            // In a production environment, Firebase Messaging SDK would be called here:
            // FirebaseMessaging.getInstance().send(Message.builder().setToken(token.getToken()).build());
        }
        System.out.println("=================================================");

        // Actually trigger REAL Web Push via WebPush API
        try {
            pushNotificationService.sendPushNotificationToAll(
                "New Notice: " + savedNotice.getTitle(),
                savedNotice.getContent()
            );
        } catch (Exception e) {
            System.err.println("Error triggering Web Push: " + e.getMessage());
        }
        
        
        return ResponseEntity.ok(savedNotice);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteNotice(@PathVariable Long id) {
        noticeRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
