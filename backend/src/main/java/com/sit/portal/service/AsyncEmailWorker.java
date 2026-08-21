package com.sit.portal.service;

import com.sit.portal.dto.BroadcastRequest;
import jakarta.mail.internet.MimeMessage;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.retry.annotation.Backoff;
import org.springframework.retry.annotation.Retryable;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class AsyncEmailWorker {

    @Autowired(required = false)
    private JavaMailSender javaMailSender;

    @Value("${spring.mail.username:gnagesh550@gmail.com}")
    private String senderEmail;

    /**
     * Dispatches emails directly and reliably to recipients.
     */
    @Async
    @Retryable(
        value = { Exception.class },
        maxAttempts = 2,
        backoff = @Backoff(delay = 3000, multiplier = 2)
    )
    public void dispatchEmailsAsync(List<String> targetEmails, BroadcastRequest request) {
        if (javaMailSender == null || targetEmails == null || targetEmails.isEmpty()) {
            System.out.println("⚠️ JavaMailSender not initialized or target list empty (target count: " + (targetEmails != null ? targetEmails.size() : 0) + ")");
            return;
        }

        int totalSent = 0;
        String fromAddress = senderEmail;
        String fromPersonal = "Sharad Institute of Technology CSE Portal";

        // Build rich HTML email template
        String priorityTag = request.getPriority() != null ? request.getPriority().toUpperCase() : "NORMAL";
        String priorityBadgeColor = "URGENT".equals(priorityTag) ? "#dc2626" : "HIGH".equals(priorityTag) ? "#ea580c" : "#2563eb";

        StringBuilder attachmentsHtml = new StringBuilder();
        if (request.getAttachments() != null && !request.getAttachments().isEmpty()) {
            attachmentsHtml.append("<div style='margin-top:20px;padding:12px;background:#f1f5f9;border-radius:8px;border:1px solid #cbd5e1;'>");
            attachmentsHtml.append("<strong style='color:#0f172a;font-size:13px;'>📎 Attached Documents:</strong><ul style='margin:6px 0 0 0;padding-left:20px;'>");
            for (String att : request.getAttachments()) {
                attachmentsHtml.append("<li style='font-size:12px;color:#334155;'>").append(att).append("</li>");
            }
            attachmentsHtml.append("</ul></div>");
        }

        String htmlBody = "<!DOCTYPE html><html><body style='font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica,Arial,sans-serif;background-color:#f8fafc;padding:24px 0;margin:0;'>"
                + "<div style='max-width:600px;margin:0 auto;background:#ffffff;border-radius:12px;border:1px solid #e2e8f0;overflow:hidden;box-shadow:0 4px 6px -1px rgba(0,0,0,0.05);'>"
                + "<div style='background:#000666;padding:20px 24px;text-align:left;border-bottom:3px solid #f59e0b;'>"
                + "<h2 style='color:#ffffff;margin:0;font-size:18px;font-weight:bold;letter-spacing:-0.3px;'>Sharad Institute of Technology College of Engineering</h2>"
                + "<p style='color:#93c5fd;margin:4px 0 0 0;font-size:12px;'>Department of Computer Science & Engineering (Autonomous)</p>"
                + "</div>"
                + "<div style='padding:24px;'>"
                + "<div style='display:inline-block;padding:3px 10px;border-radius:20px;background:" + priorityBadgeColor + ";color:#ffffff;font-size:11px;font-weight:bold;margin-bottom:12px;text-transform:uppercase;'>"
                + priorityTag + " NOTICE</div>"
                + "<h3 style='color:#0f172a;margin:0 0 16px 0;font-size:17px;'>" + request.getSubject() + "</h3>"
                + "<div style='color:#334155;font-size:14px;line-height:1.6;white-space:pre-wrap;'>" + request.getContent() + "</div>"
                + attachmentsHtml.toString()
                + "</div>"
                + "<div style='background:#f8fafc;padding:16px 24px;border-top:1px solid #e2e8f0;text-align:center;font-size:11px;color:#64748b;'>"
                + "This official notification was transmitted via the SIT CSE Departmental Portal.<br>Sharad Institute of Technology College of Engineering, Yadrav (Ichalkaranji)."
                + "</div>"
                + "</div></body></html>";

        // Dispatch each recipient directly for 100% deliverability
        for (String recipient : targetEmails) {
            if (recipient == null || recipient.trim().isEmpty() || !recipient.contains("@")) {
                continue;
            }
            try {
                MimeMessage mimeMessage = javaMailSender.createMimeMessage();
                MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, "UTF-8");

                helper.setFrom(fromAddress, fromPersonal);
                if (request.getSenderEmail() != null && !request.getSenderEmail().trim().isEmpty()) {
                    helper.setReplyTo(request.getSenderEmail().trim());
                }
                helper.setTo(recipient.trim());
                helper.setSubject("🏛️ [SIT CSE] " + request.getSubject());
                helper.setText(htmlBody, true);

                javaMailSender.send(mimeMessage);
                totalSent++;
                System.out.println("✅ Dispatched email to recipient: " + recipient);
            } catch (Exception e) {
                System.err.println("❌ Failed to send email to " + recipient + ": " + e.getMessage());
            }
        }

        System.out.println("📧 Completed email broadcast. Successfully delivered to " + totalSent + "/" + targetEmails.size() + " recipients.");
    }
}

