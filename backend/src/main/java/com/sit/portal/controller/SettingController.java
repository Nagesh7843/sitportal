package com.sit.portal.controller;

import com.sit.portal.entity.SystemSetting;
import com.sit.portal.service.SettingService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/settings")
public class SettingController {

    @Autowired
    private SettingService settingService;

    @GetMapping
    public ResponseEntity<SystemSetting> getSettings() {
        return ResponseEntity.ok(settingService.getSystemSettings());
    }

    @PutMapping
    public ResponseEntity<SystemSetting> updateSettings(@RequestBody SystemSetting settings) {
        return ResponseEntity.ok(settingService.updateSystemSettings(settings));
    }
}
