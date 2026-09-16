package com.sit.portal.service;

import com.sit.portal.entity.*;
import com.sit.portal.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationEngineService {

    private final NotificationTargetRepository targetRepository;
    private final NotificationRecipientRepository recipientRepository;
    private final StudentEnrollmentRepository studentEnrollmentRepository;
    private final StudentRepository studentRepository;
    private final UserRepository userRepository;
    private final ParentRepository parentRepository;
    private final PushNotificationService pushNotificationService;

    @Transactional
    public List<NotificationRecipient> fanOutNotification(Long noticeId, List<NotificationTarget> targets) {
        if (targets != null && !targets.isEmpty()) {
            for (NotificationTarget target : targets) {
                target.setNotificationId(noticeId);
                targetRepository.save(target);
            }
        }

        Set<Long> targetUserIds = resolveRecipientUserIds(targets);
        List<NotificationRecipient> recipients = new ArrayList<>();

        for (Long userId : targetUserIds) {
            Optional<User> userOpt = userRepository.findById(userId);
            String userEmail = userOpt.map(User::getEmail).orElse(null);

            Optional<NotificationRecipient> existing = recipientRepository.findByNotificationIdAndUserId(noticeId, userId);
            if (existing.isEmpty()) {
                NotificationRecipient recipient = NotificationRecipient.builder()
                        .notificationId(noticeId)
                        .userId(userId)
                        .userEmail(userEmail)
                        .deliveryStatus("DELIVERED")
                        .isRead(false)
                        .deliveredAt(LocalDateTime.now())
                        .build();
                recipients.add(recipientRepository.save(recipient));
            }
        }

        return recipients;
    }

    private Set<Long> resolveRecipientUserIds(List<NotificationTarget> targets) {
        Set<Long> userIds = new HashSet<>();

        if (targets == null || targets.isEmpty()) {
            // Default: college-wide to all active users
            userRepository.findAll().forEach(u -> userIds.add(u.getId()));
            return userIds;
        }

        for (NotificationTarget target : targets) {
            String type = target.getScopeType() != null ? target.getScopeType().toUpperCase() : "COLLEGE";
            String idVal = target.getScopeId();

            switch (type) {
                case "COLLEGE":
                    userRepository.findAll().forEach(u -> userIds.add(u.getId()));
                    break;
                case "DEPARTMENT":
                    userRepository.findAll().stream()
                            .filter(u -> idVal.equalsIgnoreCase(u.getDepartment()))
                            .forEach(u -> userIds.add(u.getId()));
                    break;
                case "ROLE":
                    userRepository.findAll().stream()
                            .filter(u -> idVal.equalsIgnoreCase(u.getRole()))
                            .forEach(u -> userIds.add(u.getId()));
                    break;
                case "YEAR":
                    for (Student s : studentRepository.findByAcademicYear(idVal)) {
                        if (s.getEmail() != null) {
                            userRepository.findByEmail(s.getEmail()).ifPresent(u -> userIds.add(u.getId()));
                        }
                    }
                    break;
                case "DIVISION":
                    for (Student s : studentRepository.findAll()) {
                        if (idVal.equalsIgnoreCase(s.getDivision()) && s.getEmail() != null) {
                            userRepository.findByEmail(s.getEmail()).ifPresent(u -> userIds.add(u.getId()));
                        }
                    }
                    break;
                case "BATCH":
                    try {
                        Long batchId = Long.parseLong(idVal);
                        List<StudentEnrollment> enrollments = studentEnrollmentRepository.findByBatchIdAndIsCurrentTrue(batchId);
                        for (StudentEnrollment se : enrollments) {
                            studentRepository.findByPrn(se.getPrn()).ifPresent(s -> {
                                if (s.getEmail() != null) {
                                    userRepository.findByEmail(s.getEmail()).ifPresent(u -> userIds.add(u.getId()));
                                }
                            });
                        }
                    } catch (Exception ignored) {}
                    break;
                case "INDIVIDUAL":
                    userRepository.findByEmail(idVal).ifPresent(u -> userIds.add(u.getId()));
                    break;
                default:
                    // General fallback to department / role
                    userRepository.findAll().forEach(u -> userIds.add(u.getId()));
            }
        }

        return userIds;
    }

    public List<NotificationRecipient> getUserNotifications(Long userId) {
        return recipientRepository.findByUserIdOrderByDeliveredAtDesc(userId);
    }

    public long getUnreadCount(Long userId) {
        return recipientRepository.countByUserIdAndIsReadFalse(userId);
    }

    @Transactional
    public Optional<NotificationRecipient> markAsRead(Long noticeId, Long userId) {
        Optional<NotificationRecipient> recipientOpt = recipientRepository.findByNotificationIdAndUserId(noticeId, userId);
        recipientOpt.ifPresent(r -> {
            r.setIsRead(true);
            r.setReadAt(LocalDateTime.now());
            recipientRepository.save(r);
        });
        return recipientOpt;
    }

    /**
     * Sends a direct device push notification to students in a specific batch/division without creating a public digital notice.
     */
    public Map<String, Object> sendDirectBatchNotification(
            String title,
            String message,
            String department,
            String yearLevel,
            String division,
            String batchCode,
            String urgency,
            Boolean sendEmail,
            List<String> studentEmails
    ) {
        // 1. Gather all student records for this batch
        List<Student> allStudents = (department != null && !"ALL".equalsIgnoreCase(department))
                ? studentRepository.findByDepartment(department)
                : studentRepository.findAll();

        List<Student> targetStudents = new ArrayList<>();

        for (Student s : allStudents) {
            boolean matchesYear = yearLevel == null || "ALL".equalsIgnoreCase(yearLevel) ||
                    (s.getAcademicYear() != null && s.getAcademicYear().equalsIgnoreCase(yearLevel));

            boolean matchesDiv = division == null || "ALL".equalsIgnoreCase(division) ||
                    (s.getDivision() != null && s.getDivision().toLowerCase().contains(division.toLowerCase().replace("div ", "").trim()));

            boolean matchesBatch = batchCode == null || "ALL".equalsIgnoreCase(batchCode) ||
                    (s.getBatchGroup() != null && s.getBatchGroup().toLowerCase().contains(batchCode.toLowerCase().replace("batch ", "").trim()));

            boolean matchesEmail = studentEmails == null || studentEmails.isEmpty() ||
                    (s.getEmail() != null && studentEmails.contains(s.getEmail().trim().toLowerCase()));

            if (matchesYear && matchesDiv && matchesBatch && matchesEmail) {
                targetStudents.add(s);
            }
        }

        // Fallback: if studentEmails provided directly
        if (targetStudents.isEmpty() && studentEmails != null && !studentEmails.isEmpty()) {
            for (String email : studentEmails) {
                studentRepository.findByEmail(email.trim().toLowerCase()).ifPresent(targetStudents::add);
            }
        }

        // 2. Dispatch device Web Push notification ONLY to target student devices (No broadcast to all)
        String pushTitle = String.format("[%s Alert] %s", urgency != null ? urgency.toUpperCase() : "FACULTY", title);
        String pushMsg = message;
        
        List<String> targetEmails = targetStudents.stream()
                .map(Student::getEmail)
                .filter(Objects::nonNull)
                .map(String::trim)
                .map(String::toLowerCase)
                .toList();

        try {
            if (!targetEmails.isEmpty()) {
                pushNotificationService.sendPushNotificationToUsers(targetEmails, pushTitle, pushMsg);
            }
        } catch (Exception e) {
            log.warn("Targeted Web Push dispatch failed: {}", e.getMessage());
        }

        // 3. Return summary response
        Map<String, Object> response = new HashMap<>();
        response.put("status", "success");
        response.put("targetStudentCount", targetStudents.size());
        response.put("title", title);
        response.put("deliveredAt", LocalDateTime.now().toString());
        response.put("message", String.format("Direct device notification successfully sent to %d student devices in %s. No digital notice was posted to the public board.", targetStudents.size(), batchCode != null && !"ALL".equalsIgnoreCase(batchCode) ? batchCode : "selected batch"));

        return response;
    }
}
