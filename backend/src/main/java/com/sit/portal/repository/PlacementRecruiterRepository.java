package com.sit.portal.repository;

import com.sit.portal.entity.PlacementRecruiter;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PlacementRecruiterRepository extends JpaRepository<PlacementRecruiter, Long> {
    List<PlacementRecruiter> findAllByOrderByIdAsc();
}
