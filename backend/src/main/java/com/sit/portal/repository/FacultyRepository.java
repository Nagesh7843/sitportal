package com.sit.portal.repository;

import com.sit.portal.entity.Faculty;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.List;

@Repository
public interface FacultyRepository extends JpaRepository<Faculty, Long> {
    Optional<Faculty> findByEmail(String email);

    @org.springframework.data.jpa.repository.Query("SELECT f.email FROM Faculty f WHERE :hasIds = false OR f.id IN :ids")
    List<String> findEmailsByIds(@org.springframework.data.repository.query.Param("hasIds") boolean hasIds, @org.springframework.data.repository.query.Param("ids") List<Long> ids);
}
