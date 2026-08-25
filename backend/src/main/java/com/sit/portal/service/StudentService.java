package com.sit.portal.service;

import com.sit.portal.entity.Parent;
import com.sit.portal.entity.Student;
import com.sit.portal.entity.User;
import com.sit.portal.repository.ParentRepository;
import com.sit.portal.repository.StudentRepository;
import com.sit.portal.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class StudentService {

    @Autowired
    private StudentRepository studentRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ParentRepository parentRepository;

    public List<Student> getAllStudents() {
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

    public Student addStudent(Student student) {
        if (student.getEmail() != null) {
            student.setEmail(student.getEmail().trim().toLowerCase());
        }
        Student saved = studentRepository.save(student);
        syncParentAccount(saved);
        return saved;
    }

    public List<Student> addStudentsBulk(List<Student> students) {
        for (Student s : students) {
            if (s.getEmail() != null) s.setEmail(s.getEmail().trim().toLowerCase());
        }
        List<Student> savedList = studentRepository.saveAll(students);
        for (Student st : savedList) {
            syncParentAccount(st);
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

            Student updated = studentRepository.save(existing);
            syncParentAccount(updated);
            return updated;
        });
    }

    public boolean deleteStudent(Long id) {
        if (!studentRepository.existsById(id)) return false;
        studentRepository.deleteById(id);
        return true;
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
        parentRepository.save(parent);
    }
}
