package com.sit.portal.service;

import com.sit.portal.entity.Faculty;
import com.sit.portal.repository.FacultyRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class FacultyService {

    @Autowired
    private FacultyRepository facultyRepository;

    public List<Faculty> getAllFaculty() {
        return facultyRepository.findAll();
    }

    public Optional<Faculty> getFacultyById(Long id) {
        return facultyRepository.findById(id);
    }

    public Optional<Faculty> getFacultyByEmail(String email) {
        if (email == null) return Optional.empty();
        return facultyRepository.findByEmail(email.trim().toLowerCase());
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
            if (faculty.getSpecialization() != null) existing.setSpecialization(faculty.getSpecialization());
            if (faculty.getRankTitle() != null) existing.setRankTitle(faculty.getRankTitle());
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
}
