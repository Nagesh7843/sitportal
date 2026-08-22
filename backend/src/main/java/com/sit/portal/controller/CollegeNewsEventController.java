package com.sit.portal.controller;

import com.sit.portal.dto.CollegeNewsEventDto;
import com.sit.portal.service.CollegeNewsEventService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/news-events")
public class CollegeNewsEventController {

    @Autowired
    private CollegeNewsEventService newsEventService;

    @GetMapping
    public ResponseEntity<List<CollegeNewsEventDto>> getAllNewsAndEvents() {
        return ResponseEntity.ok(newsEventService.fetchNewsAndEvents());
    }

    @PostMapping
    public ResponseEntity<CollegeNewsEventDto> createEvent(@RequestBody CollegeNewsEventDto dto) {
        return ResponseEntity.status(201).body(newsEventService.createManualEvent(dto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<java.util.Map<String, Object>> deleteEvent(@PathVariable Long id) {
        newsEventService.deleteEvent(id);
        return ResponseEntity.ok(java.util.Map.of("message", "Event deleted successfully", "id", id));
    }

    @PostMapping("/check-now")
    public ResponseEntity<java.util.Map<String, Object>> triggerNewsCheck() {
        return ResponseEntity.ok(newsEventService.checkAndNotifyNewEvents());
    }
}
