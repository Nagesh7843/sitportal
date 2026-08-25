package com.sit.portal.service;

import com.sit.portal.entity.*;
import com.sit.portal.repository.*;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class PlacementServiceTest {

    @Mock
    private PlacementStatRepository statRepository;

    @Mock
    private PlacementRecruiterRepository recruiterRepository;

    @Mock
    private PlacementDriveRepository driveRepository;

    @Mock
    private PlacedStudentAchievementRepository achieverRepository;

    @Mock
    private PushNotificationService pushNotificationService;

    @Mock
    private ActivityLogRepository activityLogRepository;

    @InjectMocks
    private PlacementService placementService;

    @Test
    void testGetPlacementSummary() {
        when(statRepository.findAll()).thenReturn(List.of(PlacementStat.builder().batchYear("2025-2026").highestPackage("₹24 LPA").build()));
        when(recruiterRepository.findAllByOrderByIdAsc()).thenReturn(List.of(PlacementRecruiter.builder().name("Google").build()));
        when(driveRepository.findAllByOrderByIdDesc()).thenReturn(List.of(PlacementDrive.builder().companyName("Amazon").build()));
        when(achieverRepository.findAllByOrderByIdDesc()).thenReturn(List.of(PlacedStudentAchievement.builder().studentName("Student A").build()));

        Map<String, Object> summary = placementService.getPlacementSummary();
        assertNotNull(summary);
        assertNotNull(summary.get("stats"));
        assertEquals(1, ((List<?>) summary.get("recruiters")).size());
        assertEquals(1, ((List<?>) summary.get("drives")).size());
        assertEquals(1, ((List<?>) summary.get("achievers")).size());
    }

    @Test
    void testAddDriveTriggersNotificationAndActivityLog() {
        PlacementDrive drive = PlacementDrive.builder()
                .companyName("Microsoft")
                .role("Cloud Solutions Engineer")
                .packageLpa("₹18 LPA")
                .build();

        when(driveRepository.save(any(PlacementDrive.class))).thenAnswer(i -> i.getArgument(0));

        PlacementDrive saved = placementService.addDrive(drive);
        assertNotNull(saved);
        assertEquals("Microsoft", saved.getCompanyName());
        assertEquals("UPCOMING", saved.getStatus());

        verify(pushNotificationService, times(1)).sendPushNotificationToAll(anyString(), anyString());
        verify(activityLogRepository, times(1)).save(any(ActivityLog.class));
    }
}
