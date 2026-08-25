package com.sit.portal.service;

import com.sit.portal.entity.SystemSetting;
import com.sit.portal.repository.SystemSettingRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class SettingService {

    @Autowired
    private SystemSettingRepository systemSettingRepository;

    public SystemSetting getSystemSettings() {
        return systemSettingRepository.findFirstByOrderByIdAsc()
                .orElseGet(() -> systemSettingRepository.save(SystemSetting.builder()
                        .activeDepartment("Computer Science & Engineering")
                        .academicYear("2025-2026")
                        .scraperInterval("30")
                        .retentionDays("20")
                        .pushOnScrape(true)
                        .soundAlerts(true)
                        .emailAlerts(true)
                        .build()));
    }

    public SystemSetting updateSystemSettings(SystemSetting updates) {
        SystemSetting current = getSystemSettings();
        if (updates.getActiveDepartment() != null) current.setActiveDepartment(updates.getActiveDepartment());
        if (updates.getAcademicYear() != null) current.setAcademicYear(updates.getAcademicYear());
        if (updates.getScraperInterval() != null) current.setScraperInterval(updates.getScraperInterval());
        if (updates.getRetentionDays() != null) current.setRetentionDays(updates.getRetentionDays());
        if (updates.getPushOnScrape() != null) current.setPushOnScrape(updates.getPushOnScrape());
        if (updates.getSoundAlerts() != null) current.setSoundAlerts(updates.getSoundAlerts());
        if (updates.getEmailAlerts() != null) current.setEmailAlerts(updates.getEmailAlerts());
        return systemSettingRepository.save(current);
    }
}
