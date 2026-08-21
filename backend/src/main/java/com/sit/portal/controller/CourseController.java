package com.sit.portal.controller;

import com.sit.portal.entity.Course;
import com.sit.portal.repository.CourseRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/courses")
@RequiredArgsConstructor
public class CourseController {

    private final CourseRepository courseRepository;

    @GetMapping
    public ResponseEntity<List<Course>> getAllCourses() {
        return ResponseEntity.ok(courseRepository.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Course> getCourseById(@PathVariable Long id) {
        return courseRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<Course> createCourse(@RequestBody Course course) {
        Course savedCourse = courseRepository.save(course);
        return ResponseEntity.status(201).body(savedCourse);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Course> updateCourse(@PathVariable Long id, @RequestBody Course course) {
        return courseRepository.findById(id).map(existing -> {
            if (course.getCode() != null) existing.setCode(course.getCode());
            if (course.getTitle() != null) existing.setTitle(course.getTitle());
            if (course.getSemester() != null) existing.setSemester(course.getSemester());
            if (course.getCredits() != null) existing.setCredits(course.getCredits());
            if (course.getType() != null) existing.setType(course.getType());
            if (course.getInstructor() != null) existing.setInstructor(course.getInstructor());
            if (course.getDescription() != null) existing.setDescription(course.getDescription());
            return ResponseEntity.ok(courseRepository.save(existing));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteCourse(@PathVariable Long id) {
        if (!courseRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        courseRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping
    public ResponseEntity<Void> deleteAllCourses() {
        courseRepository.deleteAll();
        return ResponseEntity.noContent().build();
    }
}
