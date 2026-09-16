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
    java.util.Optional<Student> findByEmail(String email);
    java.util.Optional<Student> findByRollNo(String rollNo);
    java.util.Optional<Student> findByPrn(String prn);
    List<Student> findByParentEmail(String parentEmail);
    List<Student> findAllByParentEmail(String parentEmail);
    java.util.Optional<Student> findByRollNoOrPrn(String rollNo, String prn);
    List<Student> findByDepartment(String department);
    List<Student> findByDepartmentIgnoreCase(String department);
    long countByDepartment(String department);
    List<Student> findByDepartmentAndAcademicYear(String department, String academicYear);
    List<Student> findByDepartmentAndAcademicYearAndDivision(String department, String academicYear, String division);
    List<Student> findByDepartmentAndDivisionAndBatchGroup(String department, String division, String batchGroup);


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
