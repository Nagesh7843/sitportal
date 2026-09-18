package com.sit.portal.service;

import com.sit.portal.dto.StudentAddressDto;
import com.sit.portal.entity.*;
import com.sit.portal.repository.*;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
@Transactional
@Slf4j
public class StudentService {

    public static final String PIN_CODE_PATTERN = "^[1-9][0-9]{5}$";

    @Autowired
    private StudentRepository studentRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ParentRepository parentRepository;

    @Autowired
    private StudentEnrollmentRepository studentEnrollmentRepository;

    @Autowired
    private StudentAcademicDataRepository studentAcademicDataRepository;

    @Autowired
    private StudentChangeRequestRepository studentChangeRequestRepository;

    @Autowired
    private ParentStudentRelationshipRepository parentStudentRelationshipRepository;

    @Autowired
    private AuditService auditService;

    public List<Student> getAllStudents() {
        return studentRepository.findAll();
    }

    public List<Student> getAllStudents(String department) {
        if (department != null && !department.trim().isEmpty() && !"ALL".equalsIgnoreCase(department.trim())) {
            return studentRepository.findByDepartmentIgnoreCase(department.trim());
        }
        return studentRepository.findAll();
    }

    public Optional<Student> getStudentByEmail(String email) {
        if (email == null || email.trim().isEmpty()) return Optional.empty();
        return studentRepository.findByEmail(email.trim().toLowerCase());
    }

    public Optional<Student> getStudentByIdOrRollNo(String id) {
        if (id == null || id.trim().isEmpty()) return Optional.empty();
        try {
            Long numericId = Long.parseLong(id);
            Optional<Student> studentOpt = studentRepository.findById(numericId);
            if (studentOpt.isPresent()) return studentOpt;
        } catch (NumberFormatException ignored) {}
        return studentRepository.findByRollNo(id.trim());
    }

    public Optional<Student> getStudentByPrn(String prn) {
        if (prn == null || prn.trim().isEmpty()) return Optional.empty();
        return studentRepository.findByPrn(prn.trim());
    }

    public Student addStudent(Student student) {
        if (student.getEmail() != null) {
            student.setEmail(student.getEmail().trim().toLowerCase());
        }
        // Validate address if address fields are provided
        if (student.getAddressLine1() != null || student.getVillageCity() != null || student.getPinCode() != null || student.getDistrict() != null || student.getState() != null) {
            if (student.getState() == null) student.setState("Maharashtra");
            if (student.getCountry() == null) student.setCountry("India");
            validateAddressFields(
                student.getAddressLine1(),
                student.getVillageCity(),
                student.getTaluka(),
                student.getDistrict(),
                student.getState(),
                student.getPinCode(),
                student.getCountry()
            );
        }
        Student saved = studentRepository.save(student);
        syncParentAccount(saved);
        initializeDefaultAcademicData(saved);
        return saved;
    }

    public List<Student> addStudentsBulk(List<Student> students) {
        for (Student s : students) {
            if (s.getEmail() != null) s.setEmail(s.getEmail().trim().toLowerCase());
        }
        List<Student> savedList = studentRepository.saveAll(students);
        for (Student st : savedList) {
            syncParentAccount(st);
            initializeDefaultAcademicData(st);
        }
        return savedList;
    }

