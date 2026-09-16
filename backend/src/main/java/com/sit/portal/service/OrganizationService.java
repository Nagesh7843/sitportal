package com.sit.portal.service;

import com.sit.portal.entity.*;
import com.sit.portal.repository.*;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
@RequiredArgsConstructor
public class OrganizationService {

    private final DepartmentRepository departmentRepository;
    private final ProgramRepository programRepository;
    private final AcademicYearRepository academicYearRepository;
    private final DivisionRepository divisionRepository;
    private final BatchRepository batchRepository;
    private final StudentRepository studentRepository;

    @PostConstruct
    @Transactional
    public void initMasterHierarchy() {
        // Ensure standard departments exist
        String[][] depts = {
            {"CSE", "Computer Science & Engineering"},
            {"AIDS", "Artificial Intelligence & Data Science"},
            {"MECH", "Mechanical Engineering"},
            {"CIVIL", "Civil Engineering"},
            {"ENTC", "Electronics & Telecommunication Engineering"},
            {"ELECTRICAL", "Electrical Engineering"},
            {"MECHATRONICS", "Mechatronics Engineering"},
            {"BASIC_SCIENCES", "Basic Sciences & Humanities"}
        };

        for (String[] d : depts) {
            String code = d[0];
            String name = d[1];
            Department dept = departmentRepository.findByCode(code).orElseGet(() -> {
                Department newDept = Department.builder()
                        .code(code)
                        .name(name)
                        .status("ACTIVE")
                        .build();
                return departmentRepository.save(newDept);
            });

            // Ensure Degree Program
            String progCode = "BTECH_" + code;
            Optional<Program> existingProg = programRepository.findByCode(progCode);
            if (existingProg.isPresent()) {
                Program p = existingProg.get();
                p.setDepartmentId(dept.getId());
                p.setName("B.Tech in " + name);
                programRepository.save(p);
            } else {
                Program prog = Program.builder()
                        .departmentId(dept.getId())
                        .code(progCode)
                        .name("B.Tech in " + name)
                        .degree("B.Tech")
                        .build();
                programRepository.save(prog);
            }

            // Ensure Divisions (SE, TE, BE each with Div A, Div B, Div C)
            String[] yearLevels = "BASIC_SCIENCES".equalsIgnoreCase(code) 
                ? new String[]{"FE"} 
                : new String[]{"SE", "TE", "BE"};

            String[] divLetters = {"A", "B", "C"};

            for (String yr : yearLevels) {
                for (String letter : divLetters) {
                    String divName = "Div " + letter;
                    Optional<Division> existingDiv = divisionRepository.findByDepartmentId(dept.getId()).stream()
                            .filter(d2 -> yr.equalsIgnoreCase(d2.getYearLevel()) && divName.equalsIgnoreCase(d2.getName()))
                            .findFirst();

                    Division div;
                    if (existingDiv.isPresent()) {
                        div = existingDiv.get();
                    } else {
                        div = Division.builder()
                                .departmentId(dept.getId())
                                .yearLevel(yr)
                                .name(divName)
                                .build();
                        div = divisionRepository.save(div);
                    }

                    // Ensure Batches (Batch A1, Batch A2, Batch A3)
                    List<Batch> existingBatches = batchRepository.findByDivisionId(div.getId());
                    if (existingBatches.isEmpty()) {
                        for (int b = 1; b <= 3; b++) {
                            String batchName = "Batch " + letter + b;
                            Batch batch = Batch.builder()
                                    .divisionId(div.getId())
                                    .name(batchName)
                                    .build();
                            batchRepository.save(batch);
                        }
                    }
                }
            }
        }
    }

    public List<Department> getAllDepartments() {
        return departmentRepository.findAll();
    }

    public Optional<Department> getDepartmentByCode(String code) {
        return departmentRepository.findByCode(code);
    }

    public List<Program> getProgramsByDepartment(Long departmentId) {
        return programRepository.findByDepartmentId(departmentId);
    }

    public List<AcademicYear> getAllAcademicYears() {
        return academicYearRepository.findAll();
    }

    public Optional<AcademicYear> getCurrentAcademicYear() {
        return academicYearRepository.findByIsCurrentTrue();
    }

    public List<Division> getDivisionsByDepartment(Long departmentId, String yearLevel) {
        if (yearLevel != null && !yearLevel.trim().isEmpty()) {
            return divisionRepository.findByDepartmentIdAndYearLevel(departmentId, yearLevel);
        }
        return divisionRepository.findByDepartmentId(departmentId);
    }

    public List<Batch> getBatchesByDivision(Long divisionId) {
        return batchRepository.findByDivisionId(divisionId);
    }

    public Map<String, Object> getHierarchyStats() {
        List<Student> allStudents = studentRepository.findAll();
        List<Department> allDepts = departmentRepository.findAll();

        Map<String, Object> result = new HashMap<>();
        result.put("totalStudents", allStudents.size());

        List<Map<String, Object>> deptStats = new ArrayList<>();
        for (Department d : allDepts) {
            Map<String, Object> dMap = new HashMap<>();
            dMap.put("id", d.getId());
            dMap.put("code", d.getCode());
            dMap.put("name", d.getName());
            dMap.put("status", d.getStatus());

            long deptCount = allStudents.stream().filter(s -> {
                String sDept = (s.getDepartment() != null ? s.getDepartment() : "").toUpperCase();
                return sDept.equals(d.getCode().toUpperCase()) || sDept.contains(d.getCode().toUpperCase()) || sDept.equals(d.getName().toUpperCase());
            }).count();
            dMap.put("studentCount", deptCount);

            deptStats.add(dMap);
        }
        result.put("departments", deptStats);
        return result;
    }

    @Transactional
    public Department saveDepartment(Department department) {
        return departmentRepository.save(department);
    }

    @Transactional
    public Program saveProgram(Program program) {
        return programRepository.save(program);
    }

    @Transactional
    public Division saveDivision(Division division) {
        return divisionRepository.save(division);
    }

    @Transactional
    public Batch saveBatch(Batch batch) {
        return batchRepository.save(batch);
    }
}
