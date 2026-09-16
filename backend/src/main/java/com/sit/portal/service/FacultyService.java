package com.sit.portal.service;

import com.sit.portal.entity.*;
import com.sit.portal.repository.*;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
@Transactional
@Slf4j
public class FacultyService {

    @Autowired
    private FacultyRepository facultyRepository;

    @Autowired
    private FacultyBatchAssignmentRepository facultyBatchAssignmentRepository;

    @Autowired
    private BatchRepository batchRepository;

    @Autowired
    private StudentEnrollmentRepository studentEnrollmentRepository;

    @Autowired
    private StudentRepository studentRepository;

    @Autowired
    private UserRepository userRepository;

    public List<Faculty> getAllFaculty() {
        return facultyRepository.findAll();
    }

    public List<Faculty> getAllFaculty(String department) {
        if (department != null && !department.trim().isEmpty() && !"ALL".equalsIgnoreCase(department.trim())) {
            return facultyRepository.findByDepartmentIgnoreCase(department.trim());
        }
        return facultyRepository.findAll();
    }

    public Optional<Faculty> getFacultyById(Long id) {
        return facultyRepository.findById(id);
    }

    public Optional<Faculty> getFacultyByEmail(String email) {
        if (email == null) return Optional.empty();
        return facultyRepository.findByEmail(email.trim().toLowerCase());
    }

    public Optional<Faculty> getFacultyByUserId(Long userId) {
        return facultyRepository.findByUserId(userId);
    }

    public Faculty addFaculty(Faculty faculty) {
        if (faculty.getEmail() != null) {
            faculty.setEmail(faculty.getEmail().trim().toLowerCase());
        }
        return facultyRepository.save(faculty);
    }

    public List<Faculty> addFacultyBulk(List<Faculty> facultyList) {
        for (Faculty f : facultyList) {
            if (f.getEmail() != null) {
                f.setEmail(f.getEmail().trim().toLowerCase());
            }
        }
        return facultyRepository.saveAll(facultyList);
    }

    public Optional<Faculty> updateFaculty(Long id, Faculty faculty) {
        return facultyRepository.findById(id).map(existing -> {
            if (faculty.getName() != null) existing.setName(faculty.getName());
            if (faculty.getDepartment() != null) existing.setDepartment(faculty.getDepartment());
            if (faculty.getSpecialization() != null) existing.setSpecialization(faculty.getSpecialization());
            if (faculty.getRankTitle() != null) existing.setRankTitle(faculty.getRankTitle());
            if (faculty.getDesignation() != null) existing.setDesignation(faculty.getDesignation());
            if (faculty.getQualification() != null) existing.setQualification(faculty.getQualification());
            if (faculty.getTeachingExperience() != null) existing.setTeachingExperience(faculty.getTeachingExperience());
            if (faculty.getIndustrialExperience() != null) existing.setIndustrialExperience(faculty.getIndustrialExperience());
            if (faculty.getAvatar() != null) existing.setAvatar(faculty.getAvatar());
            if (faculty.getStatus() != null) existing.setStatus(faculty.getStatus());
            if (faculty.getEmail() != null) existing.setEmail(faculty.getEmail().trim().toLowerCase());
            if (faculty.getOfficeHours() != null) existing.setOfficeHours(faculty.getOfficeHours());
            if (faculty.getPublicationsCount() != null) existing.setPublicationsCount(faculty.getPublicationsCount());
            return facultyRepository.save(existing);
        });
    }

    public Optional<Faculty> updateFacultyStatus(Long id, String status) {
        return facultyRepository.findById(id).map(faculty -> {
            faculty.setStatus(status.toUpperCase());
            return facultyRepository.save(faculty);
        });
    }

    public boolean deleteFaculty(Long id) {
        if (!facultyRepository.existsById(id)) return false;
        facultyRepository.deleteById(id);
        return true;
    }

    // --- Faculty Batch Assignment & Monitoring ---
    public List<Batch> getAssignedBatches(Long facultyId) {
        List<FacultyBatchAssignment> assignments = facultyBatchAssignmentRepository.findByFacultyIdAndStatus(facultyId, "ACTIVE");
        List<Batch> batches = new ArrayList<>();
        for (FacultyBatchAssignment assignment : assignments) {
            batchRepository.findById(assignment.getBatchId()).ifPresent(batches::add);
        }
        return batches;
    }

    public FacultyBatchAssignment assignBatchToFaculty(Long facultyId, Long batchId) {
        Optional<FacultyBatchAssignment> existing = facultyBatchAssignmentRepository.findByFacultyIdAndBatchId(facultyId, batchId);
        if (existing.isPresent()) {
            FacultyBatchAssignment assign = existing.get();
            assign.setStatus("ACTIVE");
            return facultyBatchAssignmentRepository.save(assign);
        }
        return facultyBatchAssignmentRepository.save(FacultyBatchAssignment.builder()
                .facultyId(facultyId)
                .batchId(batchId)
                .status("ACTIVE")
                .build());
    }

    public boolean removeBatchAssignment(Long facultyId, Long batchId) {
        Optional<FacultyBatchAssignment> existing = facultyBatchAssignmentRepository.findByFacultyIdAndBatchId(facultyId, batchId);
        if (existing.isPresent()) {
            facultyBatchAssignmentRepository.delete(existing.get());
            return true;
        }
        return false;
    }

    public List<Student> getStudentsInBatch(Long batchId) {
        List<StudentEnrollment> enrollments = studentEnrollmentRepository.findByBatchIdAndIsCurrentTrue(batchId);
        List<Student> students = new java.util.ArrayList<>();
        java.util.Set<String> seenPrns = new java.util.HashSet<>();
        for (StudentEnrollment enrollment : enrollments) {
            studentRepository.findByPrn(enrollment.getPrn()).ifPresent(s -> {
                students.add(s);
                if (s.getPrn() != null) seenPrns.add(s.getPrn());
            });
        }
        if (students.isEmpty()) {
            batchRepository.findById(batchId).ifPresent(batch -> {
                for (Student s : studentRepository.findAll()) {
                    if (s.getBatchGroup() != null && s.getBatchGroup().equalsIgnoreCase(batch.getName())) {
                        if (s.getPrn() == null || !seenPrns.contains(s.getPrn())) {
                            students.add(s);
                            if (s.getPrn() != null) seenPrns.add(s.getPrn());
                        }
                    }
                }
            });
        }
        return students;
    }
}