    public Optional<Student> updateStudent(String id, Student student) {
        Optional<Student> existingOpt = getStudentByIdOrRollNo(id);
        if (existingOpt.isEmpty() && student.getRollNo() != null) {
            existingOpt = studentRepository.findByRollNo(student.getRollNo().trim());
        }

        return existingOpt.map(existing -> {
            if (student.getName() != null) existing.setName(student.getName());
            if (student.getRollNo() != null) existing.setRollNo(student.getRollNo());
            if (student.getDepartment() != null) existing.setDepartment(student.getDepartment());
            if (student.getAcademicYear() != null) existing.setAcademicYear(student.getAcademicYear());
            if (student.getDivision() != null) existing.setDivision(student.getDivision());
            if (student.getBatchGroup() != null) existing.setBatchGroup(student.getBatchGroup());
            if (student.getCohortBatch() != null) existing.setCohortBatch(student.getCohortBatch());
            if (student.getPrn() != null) existing.setPrn(student.getPrn());
            existing.setGpa(student.getGpa());
            if (student.getEmail() != null) existing.setEmail(student.getEmail().trim().toLowerCase());
            if (student.getAttendance() != null) existing.setAttendance(student.getAttendance());
            if (student.getParentName() != null) existing.setParentName(student.getParentName());
            if (student.getParentEmail() != null) existing.setParentEmail(student.getParentEmail().trim().toLowerCase());
            if (student.getParentPhone() != null) existing.setParentPhone(student.getParentPhone());
            if (student.getParentRelationship() != null) existing.setParentRelationship(student.getParentRelationship());
            if (student.getStatus() != null) existing.setStatus(student.getStatus());

            // Update address fields
            if (student.getAddressLine1() != null) existing.setAddressLine1(student.getAddressLine1().trim());
            if (student.getAddressLine2() != null) existing.setAddressLine2(student.getAddressLine2().trim());
            if (student.getVillageCity() != null) existing.setVillageCity(student.getVillageCity().trim());
            if (student.getTaluka() != null) existing.setTaluka(student.getTaluka().trim());
            if (student.getDistrict() != null) existing.setDistrict(student.getDistrict().trim());
            if (student.getState() != null) existing.setState(student.getState().trim());
            if (student.getPinCode() != null) {
                String pin = student.getPinCode().trim();
                if (!pin.matches(PIN_CODE_PATTERN)) {
                    throw new IllegalArgumentException("Invalid PIN Code. Must be a valid 6-digit Indian postal code (e.g. 416115).");
                }
                existing.setPinCode(pin);
            }
            if (student.getCountry() != null) existing.setCountry(student.getCountry().trim());

            Student updated = studentRepository.save(existing);
            syncParentAccount(updated);
            return updated;
        });
    }

    public void validateAddressFields(String line1, String city, String taluka, String district, String state, String pinCode, String country) {
        if (line1 == null || line1.trim().isEmpty()) {
            throw new IllegalArgumentException("Address Line 1 is required.");
        }
        if (city == null || city.trim().isEmpty()) {
            throw new IllegalArgumentException("Village / City is required.");
        }
        if (taluka == null || taluka.trim().isEmpty()) {
            throw new IllegalArgumentException("Taluka is required.");
        }
        if (district == null || district.trim().isEmpty()) {
            throw new IllegalArgumentException("District is required.");
        }
        if (state == null || state.trim().isEmpty()) {
            throw new IllegalArgumentException("State is required.");
        }
        if (pinCode == null || !pinCode.trim().matches(PIN_CODE_PATTERN)) {
            throw new IllegalArgumentException("Invalid PIN Code. Must be a valid 6-digit Indian postal code (e.g. 416115).");
        }
        if (country == null || country.trim().isEmpty()) {
            throw new IllegalArgumentException("Country is required.");
        }
    }

    public Optional<Student> updateStudentAddress(String identifier, StudentAddressDto dto, String authenticatedEmail, String userRole) {
        Optional<Student> existingOpt = getStudentByIdOrRollNo(identifier);
        if (existingOpt.isEmpty()) {
            existingOpt = getStudentByEmail(identifier);
        }
        if (existingOpt.isEmpty()) {
            existingOpt = getStudentByPrn(identifier);
        }
        if (existingOpt.isEmpty()) return Optional.empty();

        Student student = existingOpt.get();

        // Authorization check: Only the student themselves or admin/hod/faculty can edit
        boolean isPrivilegedStaff = userRole != null && (
                userRole.toUpperCase().contains("ADMIN") ||
                userRole.toUpperCase().contains("HOD") ||
                userRole.toUpperCase().contains("FACULTY")
        );
        boolean isOwnProfile = authenticatedEmail != null && authenticatedEmail.equalsIgnoreCase(student.getEmail());

        if (!isPrivilegedStaff && !isOwnProfile) {
            throw new SecurityException("Unauthorized: Students are only permitted to edit their own home address.");
        }

        String stateVal = dto.getState() != null ? dto.getState() : "Maharashtra";
        String countryVal = dto.getCountry() != null ? dto.getCountry() : "India";

        validateAddressFields(
                dto.getAddressLine1(),
                dto.getVillageCity(),
                dto.getTaluka(),
                dto.getDistrict(),
                stateVal,
                dto.getPinCode(),
                countryVal
        );

        student.setAddressLine1(dto.getAddressLine1().trim());
        student.setAddressLine2(dto.getAddressLine2() != null ? dto.getAddressLine2().trim() : null);
        student.setVillageCity(dto.getVillageCity().trim());
        student.setTaluka(dto.getTaluka().trim());
        student.setDistrict(dto.getDistrict().trim());
        student.setState(stateVal.trim());
        student.setPinCode(dto.getPinCode().trim());
        student.setCountry(countryVal.trim());

        Student saved = studentRepository.save(student);
        auditService.logAction(
                saved.getId(),
                authenticatedEmail,
                "UPDATE_ADDRESS",
                "Student",
                saved.getPrn(),
                "Address updated",
                saved.getVillageCity() + ", " + saved.getDistrict() + " - " + saved.getPinCode(),
                "SUCCESS",
                null
        );
        return Optional.of(saved);
    }

