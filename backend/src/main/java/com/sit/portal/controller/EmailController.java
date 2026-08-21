package com.sit.portal.controller;

import com.sit.portal.entity.EmailLogEntity;
import com.sit.portal.repository.EmailLogRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/email")
public class EmailController {

    @Autowired
    private EmailLogRepository emailLogRepository;

    @Autowired
    private com.sit.portal.service.EmailService emailService;

    @GetMapping("/logs")
    public List<EmailLogEntity> getEmailLogs() {
        return emailLogRepository.findByOrderBySentAtDesc();
    }

    @GetMapping("/logs/{id}")
    public ResponseEntity<EmailLogEntity> getEmailLogById(@PathVariable Long id) {
        return emailLogRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/broadcast")
    public ResponseEntity<EmailLogEntity> recordBroadcast(@RequestBody com.sit.portal.dto.BroadcastRequest request) {
        EmailLogEntity savedLog = emailService.processBroadcast(request);
        return ResponseEntity.status(201).body(savedLog);
    }

    @PostMapping("/test")
    public ResponseEntity<java.util.Map<String, Object>> sendTestEmail(@RequestParam(defaultValue = "gnagesh550@gmail.com") String targetEmail) {
        com.sit.portal.dto.BroadcastRequest req = new com.sit.portal.dto.BroadcastRequest();
        req.setSubject("SIT CSE Portal - Live Email Delivery Verification");
        req.setContent("Hello!\n\nThis is a live delivery confirmation from Sharad Institute of Technology College of Engineering (SITCOE) CSE Portal.\n\nYour SMTP gateway is active and emails are being delivered successfully!");
        req.setPriority("HIGH");

        emailService.sendDirectTestEmail(targetEmail, req);
        return ResponseEntity.ok(java.util.Map.of(
                "status", "SUCCESS",
                "recipient", targetEmail,
                "message", "Test email dispatched successfully to " + targetEmail
        ));
    }

    @DeleteMapping("/logs/{id}")
    public ResponseEntity<Void> deleteEmailLog(@PathVariable Long id) {
        if (!emailLogRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        emailLogRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
