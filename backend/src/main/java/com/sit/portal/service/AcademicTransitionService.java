package com.sit.portal.service;

import com.sit.portal.entity.Student;
import com.sit.portal.entity.StudentEnrollment;
import com.sit.portal.repository.StudentEnrollmentRepository;
import com.sit.portal.repository.StudentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class AcademicTransitionService {

    private final StudentRepository studentRepository;
    private final StudentEnrollmentRepository studentEnrollmentRepository;
    private final AuditService auditService;

    @Transactional
    public StudentEnrollment transitionStudentToNextTerm(
            String prn,
            Long newAcademicYearId,
            Long newDepartmentId,
            Long newProgramId,
            String newYearLevel,
            Long newSemesterId,
            Long newDivisionId,
            Long newBatchId,
            Long transitionedByUserId
    ) {
        // Find existing current enrollment and mark as history
        Optional<StudentEnrollment> currentOpt = studentEnrollmentRepository.findByPrnAndIsCurrentTrue(prn);
        currentOpt.ifPresent(curr -> {
            curr.setIsCurrent(false);
            curr.setUpdatedAt(LocalDateTime.now());
            studentEnrollmentRepository.save(curr);
        });

        Optional<Student> studentOpt = studentRepository.findByPrn(prn);
        Long studentId = studentOpt.map(Student::getId).orElse(0L);

        // Create new enrollment record
        StudentEnrollment nextEnrollment = StudentEnrollment.builder()
                .studentId(studentId)
                .prn(prn)
                .academicYearId(newAcademicYearId)
                .departmentId(newDepartmentId)
                .programId(newProgramId)
                .yearLevel(newYearLevel)
                .semesterId(newSemesterId)
                .divisionId(newDivisionId)
                .batchId(newBatchId)
                .isCurrent(true)
                .status("ENROLLED")
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        StudentEnrollment saved = studentEnrollmentRepository.save(nextEnrollment);

        // Update student entity summary fields
        studentOpt.ifPresent(student -> {
            student.setAcademicYear(newYearLevel);
            studentRepository.save(student);
        });

        auditService.logAction(
                transitionedByUserId,
                null,
                "ACADEMIC_SEMESTER_TRANSITION",
                "StudentEnrollment",
                String.valueOf(saved.getId()),
                currentOpt.map(c -> c.getYearLevel() + " (Sem " + c.getSemesterId() + ")").orElse("None"),
                newYearLevel + " (Sem " + newSemesterId + ")",
                "SUCCESS",
                null
        );

        return saved;
    }

    @Transactional
    public List<StudentEnrollment> bulkTransitionCohort(
            List<String> prns,
            Long newAcademicYearId,
            Long newDepartmentId,
            Long newProgramId,
            String newYearLevel,
            Long newSemesterId,
            Long newDivisionId,
            Long newBatchId,
            Long transitionedByUserId
    ) {
        List<StudentEnrollment> results = new ArrayList<>();
        for (String prn : prns) {
            results.add(transitionStudentToNextTerm(
                    prn, newAcademicYearId, newDepartmentId, newProgramId,
                    newYearLevel, newSemesterId, newDivisionId, newBatchId,
                    transitionedByUserId
            ));
        }
        return results;
    }
}