    public Student maskAddressIfUnauthorized(Student student, Authentication authentication) {
        if (student == null) return null;
        if (isAuthorizedToViewAddress(student, authentication)) {
            return student;
        }

        // Return a copy with address masked to protect student privacy
        return Student.builder()
                .id(student.getId())
                .userId(student.getUserId())
                .department(student.getDepartment())
                .name(student.getName())
                .rollNo(student.getRollNo())
                .academicYear(student.getAcademicYear())
                .division(student.getDivision())
                .batchGroup(student.getBatchGroup())
                .cohortBatch(student.getCohortBatch())
                .prn(student.getPrn())
                .gpa(student.getGpa())
                .email(student.getEmail())
                .attendance(student.getAttendance())
                .parentName(student.getParentName())
                .parentEmail(student.getParentEmail())
                .parentPhone(student.getParentPhone())
                .parentRelationship(student.getParentRelationship())
                .status(student.getStatus())
                .addressLine1(null)
                .addressLine2(null)
                .villageCity(null)
                .taluka(null)
                .district(null)
                .state(null)
                .pinCode(null)
                .country(null)
                .build();
    }

    public boolean isAuthorizedToViewAddress(Student student, Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) return false;

        boolean isStaff = authentication.getAuthorities().stream()
                .anyMatch(a -> {
                    String auth = a.getAuthority().toUpperCase();
                    return auth.contains("ADMIN") || auth.contains("HOD") || auth.contains("FACULTY");
                });

        if (isStaff) return true;

