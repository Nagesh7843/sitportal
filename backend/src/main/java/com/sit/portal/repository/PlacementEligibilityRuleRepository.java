package com.sit.portal.repository;

import com.sit.portal.entity.PlacementEligibilityRule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface PlacementEligibilityRuleRepository extends JpaRepository<PlacementEligibilityRule, Long> {
    Optional<PlacementEligibilityRule> findByPlacementDriveId(Long placementDriveId);
}
