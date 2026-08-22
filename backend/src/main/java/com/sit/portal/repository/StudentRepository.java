package com.sit.portal.repository;

import com.sit.portal.entity.Student;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface StudentRepository extends JpaRepository<Student, Long> {
    List<Student> findByAcademicYear(String academicYear);
    List<Student> findByAcademicYearAndDivision(String academicYear, String division);
    boolean existsByEmail(String email);
    java.util.Optional<Student> findByRollNo(String rollNo);

    @org.springframework.data.jpa.repository.Query("SELECT s.email FROM Student s WHERE " +
           "(:hasYears = false OR s.academicYear IN :years) AND " +
           "(:hasDivisions = false OR s.division IN :divisions) AND " +
           "(:hasBatches = false OR s.batchGroup IN :batches)")
    List<String> findEmailsByFilters(@org.springframework.data.repository.query.Param("hasYears") boolean hasYears, 
                                     @org.springframework.data.repository.query.Param("years") List<String> years, 
                                     @org.springframework.data.repository.query.Param("hasDivisions") boolean hasDivisions, 
                                     @org.springframework.data.repository.query.Param("divisions") List<String> divisions, 
                                     @org.springframework.data.repository.query.Param("hasBatches") boolean hasBatches, 
                                     @org.springframework.data.repository.query.Param("batches") List<String> batches);
}
