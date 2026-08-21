package com.sit.portal.service;

import com.sit.portal.dto.BroadcastRequest;
import com.sit.portal.entity.EmailLogEntity;
import com.sit.portal.entity.Faculty;
import com.sit.portal.entity.Student;
import com.sit.portal.repository.EmailLogRepository;
import com.sit.portal.repository.FacultyRepository;
import com.sit.portal.repository.StudentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class EmailService {

    @Autowired
    private EmailLogRepository emailLogRepository;

    @Autowired
    private StudentRepository studentRepository;

    @Autowired
    private FacultyRepository facultyRepository;

    @Autowired(required = false)
    private JavaMailSender javaMailSender;

    @Autowired
    private AsyncEmailWorker asyncEmailWorker;

    @Value("${spring.mail.username:admin@sit.ac.in}")

    private String senderEmail;

    @Autowired
    private org.springframework.scheduling.TaskScheduler taskScheduler;

    public EmailLogEntity processBroadcast(BroadcastRequest request) {
        List<String> targetEmails = new ArrayList<>();
        String groupName = "";

        if ("STUDENT".equalsIgnoreCase(request.getTargetRole())) {
            if (request.getFilters().getStudentEmails() != null && !request.getFilters().getStudentEmails().isEmpty()) {
                targetEmails = request.getFilters().getStudentEmails();
                groupName = "Individual: " + String.join(", ", targetEmails);
            } else {
                boolean hasYears = request.getFilters().getAcademicYears() != null && !request.getFilters().getAcademicYears().isEmpty();
                boolean hasDivs = request.getFilters().getDivisions() != null && !request.getFilters().getDivisions().isEmpty();
                boolean hasBatches = request.getFilters().getBatches() != null && !request.getFilters().getBatches().isEmpty();

                targetEmails = studentRepository.findEmailsByFilters(
                        hasYears, request.getFilters().getAcademicYears(),
                        hasDivs, request.getFilters().getDivisions(),
                        hasBatches, request.getFilters().getBatches()
                );
                groupName = "Students (" + String.join(", ", hasYears ? request.getFilters().getAcademicYears() : List.of("All")) + ")";
            }
        } else {
            boolean hasIds = request.getFilters().getFacultyIds() != null && !request.getFilters().getFacultyIds().isEmpty();
            List<Long> ids = hasIds ? request.getFilters().getFacultyIds().stream().map(Long::valueOf).collect(Collectors.toList()) : null;
            targetEmails = facultyRepository.findEmailsByIds(hasIds, ids);
            groupName = "Faculty (Manual Selection: " + targetEmails.size() + " members)";
        }

        boolean isScheduled = request.getScheduledAt() != null && !request.getScheduledAt().trim().isEmpty();

        // Save Audit Log
        EmailLogEntity log = new EmailLogEntity();
        log.setSubject(request.getSubject());
        log.setContent(request.getContent());
        log.setPriority(request.getPriority() != null ? request.getPriority() : "NORMAL");
        log.setRecipientGroup(groupName);
        log.setRecipientCount(targetEmails.size());
        log.setOpenRate("0.0%");
        log.setRecipientEmails(String.join(", ", targetEmails));
        if (request.getAttachments() != null && !request.getAttachments().isEmpty()) {
            log.setAttachments(String.join(", ", request.getAttachments()));
        }

        if (isScheduled) {
            log.setStatus("SCHEDULED");
        } else if (targetEmails.isEmpty()) {
            log.setStatus("NO_RECIPIENTS");
        } else if (javaMailSender == null) {
            log.setStatus("SIMULATED");
        } else {
            log.setStatus("SUCCESS");
        }

        EmailLogEntity savedLog = emailLogRepository.save(log);

        if (isScheduled) {
            try {
                java.time.LocalDateTime localDateTime = java.time.LocalDateTime.parse(request.getScheduledAt());
                java.time.Instant executeTime = localDateTime.atZone(java.time.ZoneId.systemDefault()).toInstant();
                List<String> finalTargetEmails = targetEmails;
                taskScheduler.schedule(() -> {
                    asyncEmailWorker.dispatchEmailsAsync(finalTargetEmails, request);
                    savedLog.setStatus("SUCCESS");
                    emailLogRepository.save(savedLog);
                    System.out.println("Scheduled broadcast executed for log ID: " + savedLog.getId());
                }, executeTime);
                System.out.println("Broadcast scheduled for: " + executeTime.toString());
            } catch (Exception e) {
                System.err.println("Failed to schedule broadcast: " + e.getMessage());
                savedLog.setStatus("FAILED");
                emailLogRepository.save(savedLog);
            }
        } else {
            if (!targetEmails.isEmpty()) {
                asyncEmailWorker.dispatchEmailsAsync(targetEmails, request);
            }
        }

        return savedLog;
    }
}
