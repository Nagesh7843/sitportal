package com.sit.portal.service;

import com.sit.portal.dto.BroadcastRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.retry.annotation.Backoff;
import org.springframework.retry.annotation.Retryable;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class AsyncEmailWorker {

    @Autowired(required = false)
    private JavaMailSender javaMailSender;

    @Value("${spring.mail.username:admin@sit.ac.in}")
    private String senderEmail;

    /**
     * Dispatches emails in batches to avoid SMTP limits and blocking threads.
     */
    @Async
    @Retryable(
        value = { Exception.class },
        maxAttempts = 3,
        backoff = @Backoff(delay = 5000, multiplier = 2)
    )
    public void dispatchEmailsAsync(List<String> targetEmails, BroadcastRequest request) {
        if (javaMailSender == null || targetEmails.isEmpty()) {
            System.out.println("Simulated email broadcast to " + targetEmails.size() + " recipients (JavaMailSender not configured or no recipients).");
            return;
        }

        int batchSize = 50;
        int totalSent = 0;

        for (int i = 0; i < targetEmails.size(); i += batchSize) {
            int end = Math.min(i + batchSize, targetEmails.size());
            List<String> batch = targetEmails.subList(i, end);

            try {
                SimpleMailMessage message = new SimpleMailMessage();
                String fromAddr = (request.getSenderEmail() != null && !request.getSenderEmail().trim().isEmpty())
                        ? request.getSenderEmail().trim()
                        : senderEmail;
                
                message.setFrom(fromAddr);
                message.setReplyTo(fromAddr);
                message.setTo(fromAddr);
                message.setBcc(batch.toArray(new String[0]));
                message.setSubject(request.getSubject());
                message.setText(request.getContent());
                
                javaMailSender.send(message);
                totalSent += batch.size();
                System.out.println("Dispatched chunk of " + batch.size() + " emails successfully.");
                
                if (end < targetEmails.size()) {
                    Thread.sleep(1000); 
                }
            } catch (Exception e) {
                System.err.println("Failed to dispatch email batch starting at index " + i + ": " + e.getMessage());
                // Rethrow to trigger Spring Retry
                throw new RuntimeException("Email dispatch failed, triggering retry", e);
            }
        }
        
        System.out.println("Completed async email broadcast. Sent to " + totalSent + "/" + targetEmails.size() + " recipients.");
    }
}
