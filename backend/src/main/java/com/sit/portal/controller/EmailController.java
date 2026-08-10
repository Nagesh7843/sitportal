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

    @PostMapping("/broadcast")
    public ResponseEntity<EmailLogEntity> recordBroadcast(@RequestBody com.sit.portal.dto.BroadcastRequest request) {
        EmailLogEntity savedLog = emailService.processBroadcast(request);
        return ResponseEntity.ok(savedLog);
    }
}
