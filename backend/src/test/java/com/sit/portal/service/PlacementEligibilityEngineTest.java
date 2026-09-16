package com.sit.portal.service;

import com.sit.portal.entity.PlacementEligibilityResult;
import com.sit.portal.entity.PlacementEligibilityRule;
import com.sit.portal.entity.Student;
import com.sit.portal.entity.StudentAcademicData;
import com.sit.portal.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class PlacementEligibilityEngineTest {

    @Mock
    private PlacementEligibilityRuleRepository ruleRepository;

    @Mock
    private PlacementEligibilityResultRepository resultRepository;

    @Mock
    private StudentRepository studentRepository;

    @Mock
    private StudentAcademicDataRepository academicDataRepository;

    @Mock
    private ParentStudentRelationshipRepository parentStudentRelationshipRepository;

    @Mock
    private ParentRepository parentRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private EmailService emailService;

    @Mock
    private AuditService auditService;

    @InjectMocks
    private PlacementEligibilityEngine eligibilityEngine;

    private PlacementEligibilityRule sampleRule;

    @BeforeEach
    void setUp() {
        sampleRule = PlacementEligibilityRule.builder()
                .placementDriveId(101L)
                .minimumCgpa(new BigDecimal("7.00"))
                .minimumTenthPercentage(new BigDecimal("60.00"))
                .minimumTwelfthPercentage(new BigDecimal("60.00"))
                .minimumDiplomaPercentage(new BigDecimal("60.00"))
                .allowedDepartments("CSE,AIDS")
                .build();
    }

    @Test
    void testEligibleStudentWith12thPath() {
        when(ruleRepository.findByPlacementDriveId(101L)).thenReturn(Optional.of(sampleRule));

        Student student = Student.builder()
                .id(1L)
                .name("Alex Kumar")
                .prn("PRN101")
                .department("CSE")
                .gpa(8.5)
                .build();
        when(studentRepository.findAll()).thenReturn(List.of(student));

        StudentAcademicData academicData = StudentAcademicData.builder()
                .studentId(1L)
                .prn("PRN101")
                .cgpa(new BigDecimal("8.50"))
                .tenthPercentage(new BigDecimal("85.00"))
                .twelfthPercentage(new BigDecimal("80.00"))
                .diplomaPercentage(BigDecimal.ZERO)
                .qualificationPath("12TH")
                .build();
        when(academicDataRepository.findByPrn("PRN101")).thenReturn(Optional.of(academicData));
        when(resultRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

        List<PlacementEligibilityResult> results = eligibilityEngine.evaluateDriveEligibility(101L, 1L);

        assertEquals(1, results.size());
        assertTrue(results.get(0).getIsEligible());
        assertTrue(results.get(0).getEvaluationReason().contains("Eligible"));
    }

    @Test
    void testEligibleStudentWithDiplomaPath() {
        when(ruleRepository.findByPlacementDriveId(101L)).thenReturn(Optional.of(sampleRule));

        Student student = Student.builder()
                .id(2L)
                .name("Sneha Patil")
                .prn("PRN102")
                .department("CSE")
                .gpa(7.5)
                .build();
        when(studentRepository.findAll()).thenReturn(List.of(student));

        StudentAcademicData academicData = StudentAcademicData.builder()
                .studentId(2L)
                .prn("PRN102")
                .cgpa(new BigDecimal("7.50"))
                .tenthPercentage(new BigDecimal("75.00"))
                .twelfthPercentage(BigDecimal.ZERO)
                .diplomaPercentage(new BigDecimal("72.00"))
                .qualificationPath("DIPLOMA")
                .build();
        when(academicDataRepository.findByPrn("PRN102")).thenReturn(Optional.of(academicData));
        when(resultRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

        List<PlacementEligibilityResult> results = eligibilityEngine.evaluateDriveEligibility(101L, 1L);

        assertEquals(1, results.size());
        assertTrue(results.get(0).getIsEligible());
    }

    @Test
    void testIneligibleStudentBelowCgpaCutoff() {
        when(ruleRepository.findByPlacementDriveId(101L)).thenReturn(Optional.of(sampleRule));

        Student student = Student.builder()
                .id(3L)
                .name("Rohan Sharma")
                .prn("PRN103")
                .department("CSE")
                .gpa(6.2)
                .build();
        when(studentRepository.findAll()).thenReturn(List.of(student));

        StudentAcademicData academicData = StudentAcademicData.builder()
                .studentId(3L)
                .prn("PRN103")
                .cgpa(new BigDecimal("6.20"))
                .tenthPercentage(new BigDecimal("75.00"))
                .twelfthPercentage(new BigDecimal("65.00"))
                .qualificationPath("12TH")
                .build();
        when(academicDataRepository.findByPrn("PRN103")).thenReturn(Optional.of(academicData));
        when(resultRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

        List<PlacementEligibilityResult> results = eligibilityEngine.evaluateDriveEligibility(101L, 1L);

        assertEquals(1, results.size());
        assertFalse(results.get(0).getIsEligible());
        assertTrue(results.get(0).getEvaluationReason().contains("CGPA"));
    }
}
