package com.sit.portal.service;

import com.sit.portal.entity.SystemSetting;
import com.sit.portal.repository.SystemSettingRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class SettingServiceTest {

    @Mock
    private SystemSettingRepository systemSettingRepository;

    @InjectMocks
    private SettingService settingService;

    private SystemSetting defaultSetting;

    @BeforeEach
    void setUp() {
        defaultSetting = SystemSetting.builder()
                .id(1L)
                .activeDepartment("Computer Science & Engineering")
                .academicYear("2025-2026")
                .scraperInterval("30")
                .retentionDays("20")
                .pushOnScrape(true)
                .soundAlerts(true)
                .emailAlerts(true)
                .build();
    }

    @Test
    void testGetSystemSettingsWhenExists() {
        when(systemSettingRepository.findFirstByOrderByIdAsc()).thenReturn(Optional.of(defaultSetting));

        SystemSetting result = settingService.getSystemSettings();
        assertNotNull(result);
        assertEquals("Computer Science & Engineering", result.getActiveDepartment());
        assertEquals("2025-2026", result.getAcademicYear());
    }

    @Test
    void testUpdateSystemSettings() {
        when(systemSettingRepository.findFirstByOrderByIdAsc()).thenReturn(Optional.of(defaultSetting));
        when(systemSettingRepository.save(any(SystemSetting.class))).thenAnswer(invocation -> invocation.getArgument(0));

        SystemSetting updates = SystemSetting.builder()
                .academicYear("2026-2027")
                .retentionDays("30")
                .build();

        SystemSetting result = settingService.updateSystemSettings(updates);
        assertNotNull(result);
        assertEquals("2026-2027", result.getAcademicYear());
        assertEquals("30", result.getRetentionDays());
        verify(systemSettingRepository, times(1)).save(any(SystemSetting.class));
    }
}
