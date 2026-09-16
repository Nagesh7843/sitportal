package com.sit.portal.repository;

import com.sit.portal.entity.PlacementEligibilityResult;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface PlacementEligibilityResultRepository extends JpaRepository<PlacementEligibilityResult, Long> {
    List<PlacementEligibilityResult> findByPlacementDriveIdAndIsEligibleTrue(Long placementDriveId);
    List<PlacementEligibilityResult> findByPlacementDriveId(Long placementDriveId);
    Optional<PlacementEligibilityResult> findByPlacementDriveIdAndStudentId(Long placementDriveId, Long studentId);
    List<PlacementEligibilityResult> findByPrn(String prn);
    void deleteByPlacementDriveId(Long placementDriveId);
}
