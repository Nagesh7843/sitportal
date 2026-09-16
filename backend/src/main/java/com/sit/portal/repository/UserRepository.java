package com.sit.portal.repository;

import com.sit.portal.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);
    boolean existsByRoleIgnoreCase(String role);
    List<User> findByDepartment(String department);
    List<User> findByDepartmentIgnoreCase(String department);
}

