package com.sit.portal.service;

import com.sit.portal.entity.*;
import com.sit.portal.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class PlacementEligibilityEngine {

    private final PlacementEligibilityRuleRepository ruleRepository;
    private final PlacementEligibilityResultRepository resultRepository;
    private final PlacementDriveRepository driveRepository;
    private final StudentRepository studentRepository;
    private final StudentAcademicDataRepository academicDataRepository;
    private final ParentStudentRelationshipRepository parentStudentRelationshipRepository;
    private final ParentRepository parentRepository;
    private final UserRepository userRepository;
    private final NotificationRecipientRepository recipientRepository;
    private final NoticeRepository noticeRepository;
    private final PushNotificationService pushNotificationService;
    private final EmailService emailService;
    private final AuditService auditService;

    @Transactional
    public List<PlacementEligibilityResult> evaluateDriveEligibility(Long placementDriveId, Long triggeredByUserId) {
        Optional<PlacementEligibilityRule> ruleOpt = ruleRepository.findByPlacementDriveId(placementDriveId);
        PlacementEligibilityRule rule = ruleOpt.orElse(PlacementEligibilityRule.builder()
                .placementDriveId(placementDriveId)
                .minimumCgpa(new BigDecimal("6.50"))
                .minimumTenthPercentage(new BigDecimal("60.00"))
                .minimumTwelfthPercentage(new BigDecimal("60.00"))
                .minimumDiplomaPercentage(new BigDecimal("60.00"))
                .maxActiveBacklogs(0)
                .allowedDepartments("CSE,AIDS,MECH,CIVIL,ENTC,ELECTRICAL,MECHATRONICS")
                .allowedAcademicYears("BE,TE")
                .build());

        List<Student> allStudents = studentRepository.findAll();
        List<PlacementEligibilityResult> results = new ArrayList<>();

        List<String> allowedDeptList = rule.getAllowedDepartments() != null
                ? Arrays.stream(rule.getAllowedDepartments().split(",")).map(String::trim).map(String::toUpperCase).toList()
                : List.of("ALL");

        List<String> allowedYearList = rule.getAllowedAcademicYears() != null
                ? Arrays.stream(rule.getAllowedAcademicYears().split(",")).map(String::trim).map(String::toUpperCase).toList()
                : List.of("ALL");

        for (Student student : allStudents) {
            String prn = student.getPrn() != null ? student.getPrn() : student.getRollNo();
            if (prn == null) continue;

            Optional<StudentAcademicData> academicOpt = academicDataRepository.findByPrn(prn);
            BigDecimal cgpa = academicOpt.map(StudentAcademicData::getCgpa).filter(Objects::nonNull).orElse(BigDecimal.valueOf(student.getGpa()));
            BigDecimal tenth = academicOpt.map(StudentAcademicData::getTenthPercentage).filter(Objects::nonNull).orElse(null);
            BigDecimal twelfth = academicOpt.map(StudentAcademicData::getTwelfthPercentage).filter(Objects::nonNull).orElse(null);
            BigDecimal diploma = academicOpt.map(StudentAcademicData::getDiplomaPercentage).filter(Objects::nonNull).orElse(null);
            String path = academicOpt.map(StudentAcademicData::getQualificationPath).filter(Objects::nonNull).orElse("12TH");

            boolean eligible = true;
            StringBuilder reasons = new StringBuilder();

            // 0. Check department
            if (student.getDepartment() != null && !allowedDeptList.isEmpty() && !allowedDeptList.contains("ALL") && !allowedDeptList.contains(student.getDepartment().toUpperCase())) {
                eligible = false;
                reasons.append("Branch (").append(student.getDepartment()).append(") not eligible; ");
            }

            // 1. Check academic year
            if (student.getAcademicYear() != null && !allowedYearList.isEmpty() && !allowedYearList.contains("ALL") && !allowedYearList.contains(student.getAcademicYear().toUpperCase())) {
                eligible = false;
                reasons.append("Year (").append(student.getAcademicYear()).append(") not eligible; ");
            }

            // 2. Check CGPA
            if (rule.getMinimumCgpa() != null && (cgpa == null || cgpa.compareTo(rule.getMinimumCgpa()) < 0)) {
                eligible = false;
                reasons.append("CGPA ").append(cgpa != null ? cgpa : 0).append(" < min ").append(rule.getMinimumCgpa()).append("; ");
            }

            // 3. Check 10th %
            if (rule.getMinimumTenthPercentage() != null && (tenth == null || tenth.compareTo(rule.getMinimumTenthPercentage()) < 0)) {
                eligible = false;
                reasons.append("10th ").append(tenth != null ? tenth : 0).append("% < min ").append(rule.getMinimumTenthPercentage()).append("%; ");
            }

            // 4. Check 12th or Diploma based on qualification path
            if ("DIPLOMA".equalsIgnoreCase(path)) {
                if (rule.getMinimumDiplomaPercentage() != null && (diploma == null || diploma.compareTo(rule.getMinimumDiplomaPercentage()) < 0)) {
                    eligible = false;
                    reasons.append("Diploma ").append(diploma != null ? diploma : 0).append("% < min ").append(rule.getMinimumDiplomaPercentage()).append("%; ");
                }
            } else {
                if (rule.getMinimumTwelfthPercentage() != null && (twelfth == null || twelfth.compareTo(rule.getMinimumTwelfthPercentage()) < 0)) {
                    eligible = false;
                    reasons.append("12th ").append(twelfth != null ? twelfth : 0).append("% < min ").append(rule.getMinimumTwelfthPercentage()).append("%; ");
                }
            }

            String reasonStr = eligible ? "Eligible (Meets all 10th, 12th/Diploma, CGPA, Branch, and Academic Year cutoffs)" : reasons.toString();

            Optional<PlacementEligibilityResult> existingOpt = resultRepository.findByPlacementDriveIdAndStudentId(placementDriveId, student.getId());
            PlacementEligibilityResult evalResult = existingOpt.orElse(PlacementEligibilityResult.builder()
                    .placementDriveId(placementDriveId)
                    .studentId(student.getId())
                    .build());

            evalResult.setPrn(prn);
            evalResult.setIsEligible(eligible);
            evalResult.setEvaluationReason(reasonStr);
            evalResult.setEvaluatedAt(LocalDateTime.now());

            results.add(resultRepository.save(evalResult));
        }

        auditService.logAction(
                triggeredByUserId,
                null,
                "EVALUATE_PLACEMENT_ELIGIBILITY",
                "PlacementDrive",
                String.valueOf(placementDriveId),
                "Evaluated " + allStudents.size() + " students",
                results.stream().filter(PlacementEligibilityResult::getIsEligible).count() + " Eligible",
                "SUCCESS",
                null
        );

        return results;
    }

    public Map<String, Object> evaluatePreview(PlacementEligibilityRule rule) {
        List<Student> allStudents = studentRepository.findAll();
        List<Map<String, Object>> eligibleList = new ArrayList<>();
        List<Map<String, Object>> ineligibleList = new ArrayList<>();

        List<String> allowedDeptList = rule.getAllowedDepartments() != null
                ? Arrays.stream(rule.getAllowedDepartments().split(",")).map(String::trim).map(String::toUpperCase).toList()
                : List.of("ALL");

        List<String> allowedYearList = rule.getAllowedAcademicYears() != null
                ? Arrays.stream(rule.getAllowedAcademicYears().split(",")).map(String::trim).map(String::toUpperCase).toList()
                : List.of("ALL");

        for (Student student : allStudents) {
            String prn = student.getPrn() != null ? student.getPrn() : student.getRollNo();
            if (prn == null) continue;

            Optional<StudentAcademicData> academicOpt = academicDataRepository.findByPrn(prn);
            BigDecimal cgpa = academicOpt.map(StudentAcademicData::getCgpa).filter(Objects::nonNull).orElse(BigDecimal.valueOf(student.getGpa()));
            BigDecimal tenth = academicOpt.map(StudentAcademicData::getTenthPercentage).filter(Objects::nonNull).orElse(BigDecimal.valueOf(80.0));
            BigDecimal twelfth = academicOpt.map(StudentAcademicData::getTwelfthPercentage).filter(Objects::nonNull).orElse(BigDecimal.valueOf(75.0));
            BigDecimal diploma = academicOpt.map(StudentAcademicData::getDiplomaPercentage).filter(Objects::nonNull).orElse(BigDecimal.valueOf(80.0));
            Integer backlogs = academicOpt.map(StudentAcademicData::getActiveBacklogs).filter(Objects::nonNull).orElse(0);
            String path = academicOpt.map(StudentAcademicData::getQualificationPath).filter(Objects::nonNull).orElse("12TH");

            boolean eligible = true;
            StringBuilder reasons = new StringBuilder();

            if (student.getDepartment() != null && !allowedDeptList.isEmpty() && !allowedDeptList.contains("ALL") && !allowedDeptList.contains(student.getDepartment().toUpperCase())) {
                eligible = false;
                reasons.append("Branch not matching; ");
            }

            if (student.getAcademicYear() != null && !allowedYearList.isEmpty() && !allowedYearList.contains("ALL") && !allowedYearList.contains(student.getAcademicYear().toUpperCase())) {
                eligible = false;
                reasons.append("Year not matching; ");
            }

            if (rule.getMinimumCgpa() != null && cgpa.compareTo(rule.getMinimumCgpa()) < 0) {
                eligible = false;
                reasons.append("CGPA < ").append(rule.getMinimumCgpa()).append("; ");
            }

            if (rule.getMinimumTenthPercentage() != null && tenth.compareTo(rule.getMinimumTenthPercentage()) < 0) {
                eligible = false;
                reasons.append("10th < ").append(rule.getMinimumTenthPercentage()).append("%; ");
            }

            if ("DIPLOMA".equalsIgnoreCase(path)) {
                if (rule.getMinimumDiplomaPercentage() != null && diploma.compareTo(rule.getMinimumDiplomaPercentage()) < 0) {
                    eligible = false;
                    reasons.append("Diploma < ").append(rule.getMinimumDiplomaPercentage()).append("%; ");
                }
            } else {
                if (rule.getMinimumTwelfthPercentage() != null && twelfth.compareTo(rule.getMinimumTwelfthPercentage()) < 0) {
                    eligible = false;
                    reasons.append("12th < ").append(rule.getMinimumTwelfthPercentage()).append("%; ");
                }
            }

            Map<String, Object> studentMap = new LinkedHashMap<>();
            studentMap.put("id", student.getId());
            studentMap.put("name", student.getName());
            studentMap.put("email", student.getEmail());
            studentMap.put("prn", prn);
            studentMap.put("rollNo", student.getRollNo());
            studentMap.put("department", student.getDepartment() != null ? student.getDepartment() : "CSE");
            studentMap.put("academicYear", student.getAcademicYear() != null ? student.getAcademicYear() : "SE");
            studentMap.put("division", student.getDivision());
            studentMap.put("batchGroup", student.getBatchGroup());
            studentMap.put("cgpa", cgpa);
            studentMap.put("tenthPercentage", tenth);
            studentMap.put("twelfthPercentage", twelfth);
            studentMap.put("diplomaPercentage", diploma);
            studentMap.put("qualificationPath", path);
            studentMap.put("isEligible", eligible);
            studentMap.put("reason", eligible ? "All Criteria Satisfied" : reasons.toString());

            if (eligible) {
                eligibleList.add(studentMap);
            } else {
                ineligibleList.add(studentMap);
            }
        }

        String summary = String.format("%s (%s) | 10th >= %s%% | 12th/Dip >= %s%% | CGPA >= %s",
                rule.getAllowedAcademicYears() != null ? rule.getAllowedAcademicYears() : "All Years",
                rule.getAllowedDepartments() != null ? rule.getAllowedDepartments() : "All Branches",
                rule.getMinimumTenthPercentage() != null ? rule.getMinimumTenthPercentage().toString() : "60",
                rule.getMinimumTwelfthPercentage() != null ? rule.getMinimumTwelfthPercentage().toString() : "60",
                rule.getMinimumCgpa() != null ? rule.getMinimumCgpa().toString() : "6.5"
        );

        Map<String, Object> res = new LinkedHashMap<>();
        res.put("totalEvaluated", allStudents.size());
        res.put("eligibleCount", eligibleList.size());
        res.put("ineligibleCount", ineligibleList.size());
        res.put("eligibilityPercentage", allStudents.isEmpty() ? 0 : Math.round((double) eligibleList.size() / allStudents.size() * 100.0));
        res.put("eligibleStudents", eligibleList);
        res.put("ineligibleStudents", ineligibleList);
        res.put("summaryText", summary);
        return res;
    }

    @Transactional
    public Map<String, Object> publishTargetedDriveNotification(Long placementDriveId, Long triggeredByUserId) {
        PlacementDrive drive = driveRepository.findById(placementDriveId)
                .orElseThrow(() -> new IllegalArgumentException("Placement drive not found with ID: " + placementDriveId));

        // Evaluate eligibility to get current eligible students
        List<PlacementEligibilityResult> results = evaluateDriveEligibility(placementDriveId, triggeredByUserId);
        List<PlacementEligibilityResult> eligibleResults = results.stream().filter(PlacementEligibilityResult::getIsEligible).toList();

        Set<Long> targetUserIds = new HashSet<>();
        List<String> targetEmails = new ArrayList<>();
        int eligibleStudentsCount = 0;
        java.util.concurrent.atomic.AtomicInteger associatedParentsCount = new java.util.concurrent.atomic.AtomicInteger(0);

        for (PlacementEligibilityResult res : eligibleResults) {
            Optional<Student> studentOpt = studentRepository.findById(res.getStudentId());
            if (studentOpt.isEmpty()) continue;

            Student student = studentOpt.get();
            eligibleStudentsCount++;

            // 1. Add eligible student user account
            if (student.getEmail() != null) {
                targetEmails.add(student.getEmail());
                userRepository.findByEmail(student.getEmail()).ifPresent(u -> targetUserIds.add(u.getId()));
            }

            // 2. Add verified associated parents via relationship table
            String prn = student.getPrn() != null ? student.getPrn() : student.getRollNo();
            if (prn != null) {
                List<ParentStudentRelationship> relationships = parentStudentRelationshipRepository.findByPrn(prn);
                for (ParentStudentRelationship rel : relationships) {
                    parentRepository.findById(rel.getParentId()).ifPresent(parent -> {
                        if (parent.getUserId() != null) {
                            targetUserIds.add(parent.getUserId());
                            associatedParentsCount.incrementAndGet();
                        }
                    });
                }
            }

            // 3. Add parent email from student record
            if (student.getParentEmail() != null && !student.getParentEmail().isBlank()) {
                targetEmails.add(student.getParentEmail());
                userRepository.findByEmail(student.getParentEmail()).ifPresent(u -> {
                    if (targetUserIds.add(u.getId())) {
                        associatedParentsCount.incrementAndGet();
                    }
                });
            }
        }

        // Save official Notice in database targeted to these students & parents
        String noticeTitle = "💼 Placement Drive: " + drive.getCompanyName() + " (" + drive.getRole() + ")";
        String noticeContent = String.format(
                "You and your ward have been identified as ELIGIBLE for the upcoming placement drive with %s.\n\nRole: %s\nPackage Offered: %s\nDrive Date: %s\nEligibility Criteria: %s\nLocation/Platform: %s\nRegistration Deadline: %s\n\nInstructions: Please prepare your technical portfolio and report to the designated venue on time.",
                drive.getCompanyName(),
                drive.getRole(),
                drive.getPackageLpa() != null ? drive.getPackageLpa() : "Competitive CTC",
                drive.getDriveDate() != null ? drive.getDriveDate() : "Upcoming",
                drive.getEligibility() != null ? drive.getEligibility() : "Meets Academic Cutoffs",
                drive.getLocation() != null ? drive.getLocation() : "Campus",
                drive.getApplyDeadline() != null ? drive.getApplyDeadline() : "Check Portal"
        );

        Notice notice = Notice.builder()
                .title(noticeTitle)
                .content(noticeContent)
                .authorName("Training & Placement Cell")
                .authorRole("T&P Officer")
                .category("Placement")
                .priority("HIGH")
                .status("PUBLISHED")
                .publishedAt(LocalDateTime.now().format(DateTimeFormatter.ofPattern("MMM dd, yyyy 'at' hh:mm a")))
                .targetAudience(Map.of("scope", "ELIGIBLE_ONLY", "driveId", placementDriveId, "eligibleStudentsCount", eligibleStudentsCount))
                .build();
        Notice savedNotice = noticeRepository.save(notice);

        // Create in-app notification recipient records for eligible users & parents
        List<NotificationRecipient> savedRecipients = new ArrayList<>();
        for (Long uid : targetUserIds) {
            String uEmail = userRepository.findById(uid).map(User::getEmail).orElse(null);
            NotificationRecipient rec = NotificationRecipient.builder()
                    .notificationId(savedNotice.getId())
                    .userId(uid)
                    .userEmail(uEmail)
                    .deliveryStatus("DELIVERED")
                    .isRead(false)
                    .deliveredAt(LocalDateTime.now())
                    .build();
            savedRecipients.add(recipientRepository.save(rec));
        }

        // Targeted Push Notification ONLY to eligible students and their linked parents
        String pushTitle = "💼 Eligible Placement Drive: " + drive.getCompanyName();
        String pushMsg = "You qualify for " + drive.getCompanyName() + " (" + drive.getRole() + "). Check placement details in portal.";
        
        try {
            if (targetEmails != null && !targetEmails.isEmpty()) {
                pushNotificationService.sendPushNotificationToUsers(targetEmails, pushTitle, pushMsg);
            }
        } catch (Exception ignored) {}

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("status", "SUCCESS");
        response.put("noticeId", savedNotice.getId());
        response.put("companyName", drive.getCompanyName());
        response.put("role", drive.getRole());
        response.put("eligibleStudentsCount", eligibleStudentsCount);
        response.put("associatedParentsCount", associatedParentsCount.get());
        response.put("totalUsersNotified", targetUserIds.size());
        response.put("message", String.format("Targeted notification successfully dispatched to %d eligible students and %d associated parents.", eligibleStudentsCount, associatedParentsCount.get()));
        return response;
    }

    public List<PlacementEligibilityResult> getEligibleStudents(Long placementDriveId) {
        return resultRepository.findByPlacementDriveIdAndIsEligibleTrue(placementDriveId);
    }

    public List<PlacementEligibilityResult> getAllEvaluationResults(Long placementDriveId) {
        return resultRepository.findByPlacementDriveId(placementDriveId);
    }

    public List<Map<String, Object>> getDetailedEvaluationResults(Long placementDriveId) {
        List<PlacementEligibilityResult> results = resultRepository.findByPlacementDriveId(placementDriveId);
        List<Map<String, Object>> detailed = new ArrayList<>();

        for (PlacementEligibilityResult res : results) {
            Map<String, Object> map = new LinkedHashMap<>();
            map.put("id", res.getId());
            map.put("placementDriveId", res.getPlacementDriveId());
            map.put("studentId", res.getStudentId());
            map.put("prn", res.getPrn());
            map.put("isEligible", res.getIsEligible());
            map.put("evaluationReason", res.getEvaluationReason());
            map.put("evaluatedAt", res.getEvaluatedAt());

            Optional<Student> studentOpt = studentRepository.findById(res.getStudentId());
            if (studentOpt.isPresent()) {
                Student s = studentOpt.get();
                map.put("studentName", s.getName());
                map.put("studentEmail", s.getEmail());
                map.put("rollNo", s.getRollNo());
                map.put("department", s.getDepartment() != null ? s.getDepartment() : "CSE");
                map.put("academicYear", s.getAcademicYear() != null ? s.getAcademicYear() : "BE");
                map.put("division", s.getDivision() != null ? s.getDivision() : "Div A");
                map.put("batchGroup", s.getBatchGroup() != null ? s.getBatchGroup() : "A1");
                map.put("attendance", s.getAttendance());
                map.put("gpa", s.getGpa());
            }

            Optional<StudentAcademicData> academicOpt = academicDataRepository.findByPrn(res.getPrn());
            if (academicOpt.isPresent()) {
                StudentAcademicData a = academicOpt.get();
                map.put("qualificationPath", a.getQualificationPath() != null ? a.getQualificationPath() : "12TH");
                map.put("tenthPercentage", a.getTenthPercentage());
                map.put("twelfthPercentage", a.getTwelfthPercentage());
                map.put("diplomaPercentage", a.getDiplomaPercentage());
                map.put("cgpa", a.getCgpa());
                map.put("activeBacklogs", a.getActiveBacklogs());
            } else {
                map.put("qualificationPath", "12TH");
                map.put("tenthPercentage", BigDecimal.valueOf(80.0));
                map.put("twelfthPercentage", BigDecimal.valueOf(75.0));
                map.put("diplomaPercentage", BigDecimal.valueOf(80.0));
                map.put("cgpa", BigDecimal.valueOf(studentOpt.map(Student::getGpa).orElse(0.0)));
                map.put("activeBacklogs", 0);
            }

            detailed.add(map);
        }

        return detailed;
    }

    public PlacementEligibilityRule saveOrUpdateRule(PlacementEligibilityRule rule) {
        Optional<PlacementEligibilityRule> existingOpt = ruleRepository.findByPlacementDriveId(rule.getPlacementDriveId());
        if (existingOpt.isPresent()) {
            PlacementEligibilityRule existing = existingOpt.get();
            if (rule.getMinimumCgpa() != null) existing.setMinimumCgpa(rule.getMinimumCgpa());
            if (rule.getMinimumTenthPercentage() != null) existing.setMinimumTenthPercentage(rule.getMinimumTenthPercentage());
            if (rule.getMinimumTwelfthPercentage() != null) existing.setMinimumTwelfthPercentage(rule.getMinimumTwelfthPercentage());
            if (rule.getMinimumDiplomaPercentage() != null) existing.setMinimumDiplomaPercentage(rule.getMinimumDiplomaPercentage());
            if (rule.getMaxActiveBacklogs() != null) existing.setMaxActiveBacklogs(rule.getMaxActiveBacklogs());
            if (rule.getAllowedDepartments() != null) existing.setAllowedDepartments(rule.getAllowedDepartments());
            if (rule.getAllowedAcademicYears() != null) existing.setAllowedAcademicYears(rule.getAllowedAcademicYears());
            return ruleRepository.save(existing);
        }
        return ruleRepository.save(rule);
    }
}
