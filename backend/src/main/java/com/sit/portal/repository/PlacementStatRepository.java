package com.sit.portal.repository;

import com.sit.portal.entity.PlacementStat;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PlacementStatRepository extends JpaRepository<PlacementStat, Long> {
}
