package com.sit.portal.controller;

import com.sit.portal.entity.PushSubscription;
import com.sit.portal.repository.PushSubscriptionRepository;
import com.sit.portal.service.PushNotificationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/v1/push")
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

    @PostMapping("/subscribe")
    public ResponseEntity<?> subscribe(@RequestBody PushSubscription subscription) {
        Optional<PushSubscription> existing = repository.findByEndpoint(subscription.getEndpoint());
        if (existing.isPresent()) {
            PushSubscription sub = existing.get();
            sub.setP256dh(subscription.getP256dh());
            sub.setAuth(subscription.getAuth());
            repository.save(sub);
            return ResponseEntity.ok("Subscription updated.");
        } else {
            repository.save(subscription);
            return ResponseEntity.ok("Subscribed successfully.");
        }
    }

    @PostMapping("/unsubscribe")
    public ResponseEntity<?> unsubscribe(@RequestBody Map<String, String> payload) {
        String endpoint = payload.get("endpoint");
        Optional<PushSubscription> existing = repository.findByEndpoint(endpoint);
        if (existing.isPresent()) {
            repository.delete(existing.get());
            return ResponseEntity.ok("Unsubscribed successfully.");
        }
        return ResponseEntity.ok("Subscription not found.");
    }
}