        // Student can view their own address
        String callerName = authentication.getName();
        return callerName != null && student.getEmail() != null && callerName.equalsIgnoreCase(student.getEmail());
    }

    @Transactional
    public boolean deleteStudent(String idOrPrn) {
        Optional<Student> studentOpt = getStudentByIdOrRollNo(idOrPrn);
        if (studentOpt.isEmpty()) {
            studentOpt = studentRepository.findByPrn(idOrPrn);
        }
        if (studentOpt.isEmpty()) return false;

        Student student = studentOpt.get();
        String prn = student.getPrn();
        Long numericId = student.getId();

        // 1. Clean up student_academic_data, enrollments, change requests, and parent links
        if (prn != null && !prn.trim().isEmpty()) {
            studentAcademicDataRepository.findByPrn(prn).ifPresent(studentAcademicDataRepository::delete);
            studentEnrollmentRepository.findByPrnOrderByCreatedAtDesc(prn).forEach(studentEnrollmentRepository::delete);
            studentChangeRequestRepository.findByPrnOrderByCreatedAtDesc(prn).forEach(studentChangeRequestRepository::delete);
            parentStudentRelationshipRepository.findByPrn(prn).forEach(parentStudentRelationshipRepository::delete);
        }
        if (numericId != null) {
            studentAcademicDataRepository.findByStudentId(numericId).ifPresent(studentAcademicDataRepository::delete);
        }

        // 2. Clean up login user if student account exists
        if (student.getEmail() != null && !student.getEmail().trim().isEmpty()) {
            userRepository.findByEmail(student.getEmail().trim().toLowerCase()).ifPresent(user -> {
                if ("student".equalsIgnoreCase(user.getRole())) {
                    userRepository.delete(user);
                }
            });
        }

        // 3. Delete student record from students table in PostgreSQL
        studentRepository.delete(student);

        // 4. Audit record
        try {
            auditService.logAction(
                    student.getId(),
                    "admin",
                    "DELETE_STUDENT",
                    "Student",
                    student.getPrn(),
                    "Student record deleted",
                    student.getName() + " (" + student.getPrn() + ")",
                    "SUCCESS",
                    null
            );
        } catch (Exception ignored) {}

        return true;
    }

    @Transactional
    public boolean deleteStudent(Long id) {
        return deleteStudent(String.valueOf(id));
    }

    // --- Enrollment History ---
    public List<StudentEnrollment> getEnrollmentHistory(String prn) {
        return studentEnrollmentRepository.findByPrnOrderByCreatedAtDesc(prn);
    }

    public Optional<StudentEnrollment> getCurrentEnrollment(String prn) {
        return studentEnrollmentRepository.findByPrnAndIsCurrentTrue(prn);
    }

    public StudentEnrollment enrollStudent(StudentEnrollment enrollment) {
        if (Boolean.TRUE.equals(enrollment.getIsCurrent())) {
            // mark previous active enrollment as history
            studentEnrollmentRepository.findByPrnAndIsCurrentTrue(enrollment.getPrn())
                    .ifPresent(prev -> {
                        prev.setIsCurrent(false);
                        studentEnrollmentRepository.save(prev);
                    });
        }
        return studentEnrollmentRepository.save(enrollment);
    }

    // --- Academic Data (CGPA, 10th, 12th/Diploma) ---
    public Optional<StudentAcademicData> getAcademicDataByPrn(String prn) {
        return studentAcademicDataRepository.findByPrn(prn);
    }

    public StudentAcademicData saveOrUpdateAcademicData(StudentAcademicData data) {
        if (data.getStudentId() == null && data.getPrn() != null) {
            studentRepository.findByPrn(data.getPrn()).ifPresent(s -> data.setStudentId(s.getId()));
        }
        Optional<StudentAcademicData> existingOpt = studentAcademicDataRepository.findByPrn(data.getPrn());
        if (existingOpt.isPresent()) {
            StudentAcademicData existing = existingOpt.get();
            if (data.getCgpa() != null) existing.setCgpa(data.getCgpa());
            if (data.getTenthPercentage() != null) existing.setTenthPercentage(data.getTenthPercentage());
            if (data.getTwelfthPercentage() != null) existing.setTwelfthPercentage(data.getTwelfthPercentage());
            if (data.getDiplomaPercentage() != null) existing.setDiplomaPercentage(data.getDiplomaPercentage());
            if (data.getQualificationPath() != null) existing.setQualificationPath(data.getQualificationPath());
            if (data.getActiveBacklogs() != null) existing.setActiveBacklogs(data.getActiveBacklogs());
            if (data.getTotalBacklogs() != null) existing.setTotalBacklogs(data.getTotalBacklogs());
            existing.setUpdatedAt(LocalDateTime.now());
            return studentAcademicDataRepository.save(existing);
        }
        if (data.getCreatedAt() == null) data.setCreatedAt(LocalDateTime.now());
        data.setUpdatedAt(LocalDateTime.now());
        return studentAcademicDataRepository.save(data);
    }

    // --- Self-Service Change Requests ---
    public StudentChangeRequest submitChangeRequest(StudentChangeRequest request) {
        if (request.getStudentId() == null && request.getPrn() != null) {
            studentRepository.findByPrn(request.getPrn()).ifPresent(s -> request.setStudentId(s.getId()));
        }
        request.setStatus("PENDING");
        request.setCreatedAt(LocalDateTime.now());
        StudentChangeRequest saved = studentChangeRequestRepository.save(request);

        auditService.logAction(
                saved.getStudentId(),
                null,
                "SUBMIT_CHANGE_REQUEST",
                "StudentChangeRequest",
                String.valueOf(saved.getId()),
                request.getOldValue(),
                request.getNewValue(),
                "PENDING",
                null
        );
        return saved;
    }

    public List<StudentChangeRequest> getChangeRequests(String prn, String status) {
        if (prn != null && !prn.trim().isEmpty()) {
            return studentChangeRequestRepository.findByPrnOrderByCreatedAtDesc(prn);
        }
        if (status != null && !status.trim().isEmpty()) {
            return studentChangeRequestRepository.findByStatusOrderByCreatedAtDesc(status);
        }
        return studentChangeRequestRepository.findAll();
    }

    public Optional<StudentChangeRequest> verifyChangeRequest(Long id, String status, Long verifierUserId, String comments) {
        return studentChangeRequestRepository.findById(id).map(request -> {
            request.setStatus(status != null ? status.toUpperCase() : "APPROVED");
            request.setVerifiedByUserId(verifierUserId);
            request.setVerifiedAt(LocalDateTime.now());
            request.setComments(comments);
            StudentChangeRequest updated = studentChangeRequestRepository.save(request);

            if ("APPROVED".equalsIgnoreCase(updated.getStatus())) {
                // Apply update to student profile if field matches
                studentRepository.findByPrn(updated.getPrn()).ifPresent(student -> {
                    applyApprovedField(student, updated.getFieldName(), updated.getNewValue());
                    studentRepository.save(student);
                });
            }

            auditService.logAction(
                    verifierUserId,
                    null,
                    "VERIFY_CHANGE_REQUEST_" + updated.getStatus(),
                    "StudentChangeRequest",
                    String.valueOf(updated.getId()),
                    request.getOldValue(),
                    request.getNewValue(),
                    updated.getStatus(),
                    null
            );

            return updated;
        });
    }

    private void applyApprovedField(Student student, String fieldName, String newValue) {
        if ("phone".equalsIgnoreCase(fieldName) || "parentPhone".equalsIgnoreCase(fieldName)) {
            student.setParentPhone(newValue);
        } else if ("parentName".equalsIgnoreCase(fieldName)) {
            student.setParentName(newValue);
        } else if ("parentEmail".equalsIgnoreCase(fieldName)) {
            student.setParentEmail(newValue);
        }
    }

    public void syncParentAccount(Student student) {
        if (student.getParentEmail() == null || student.getParentEmail().trim().isEmpty()) {
            return;
        }

        String email = student.getParentEmail().trim().toLowerCase();
        Optional<User> userOpt = userRepository.findByEmail(email);
        Long userId = userOpt.map(User::getId).orElse(null);

        String identifier = student.getRollNo() != null ? student.getRollNo() : student.getPrn();
        if (identifier == null) return;

        Optional<Parent> parentOpt = parentRepository.findByStudentRollNo(identifier);
        Parent parent;
        if (parentOpt.isPresent()) {
            parent = parentOpt.get();
            if (userId != null) parent.setUserId(userId);
            parent.setStudentName(student.getName());
            if (student.getParentPhone() != null) parent.setAlternatePhone(student.getParentPhone());
            if (student.getParentRelationship() != null) parent.setRelationship(student.getParentRelationship());
        } else {
            parent = Parent.builder()
                    .userId(userId)
                    .studentRollNo(identifier)
                    .studentName(student.getName())
                    .alternatePhone(student.getParentPhone())
                    .relationship(student.getParentRelationship() != null ? student.getParentRelationship() : "Parent/Guardian")
                    .occupation("Guardian")
                    .createdAt(LocalDateTime.now())
                    .build();
        }
        Parent savedParent = parentRepository.save(parent);

        // Sync ParentStudentRelationship
        if (student.getPrn() != null && savedParent.getId() != null && student.getId() != null) {
            Optional<ParentStudentRelationship> relOpt = parentStudentRelationshipRepository.findByParentIdAndStudentId(savedParent.getId(), student.getId());
            if (relOpt.isEmpty()) {
                parentStudentRelationshipRepository.save(ParentStudentRelationship.builder()
                        .parentId(savedParent.getId())
                        .studentId(student.getId())
                        .prn(student.getPrn())
                        .relationshipType(parent.getRelationship())
                        .status("VERIFIED")
                        .verifiedAt(LocalDateTime.now())
                        .createdAt(LocalDateTime.now())
                        .build());
            }
        }
    }

    private void initializeDefaultAcademicData(Student student) {
        if (student.getPrn() != null && student.getId() != null) {
            if (studentAcademicDataRepository.findByPrn(student.getPrn()).isEmpty()) {
                BigDecimal gpaVal = BigDecimal.valueOf(student.getGpa() != null && student.getGpa() > 0 ? student.getGpa() : 3.50);
                studentAcademicDataRepository.save(StudentAcademicData.builder()
                        .studentId(student.getId())
                        .prn(student.getPrn())
                        .cgpa(gpaVal)
                        .tenthPercentage(new BigDecimal("78.50"))
                        .twelfthPercentage(new BigDecimal("75.00"))
                        .diplomaPercentage(BigDecimal.ZERO)
                        .qualificationPath("12TH")
                        .createdAt(LocalDateTime.now())
                        .build());
            }
        }
    }
}
