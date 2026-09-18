package com.sit.portal.controller;

import com.sit.portal.dto.DeviceDeliverySummaryResponse;
import com.sit.portal.dto.SendNoticeCriteriaRequest;
import com.sit.portal.dto.TargetCriteriaDto;
import com.sit.portal.entity.DeviceNoticeDelivery;
import com.sit.portal.entity.PushSubscription;
import com.sit.portal.repository.PushSubscriptionRepository;
import com.sit.portal.service.PushNotificationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/push")
@CrossOrigin(origins = "*")
public class PushNotificationController {

    @Autowired
    private PushSubscriptionRepository repository;

    @Autowired
    private PushNotificationService pushService;

    @GetMapping("/vapid-public-key")
    public ResponseEntity<Map<String, String>> getVapidPublicKey() {
        Map<String, String> response = new HashMap<>();
        response.put("publicKey", pushService.getPublicKey());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/devices")
    public ResponseEntity<List<Map<String, Object>>> getRegisteredDevices() {
        return ResponseEntity.ok(pushService.getRegisteredDevices());
    }

    @PostMapping("/preview-target-devices")
    public ResponseEntity<Map<String, Object>> previewTargetDevices(@RequestBody(required = false) TargetCriteriaDto criteria) {
        return ResponseEntity.ok(pushService.previewTargetDevices(criteria));
    }

    @PostMapping("/send-notice-criteria")
    public ResponseEntity<?> sendNoticeToCriteria(@RequestBody SendNoticeCriteriaRequest request) {
        try {
            DeviceDeliverySummaryResponse response = pushService.sendNoticeToTargetDevices(request);
            if ("DUPLICATES_SKIPPED".equalsIgnoreCase(response.getStatus())) {
                return ResponseEntity.status(HttpStatus.OK).body(response);
            }
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "SELECTION_VALIDATION_FAILED");
            error.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "DELIVERY_ERROR");
            error.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    @GetMapping("/deliveries/{noticeId}")
    public ResponseEntity<List<DeviceNoticeDelivery>> getNoticeDeliveries(@PathVariable Long noticeId) {
        return ResponseEntity.ok(pushService.getNoticeDeliveries(noticeId));
    }

    @PostMapping("/subscribe")
    public ResponseEntity<?> subscribe(@RequestBody PushSubscription subscription, org.springframework.security.core.Authentication authentication) {
        String email = subscription.getUserEmail();
        if ((email == null || email.trim().isEmpty()) && authentication != null) {
            email = authentication.getName();
        }

        if (subscription.getEndpoint() == null || subscription.getEndpoint().trim().isEmpty()) {
            return ResponseEntity.badRequest().body("Endpoint cannot be empty.");
        }

        java.util.List<PushSubscription> existingList = repository.findAllByEndpoint(subscription.getEndpoint().trim());
        PushSubscription sub;
        if (!existingList.isEmpty()) {
            sub = existingList.get(0);
            if (existingList.size() > 1) {
                for (int i = 1; i < existingList.size(); i++) {
                    try {
                        repository.deleteById(existingList.get(i).getId());
                    } catch (Exception ignored) {}
                }
            }
        } else {
            sub = new PushSubscription();
            sub.setEndpoint(subscription.getEndpoint().trim());
        }

        sub.setP256dh(subscription.getP256dh() != null ? subscription.getP256dh() : "");
        sub.setAuth(subscription.getAuth() != null ? subscription.getAuth() : "");
        if (email != null && !email.trim().isEmpty()) {
            sub.setUserEmail(email.trim().toLowerCase());
        }
        repository.save(sub);
        return ResponseEntity.ok("Subscribed successfully.");
    }

    @PostMapping("/unsubscribe")
    public ResponseEntity<?> unsubscribe(@RequestBody Map<String, String> payload) {
        String endpoint = payload.get("endpoint");
        if (endpoint != null && !endpoint.trim().isEmpty()) {
            java.util.List<PushSubscription> existingList = repository.findAllByEndpoint(endpoint.trim());
            if (!existingList.isEmpty()) {
                repository.deleteAll(existingList);
                return ResponseEntity.ok("Unsubscribed successfully.");
            }
        }
        return ResponseEntity.ok("Subscription not found.");
    }
}
