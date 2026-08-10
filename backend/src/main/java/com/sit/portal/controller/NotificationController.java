package com.sit.portal.controller;

import com.sit.portal.entity.FcmToken;
import com.sit.portal.repository.FcmTokenRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/v1/notifications")
public class NotificationController {

    @Autowired
    private FcmTokenRepository fcmTokenRepository;

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
}
