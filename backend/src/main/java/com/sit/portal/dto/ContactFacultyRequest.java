package com.sit.portal.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ContactFacultyRequest {
    private String facultyId;
    private String facultyName;
    private String facultyEmail;
    private String studentName;
    private String studentEmail;
    private String studentPrn;
    private String academicYear;
    private String division;
    private String inquiryType; // "Office Hours Appointment", "Project Guidance", "Doubt Resolution", "Attendance Query", "General"
    private String subject;
    private String message;
    private String priority; // "URGENT", "NORMAL"
}
