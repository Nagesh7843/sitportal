package com.sit.portal.controller;

import com.sit.portal.dto.ScrapedNoticeDto;
import com.sit.portal.service.CollegeNoticeScraperService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/scraper/notices")
public class CollegeNoticeScraperController {

    @Autowired
    private CollegeNoticeScraperService scraperService;

    /**
     * Preview scraped notices from official college website without saving to database.
     */
    @GetMapping("/preview")
    public ResponseEntity<List<ScrapedNoticeDto>> previewScrapedNotices() {
        List<ScrapedNoticeDto> notices = scraperService.previewScrapedNotices();
        return ResponseEntity.ok(notices);
    }

    /**
     * Synchronize official notices into the PostgreSQL database.
     */
    @PostMapping("/sync")
    public ResponseEntity<Map<String, Object>> syncCollegeNotices() {
        Map<String, Object> result = scraperService.syncCollegeNoticesToDatabase();
        return ResponseEntity.ok(result);
    }

    /**
     * Get scraper operational status, last synced count, and timestamp.
     */
    @GetMapping("/status")
    public ResponseEntity<Map<String, Object>> getScraperStatus() {
        Map<String, Object> status = scraperService.getScraperStatus();
        return ResponseEntity.ok(status);
    }
}
