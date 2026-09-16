package com.sit.portal.controller;

import com.sit.portal.entity.FcmToken;
import com.sit.portal.entity.NotificationRecipient;
import com.sit.portal.entity.NotificationTarget;
import com.sit.portal.entity.User;
import com.sit.portal.repository.FcmTokenRepository;
import com.sit.portal.repository.UserRepository;
import com.sit.portal.service.NotificationEngineService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/v1/notifications")
@CrossOrigin(origins = "*")
public class NotificationController {

    @Autowired
    private FcmTokenRepository fcmTokenRepository;

    @Autowired
    private NotificationEngineService notificationEngineService;

    @Autowired
    private UserRepository userRepository;

    @PostMapping("/register-token")
    public ResponseEntity<?> registerToken(@RequestBody Map<String, String> payload) {
        String token = payload.get("token");
        String email = payload.get("email");
        String deviceType = payload.getOrDefault("deviceType", "Web Browser");

        if (token == null || token.isEmpty()) {
            Map<String, String> err = new HashMap<>();
            err.put("message", "FCM Device Token is required");
            return ResponseEntity.badRequest().body(err);
        }

        Optional<FcmToken> existingToken = fcmTokenRepository.findByToken(token);
        FcmToken savedToken;
        if (existingToken.isPresent()) {
            savedToken = existingToken.get();
            if (email != null) savedToken.setEmail(email);
            savedToken = fcmTokenRepository.save(savedToken);
        } else {
            savedToken = fcmTokenRepository.save(FcmToken.builder()
                    .token(token)
                    .email(email != null ? email : "anonymous@sit.ac.in")
                    .deviceType(deviceType)
                    .build());
        }

        Map<String, Object> res = new HashMap<>();
        res.put("status", "success");
        res.put("message", "FCM device token registered for Web Push notifications.");
        res.put("data", savedToken);
        return ResponseEntity.ok(res);
    }

    @GetMapping("/me")
    public ResponseEntity<List<NotificationRecipient>> getMyNotifications(
            @RequestParam(required = false) String email,
            Authentication authentication
    ) {
        String lookupEmail = email;
        if ((lookupEmail == null || lookupEmail.trim().isEmpty()) && authentication != null) {
            lookupEmail = authentication.getName();
        }
        if (lookupEmail == null || lookupEmail.trim().isEmpty()) {
            return ResponseEntity.ok(Collections.emptyList());
        }

        Optional<User> userOpt = userRepository.findByEmail(lookupEmail.trim().toLowerCase());
        if (userOpt.isEmpty()) {
            return ResponseEntity.ok(Collections.emptyList());
        }

        return ResponseEntity.ok(notificationEngineService.getUserNotifications(userOpt.get().getId()));
    }

    @GetMapping("/unread-count")
    public ResponseEntity<Map<String, Object>> getUnreadCount(
            @RequestParam(required = false) String email,
            Authentication authentication
    ) {
        String lookupEmail = email;
        if ((lookupEmail == null || lookupEmail.trim().isEmpty()) && authentication != null) {
            lookupEmail = authentication.getName();
        }
        if (lookupEmail == null || lookupEmail.trim().isEmpty()) {
            return ResponseEntity.ok(Map.of("unreadCount", 0));
        }

        Optional<User> userOpt = userRepository.findByEmail(lookupEmail.trim().toLowerCase());
        long count = userOpt.map(u -> notificationEngineService.getUnreadCount(u.getId())).orElse(0L);
        return ResponseEntity.ok(Map.of("unreadCount", count));
    }

    @PostMapping("/fan-out")
    public ResponseEntity<List<NotificationRecipient>> fanOut(
            @RequestParam Long noticeId,
            @RequestBody List<NotificationTarget> targets
    ) {
        return ResponseEntity.ok(notificationEngineService.fanOutNotification(noticeId, targets));
    }

    @PatchMapping("/{noticeId}/read")
    public ResponseEntity<?> markAsRead(
            @PathVariable Long noticeId,
            @RequestParam(required = false) String email,
            Authentication authentication
    ) {
        String lookupEmail = email;
        if ((lookupEmail == null || lookupEmail.trim().isEmpty()) && authentication != null) {
            lookupEmail = authentication.getName();
        }
        if (lookupEmail == null || lookupEmail.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "User email required"));
        }

        Optional<User> userOpt = userRepository.findByEmail(lookupEmail.trim().toLowerCase());
        if (userOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        return notificationEngineService.markAsRead(noticeId, userOpt.get().getId())
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/send-direct-batch")
    public ResponseEntity<?> sendDirectBatchNotification(
            @RequestBody Map<String, Object> payload
    ) {
        String title = (String) payload.getOrDefault("title", "Faculty Notification");
        String message = (String) payload.getOrDefault("message", "");
        String department = (String) payload.get("department");
        String yearLevel = (String) payload.get("yearLevel");
        String division = (String) payload.get("division");
        String batchCode = (String) payload.get("batchCode");
        String urgency = (String) payload.getOrDefault("urgency", "NORMAL");
        Boolean sendEmail = Boolean.TRUE.equals(payload.get("sendEmail"));
        List<String> studentEmails = (List<String>) payload.get("studentEmails");

        Map<String, Object> result = notificationEngineService.sendDirectBatchNotification(
                title, message, department, yearLevel, division, batchCode, urgency, sendEmail, studentEmails
        );

        return ResponseEntity.ok(result);
    }
}
