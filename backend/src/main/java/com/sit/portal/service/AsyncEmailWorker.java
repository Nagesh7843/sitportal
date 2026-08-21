package com.sit.portal.service;

import com.sit.portal.dto.BroadcastRequest;
import com.sit.portal.dto.ContactFacultyRequest;
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

    @Value("${spring.mail.username:notifications@sitcoe.org.in}")
    private String smtpSystemAddress;

    /**
     * Dispatches broadcast emails directly and reliably to recipients with dynamic sender identity.
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
        String fromAddress = smtpSystemAddress;
        
        // Dynamic sender display name
        String senderDisplayName = (request.getSenderName() != null && !request.getSenderName().trim().isEmpty())
                ? request.getSenderName().trim() + " (SIT CSE Portal)"
                : "Sharad Institute of Technology CSE Portal";

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

        String senderMetaHtml = "";
        if (request.getSenderName() != null && !request.getSenderName().trim().isEmpty()) {
            senderMetaHtml = "<div style='margin-bottom:16px;padding:10px 14px;background:#f8fafc;border-left:4px solid #000666;border-radius:4px;font-size:12px;color:#475569;'>"
                    + "<strong>Transmitted By:</strong> " + request.getSenderName()
                    + (request.getSenderRole() != null ? " (" + request.getSenderRole() + ")" : "")
                    + (request.getSenderEmail() != null ? " &bull; <a href='mailto:" + request.getSenderEmail() + "' style='color:#00429c;text-decoration:none;'>" + request.getSenderEmail() + "</a>" : "")
                    + "</div>";
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
                + senderMetaHtml
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

                helper.setFrom(fromAddress, senderDisplayName);
                if (request.getSenderEmail() != null && !request.getSenderEmail().trim().isEmpty() && request.getSenderEmail().contains("@")) {
                    helper.setReplyTo(request.getSenderEmail().trim());
                }
                helper.setTo(recipient.trim());
                helper.setSubject("🏛️ [SIT CSE] " + request.getSubject());
                helper.setText(htmlBody, true);

                javaMailSender.send(mimeMessage);
                totalSent++;
                System.out.println("✅ Dispatched email to recipient: " + recipient + " (Reply-To: " + request.getSenderEmail() + ")");
            } catch (Exception e) {
                System.err.println("❌ Failed to send email to " + recipient + ": " + e.getMessage());
            }
        }

        System.out.println("📧 Completed email broadcast. Successfully delivered to " + totalSent + "/" + targetEmails.size() + " recipients.");
    }

    /**
     * Dispatches a direct student inquiry to a faculty member's institutional inbox.
     * Sets the Reply-To directly to the student's email address.
     */
    @Async
    @Retryable(
        value = { Exception.class },
        maxAttempts = 2,
        backoff = @Backoff(delay = 3000, multiplier = 2)
    )
    public void dispatchFacultyInquiryAsync(ContactFacultyRequest request) {
        if (javaMailSender == null || request.getFacultyEmail() == null || request.getFacultyEmail().trim().isEmpty()) {
            System.out.println("⚠️ JavaMailSender not initialized or faculty email missing.");
            return;
        }

        String studentName = request.getStudentName() != null ? request.getStudentName() : "SIT Student";
        String studentEmail = request.getStudentEmail() != null ? request.getStudentEmail().trim() : "";
        String studentPrn = request.getStudentPrn() != null ? request.getStudentPrn() : "N/A";
        String inquiryType = request.getInquiryType() != null ? request.getInquiryType() : "Academic Inquiry";
        String priorityTag = request.getPriority() != null ? request.getPriority().toUpperCase() : "NORMAL";

        String htmlBody = "<!DOCTYPE html><html><body style='font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica,Arial,sans-serif;background-color:#f8fafc;padding:24px 0;margin:0;'>"
                + "<div style='max-width:600px;margin:0 auto;background:#ffffff;border-radius:12px;border:1px solid #e2e8f0;overflow:hidden;box-shadow:0 4px 6px -1px rgba(0,0,0,0.05);'>"
                + "<div style='background:#000666;padding:20px 24px;text-align:left;border-bottom:3px solid #3b82f6;'>"
                + "<h2 style='color:#ffffff;margin:0;font-size:18px;font-weight:bold;'>Sharad Institute of Technology College of Engineering</h2>"
                + "<p style='color:#93c5fd;margin:4px 0 0 0;font-size:12px;'>Student Inquiry to Faculty &bull; Department of Computer Science & Engineering</p>"
                + "</div>"
                + "<div style='padding:24px;'>"
                + "<div style='display:inline-block;padding:4px 12px;border-radius:20px;background:#dbeafe;color:#1e40af;font-size:12px;font-weight:bold;margin-bottom:12px;'>"
                + "📌 " + inquiryType + " (" + priorityTag + ")</div>"
                + "<h3 style='color:#0f172a;margin:0 0 16px 0;font-size:18px;'>" + request.getSubject() + "</h3>"
                + "<div style='background:#f1f5f9;padding:14px 16px;border-radius:8px;border-left:4px solid #0284c7;margin-bottom:20px;font-size:13px;color:#334155;line-height:1.6;'>"
                + "<strong>Student Name:</strong> " + studentName + "<br>"
                + "<strong>Student Email:</strong> <a href='mailto:" + studentEmail + "' style='color:#0284c7;'>" + studentEmail + "</a><br>"
                + "<strong>PRN / Roll No:</strong> " + studentPrn + "<br>"
                + (request.getAcademicYear() != null ? "<strong>Academic Class:</strong> " + request.getAcademicYear() + " (" + request.getDivision() + ")<br>" : "")
                + "<strong>Target Faculty:</strong> " + request.getFacultyName()
                + "</div>"
                + "<div style='color:#1e293b;font-size:14px;line-height:1.7;white-space:pre-wrap;background:#fafafa;padding:16px;border-radius:8px;border:1px solid #e2e8f0;'>"
                + request.getMessage()
                + "</div>"
                + "<div style='margin-top:20px;padding:12px 16px;background:#eff6ff;border-radius:8px;border:1px solid #bfdbfe;color:#1e40af;font-size:12px;'>"
                + "💡 <strong>Direct Reply Enabled:</strong> Simply hit <em>Reply</em> in your email client to write back directly to <strong>" + studentName + " (" + studentEmail + ")</strong>."
                + "</div>"
                + "</div>"
                + "<div style='background:#f8fafc;padding:16px 24px;border-top:1px solid #e2e8f0;text-align:center;font-size:11px;color:#64748b;'>"
                + "This message was generated from the SITCOE CSE Portal student contact desk.<br>Sharad Institute of Technology College of Engineering, Yadrav (Ichalkaranji)."
                + "</div>"
                + "</div></body></html>";

        try {
            MimeMessage mimeMessage = javaMailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, "UTF-8");

            helper.setFrom(smtpSystemAddress, studentName + " via SIT CSE Portal");
            if (studentEmail.contains("@")) {
                helper.setReplyTo(studentEmail);
            }
            helper.setTo(request.getFacultyEmail().trim());
            helper.setSubject("🎓 [SIT Student Inquiry] " + request.getSubject());
            helper.setText(htmlBody, true);

            javaMailSender.send(mimeMessage);
            System.out.println("✅ Dispatched student inquiry email from " + studentEmail + " to faculty " + request.getFacultyEmail());
        } catch (Exception e) {
            System.err.println("❌ Failed to send student inquiry to faculty " + request.getFacultyEmail() + ": " + e.getMessage());
        }
    }
}


