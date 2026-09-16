package com.sit.portal.service;

import com.sit.portal.entity.Student;
import com.sit.portal.entity.StudentEnrollment;
import com.sit.portal.repository.StudentEnrollmentRepository;
import com.sit.portal.repository.StudentRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class AcademicTransitionServiceTest {

    @Mock
    private StudentRepository studentRepository;

    @Mock
    private StudentEnrollmentRepository studentEnrollmentRepository;

    @Mock
    private AuditService auditService;

    @InjectMocks
    private AcademicTransitionService transitionService;

    @Test
    void testTransitionStudentToNextTermPreservesHistory() {
        StudentEnrollment current = StudentEnrollment.builder()
                .id(1L)
                .prn("PRN101")
                .yearLevel("SE")
                .semesterId(3L)
                .isCurrent(true)
                .build();
        when(studentEnrollmentRepository.findByPrnAndIsCurrentTrue("PRN101")).thenReturn(Optional.of(current));

        Student student = Student.builder()
                .id(10L)
                .prn("PRN101")
                .academicYear("SE")
                .build();
        when(studentRepository.findByPrn("PRN101")).thenReturn(Optional.of(student));
        when(studentEnrollmentRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

        StudentEnrollment next = transitionService.transitionStudentToNextTerm(
                "PRN101", 2L, 1L, 1L, "TE", 5L, 2L, 4L, 999L
        );

        assertNotNull(next);
        assertEquals("TE", next.getYearLevel());
        assertEquals(5L, next.getSemesterId());
        assertTrue(next.getIsCurrent());
        assertFalse(current.getIsCurrent()); // verified previous is marked historical
    }
}
