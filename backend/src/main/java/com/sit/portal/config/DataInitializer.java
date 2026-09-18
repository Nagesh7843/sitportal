package com.sit.portal.config;

import com.sit.portal.entity.*;
import com.sit.portal.repository.*;
import org.springframework.security.crypto.password.PasswordEncoder;
import com.sit.portal.service.SettingService;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;
import java.util.Map;

@Configuration
public class DataInitializer {

    @Bean
    public CommandLineRunner initDatabase(
            UserRepository userRepository,
            CourseRepository courseRepository,
            LaboratoryRepository laboratoryRepository,
            ResearchLabRepository researchLabRepository,
            DepartmentRepository departmentRepository,
            ProgramRepository programRepository,
            AcademicYearRepository academicYearRepository,
            DivisionRepository divisionRepository,
            BatchRepository batchRepository,
            FacultyRepository facultyRepository,
            StudentRepository studentRepository,
            FacultyBatchAssignmentRepository facultyBatchAssignmentRepository,
            ParentRepository parentRepository,
            StudentAcademicDataRepository studentAcademicDataRepository,
            PlacementDriveRepository placementDriveRepository,
            PlacementEligibilityRuleRepository placementEligibilityRuleRepository,
            PasswordEncoder passwordEncoder,
            SettingService settingService) {
        return args -> {
            // Ensure system settings are initialized in PostgreSQL
            settingService.getSystemSettings();

            // Seed 8 Departments
            if (departmentRepository.count() == 0) {
                departmentRepository.saveAll(List.of(
                        Department.builder().code("CSE").name("Computer Science & Engineering").status("ACTIVE").build(),
                        Department.builder().code("AIDS").name("Artificial Intelligence & Data Science").status("ACTIVE").build(),
                        Department.builder().code("MECH").name("Mechanical Engineering").status("ACTIVE").build(),
                        Department.builder().code("CIVIL").name("Civil Engineering").status("ACTIVE").build(),
                        Department.builder().code("ENTC").name("Electronics & Telecommunication Engineering").status("ACTIVE").build(),
                        Department.builder().code("ELECTRICAL").name("Electrical Engineering").status("ACTIVE").build(),
                        Department.builder().code("MECHATRONICS").name("Mechatronics Engineering").status("ACTIVE").build(),
                        Department.builder().code("BASIC_SCIENCES").name("Basic Sciences & Humanities").status("ACTIVE").build()
                ));
            }

            // Seed Academic Years
            if (academicYearRepository.count() == 0) {
                academicYearRepository.saveAll(List.of(
                        AcademicYear.builder().yearName("2024-2025").isCurrent(false).build(),
                        AcademicYear.builder().yearName("2025-2026").isCurrent(true).build(),
                        AcademicYear.builder().yearName("2026-2027").isCurrent(false).build()
                ));
            }

            // Seed Programs
            if (programRepository.count() == 0) {
                Department cse = departmentRepository.findByCode("CSE").orElse(null);
                Long cseId = cse != null ? cse.getId() : 1L;
                programRepository.saveAll(List.of(
                        Program.builder().departmentId(cseId).code("BTECH_CSE").name("B.Tech in Computer Science & Engineering").degree("B.Tech").build(),
                        Program.builder().departmentId(cseId).code("BTECH_AIDS").name("B.Tech in Artificial Intelligence & Data Science").degree("B.Tech").build()
                ));
            }

            // Seed Divisions
            if (divisionRepository.count() == 0) {
                Department cse = departmentRepository.findByCode("CSE").orElse(null);
                AcademicYear currYear = academicYearRepository.findByIsCurrentTrue().orElse(null);
                Long cseId = cse != null ? cse.getId() : 1L;
                Long yearId = currYear != null ? currYear.getId() : 1L;

                Division divA = divisionRepository.save(Division.builder().departmentId(cseId).academicYearId(yearId).yearLevel("SE").name("Div A").build());
                Division divB = divisionRepository.save(Division.builder().departmentId(cseId).academicYearId(yearId).yearLevel("SE").name("Div B").build());
                divisionRepository.save(Division.builder().departmentId(cseId).academicYearId(yearId).yearLevel("TE").name("Div A").build());
                divisionRepository.save(Division.builder().departmentId(cseId).academicYearId(yearId).yearLevel("BE").name("Div A").build());

                // Seed Batches
                batchRepository.saveAll(List.of(
                        Batch.builder().divisionId(divA.getId()).name("Batch A1").build(),
                        Batch.builder().divisionId(divA.getId()).name("Batch A2").build(),
                        Batch.builder().divisionId(divA.getId()).name("Batch A3").build(),
                        Batch.builder().divisionId(divB.getId()).name("Batch B1").build(),
                        Batch.builder().divisionId(divB.getId()).name("Batch B2").build()
                ));
            }

            // Seed Super Admin in PostgreSQL sitportaldb if not present
            if (!userRepository.existsByEmail("admin@sitcoe.ac.in")) {
                userRepository.save(User.builder()
                        .name("Institute Administrator")
                        .email("admin@sitcoe.ac.in")
                        .password(passwordEncoder.encode("admin123"))
                        .role("admin")
                        .roleTitle("Institute Administrator & Portal Controller")
                        .department("Sharad Institute of Technology")
                        .build());
            }

            // Seed HOD if not present
            if (!userRepository.existsByEmail("hod.cse@sitcoe.ac.in")) {
                userRepository.save(User.builder()
                        .name("Dr. A. S. Poornima")
                        .email("hod.cse@sitcoe.ac.in")
                        .password(passwordEncoder.encode("hod123"))
                        .role("hod")
                        .roleTitle("Professor & Head of Department")
                        .department("Computer Science & Engineering")
                        .build());
            }

            // Seed Faculty if not present
            if (!userRepository.existsByEmail("faculty@sitcoe.ac.in")) {
                userRepository.save(User.builder()
                        .name("Prof. Veena K")
                        .email("faculty@sitcoe.ac.in")
                        .password(passwordEncoder.encode("faculty123"))
                        .role("faculty")
                        .roleTitle("Assistant Professor")
                        .department("Computer Science & Engineering")
                        .build());
            }

            // Seed Student if not present
            if (!userRepository.existsByEmail("student@sitcoe.ac.in")) {
                userRepository.save(User.builder()
                        .name("Rahul Sharma")
                        .email("student@sitcoe.ac.in")
                        .password(passwordEncoder.encode("student123"))
                        .role("student")
                        .roleTitle("B.Tech CSE Student")
                        .department("Computer Science & Engineering")
                        .build());
            }

            // Seed Parent if not present
            if (!userRepository.existsByEmail("parent@sitcoe.ac.in")) {
                userRepository.save(User.builder()
                        .name("Suresh Sharma")
                        .email("parent@sitcoe.ac.in")
                        .password(passwordEncoder.encode("parent123"))
                        .role("parent")
                        .roleTitle("Parent / Guardian")
                        .department("Parent Portal")
                        .build());
            }

            // Migrate any plain text passwords in users table to BCrypt hashes and guarantee demo credentials
            Map<String, String> demoPasswords = Map.of(
                    "admin@sitcoe.ac.in", "admin123",
                    "hod.cse@sitcoe.ac.in", "hod123",
                    "faculty@sitcoe.ac.in", "faculty123",
                    "student@sitcoe.ac.in", "student123",
                    "parent@sitcoe.ac.in", "parent123"
            );
            demoPasswords.forEach((mail, pass) -> {
                userRepository.findByEmail(mail).ifPresent(u -> {
                    u.setPassword(passwordEncoder.encode(pass));
                    userRepository.save(u);
                });
            });

            userRepository.findAll().forEach(u -> {
                if (u.getPassword() != null && !u.getPassword().startsWith("$2a$") && !u.getPassword().startsWith("$2b$")) {
                    u.setPassword(passwordEncoder.encode(u.getPassword()));
                    userRepository.save(u);
                }
            });

            // Seed Laboratories
            if (laboratoryRepository.count() == 0) {
                laboratoryRepository.saveAll(List.of(
                        Laboratory.builder().roomNumber("51").name("Database Lab").computers("25 Dell PCs").processor("Intel Core i5").ram("8 GB").storage("500 GB NVMe").additionalEquipment("Printer").totalCost("₹15,90,239").build(),
                        Laboratory.builder().roomNumber("54").name("Operating System Lab").computers("25 Dell PCs").processor("Intel Core i5").ram("8 GB").storage("500 GB NVMe").additionalEquipment("Printer").totalCost("₹16,01,755").build(),
                        Laboratory.builder().roomNumber("56").name("Computer Network Lab").computers("25 HP PCs").processor("Intel Core i7").ram("16 GB").storage("500 GB NVMe").additionalEquipment("Printer").totalCost("₹14,80,315").build(),
                        Laboratory.builder().roomNumber("58").name("Programming Lab (I)").computers("25 HP PCs").processor("Intel Core i7").ram("16 GB").storage("500 GB NVMe").additionalEquipment("Printer").totalCost("₹20,75,035").build(),
                        Laboratory.builder().roomNumber("59").name("Project Lab (I)").computers("25 HP PCs").processor("Intel Core i7").ram("16 GB").storage("500 GB NVMe").additionalEquipment("Printer").totalCost("₹20,75,035").build(),
                        Laboratory.builder().roomNumber("39 A").name("Programming Lab (II)").computers("30 Dell PCs").processor("Intel Core i5").ram("8 GB").storage("500 GB NVMe").additionalEquipment("Printer").totalCost("₹20,56,511").build(),
                        Laboratory.builder().roomNumber("34A").name("Software Engineering Lab").computers("30 HP PCs").processor("Intel Core i7").ram("16 GB").storage("500 GB NVMe").additionalEquipment("Printer").totalCost("₹22,74,163").build(),
                        Laboratory.builder().roomNumber("68").name("Microprocessor Lab").computers("25 Dell PCs").processor("Intel Core i5").ram("8 GB").storage("500 GB NVMe").additionalEquipment("Printer").totalCost("₹15,15,120").build()
                ));
            }

            // Seed Faculty Member Profile if not present
            if (facultyRepository.count() == 0) {
                Faculty fac = facultyRepository.save(Faculty.builder()
                        .name("Prof. Veena K")
                        .email("faculty@sitcoe.ac.in")
                        .department("Computer Science & Engineering")
                        .designation("Assistant Professor")
                        .rankTitle("Senior Assistant Professor")
                        .specialization("Cloud Computing & Distributed Systems")
                        .status("ON CAMPUS")
                        .officeHours("Mon-Fri 2:00 PM - 4:00 PM")
                        .build());

                // Assign to Batch A1 (id: 1)
                batchRepository.findAll().stream().findFirst().ifPresent(batch -> {
                    facultyBatchAssignmentRepository.save(FacultyBatchAssignment.builder()
                            .facultyId(fac.getId())
                            .batchId(batch.getId())
                            .status("ACTIVE")
                            .build());
                });
            }

            // Seed Student Record with Batch A1 if not present
            if (studentRepository.count() == 0) {
                Student s1 = studentRepository.save(Student.builder()
                        .name("Rahul Sharma")
                        .email("student@sitcoe.ac.in")
                        .rollNo("2023CSE014")
                        .prn("2023CSE014")
                        .academicYear("SE")
                        .division("Div A")
                        .batchGroup("Batch A1")
                        .cohortBatch("2023-2027")
                        .attendance(92.5)
                        .gpa(8.5)
                        .parentName("Suresh Sharma")
                        .parentEmail("parent@sitcoe.ac.in")
                        .parentPhone("+91 9876543210")
                        .parentRelationship("Father")
                        .status("ACTIVE")
                        .department("CSE")
                        .build());

                Student s2 = studentRepository.save(Student.builder()
                        .name("Priya Patel")
                        .email("priya.patel@sitcoe.ac.in")
                        .rollNo("2023CSE015")
                        .prn("2023CSE015")
                        .academicYear("SE")
                        .division("Div A")
                        .batchGroup("Batch A1")
                        .cohortBatch("2023-2027")
                        .attendance(88.0)
                        .gpa(8.2)
                        .parentName("Ramesh Patel")
                        .parentEmail("ramesh.patel@gmail.com")
                        .parentPhone("+91 9876543211")
                        .parentRelationship("Father")
                        .status("ACTIVE")
                        .department("CSE")
                        .build());

                Student s3 = studentRepository.save(Student.builder()
                        .name("Amit Patil (DSE)")
                        .email("amit.patil@sitcoe.ac.in")
                        .rollNo("2023CSE016")
                        .prn("2023CSE016")
                        .academicYear("TE")
                        .division("Div A")
                        .batchGroup("Batch A2")
                        .cohortBatch("2023-2027")
                        .attendance(86.5)
                        .gpa(7.8)
                        .parentName("Vilas Patil")
                        .parentEmail("vilas.patil@gmail.com")
                        .parentPhone("+91 9876543212")
                        .parentRelationship("Father")
                        .status("ACTIVE")
                        .department("CSE")
                        .build());

                Student s4 = studentRepository.save(Student.builder()
                        .name("Sneha Deshmukh")
                        .email("sneha.deshmukh@sitcoe.ac.in")
                        .rollNo("2023CSE017")
                        .prn("2023CSE017")
                        .academicYear("BE")
                        .division("Div B")
                        .batchGroup("Batch B1")
                        .cohortBatch("2022-2026")
                        .attendance(94.0)
                        .gpa(9.1)
                        .parentName("Anand Deshmukh")
                        .parentEmail("anand.deshmukh@gmail.com")
                        .parentPhone("+91 9876543213")
                        .parentRelationship("Father")
                        .status("ACTIVE")
                        .department("CSE")
                        .build());

                // Seed Academic Data for students (both 12th Regular and Diploma Lateral Entry)
                if (studentAcademicDataRepository.count() == 0) {
                    studentAcademicDataRepository.saveAll(List.of(
                            StudentAcademicData.builder()
                                    .studentId(s1.getId())
                                    .prn("2023CSE014")
                                    .cgpa(new java.math.BigDecimal("8.50"))
                                    .tenthPercentage(new java.math.BigDecimal("88.50"))
                                    .twelfthPercentage(new java.math.BigDecimal("85.00"))
                                    .diplomaPercentage(java.math.BigDecimal.ZERO)
                                    .qualificationPath("12TH")
                                    .activeBacklogs(0)
                                    .totalBacklogs(0)
                                    .build(),
                            StudentAcademicData.builder()
                                    .studentId(s2.getId())
                                    .prn("2023CSE015")
                                    .cgpa(new java.math.BigDecimal("8.20"))
                                    .tenthPercentage(new java.math.BigDecimal("84.00"))
                                    .twelfthPercentage(new java.math.BigDecimal("81.50"))
                                    .diplomaPercentage(java.math.BigDecimal.ZERO)
                                    .qualificationPath("12TH")
                                    .activeBacklogs(0)
                                    .totalBacklogs(0)
                                    .build(),
                            StudentAcademicData.builder()
                                    .studentId(s3.getId())
                                    .prn("2023CSE016")
                                    .cgpa(new java.math.BigDecimal("7.80"))
                                    .tenthPercentage(new java.math.BigDecimal("82.00"))
                                    .twelfthPercentage(java.math.BigDecimal.ZERO)
                                    .diplomaPercentage(new java.math.BigDecimal("80.50"))
                                    .qualificationPath("DIPLOMA")
                                    .activeBacklogs(0)
                                    .totalBacklogs(0)
                                    .build(),
                            StudentAcademicData.builder()
                                    .studentId(s4.getId())
                                    .prn("2023CSE017")
                                    .cgpa(new java.math.BigDecimal("9.10"))
                                    .tenthPercentage(new java.math.BigDecimal("92.00"))
                                    .twelfthPercentage(new java.math.BigDecimal("89.50"))
                                    .diplomaPercentage(java.math.BigDecimal.ZERO)
                                    .qualificationPath("12TH")
                                    .activeBacklogs(0)
                                    .totalBacklogs(0)
                                    .build()
                    ));
                }
            }

            // Seed Parent Record linked to Student
            try {
                if (parentRepository.count() == 0 || parentRepository.findByStudentRollNo("2023CSE014").isEmpty()) {
                    User parentUser = userRepository.findByEmail("parent@sitcoe.ac.in").orElse(null);
                    Long parentUserId = parentUser != null ? parentUser.getId() : 5L;

                    parentRepository.save(Parent.builder()
                            .userId(parentUserId)
                            .parentName("Suresh Sharma")
                            .email("parent@sitcoe.ac.in")
                            .phone("+91 9876543210")
                            .studentRollNo("2023CSE014")
                            .studentName("Rahul Sharma")
                            .relationship("Father")
                            .alternatePhone("+91 9876543210")
                            .occupation("Business")
                            .build());
                }
            } catch (Exception ex) {
                System.err.println("WARN: Could not seed default parent record: " + ex.getMessage());
            }

            // Seed Sample Placement Drives & Rules
            if (placementDriveRepository.count() == 0) {
                PlacementDrive drive1 = placementDriveRepository.save(PlacementDrive.builder()
                        .companyName("Tata Consultancy Services (TCS)")
                        .role("Digital Software Engineer")
                        .packageLpa("₹7.50 LPA")
                        .driveDate("2026-09-15")
                        .eligibility("Min 6.5 CGPA, Min 60% in 10th, Min 60% in 12th or Min 65% in Diploma")
                        .location("SITCOE Campus & Hybrid")
                        .applyDeadline("2026-09-10")
                        .status("UPCOMING")
                        .logoUrl("https://logo.clearbit.com/tcs.com")
                        .description("TCS Digital Hiring Drive for 2026 Batch across Computer Science, AI&DS, and allied engineering streams.")
                        .build());

                PlacementDrive drive2 = placementDriveRepository.save(PlacementDrive.builder()
                        .companyName("Cognizant Technology Solutions")
                        .role("GenC Next Developer")
                        .packageLpa("₹6.75 LPA")
                        .driveDate("2026-09-22")
                        .eligibility("Min 6.0 CGPA, Min 60% in 10th, Min 60% in 12th/Diploma")
                        .location("SIT Central Auditorium")
                        .applyDeadline("2026-09-18")
                        .status("UPCOMING")
                        .logoUrl("https://logo.clearbit.com/cognizant.com")
                        .description("Cognizant campus recruitment drive for software engineering and cloud infrastructure roles.")
                        .build());

                if (placementEligibilityRuleRepository.count() == 0) {
                    placementEligibilityRuleRepository.saveAll(List.of(
                            PlacementEligibilityRule.builder()
                                    .placementDriveId(drive1.getId())
                                    .minimumCgpa(new java.math.BigDecimal("6.50"))
                                    .minimumTenthPercentage(new java.math.BigDecimal("60.00"))
                                    .minimumTwelfthPercentage(new java.math.BigDecimal("60.00"))
                                    .minimumDiplomaPercentage(new java.math.BigDecimal("65.00"))
                                    .allowedDepartments("CSE,AIDS,MECH,CIVIL,ENTC,ELECTRICAL,MECHATRONICS")
                                    .build(),
                            PlacementEligibilityRule.builder()
                                    .placementDriveId(drive2.getId())
                                    .minimumCgpa(new java.math.BigDecimal("6.00"))
                                    .minimumTenthPercentage(new java.math.BigDecimal("60.00"))
                                    .minimumTwelfthPercentage(new java.math.BigDecimal("60.00"))
                                    .minimumDiplomaPercentage(new java.math.BigDecimal("60.00"))
                                    .allowedDepartments("CSE,AIDS,MECH,CIVIL,ENTC,ELECTRICAL,MECHATRONICS")
                                    .build()
                    ));
                }
            }
        };
    }
}
