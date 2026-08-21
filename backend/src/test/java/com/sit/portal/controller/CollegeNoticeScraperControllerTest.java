package com.sit.portal.controller;

import com.sit.portal.dto.ScrapedNoticeDto;
import com.sit.portal.service.CollegeNoticeScraperService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.ResponseEntity;

import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CollegeNoticeScraperControllerTest {

    @Mock
    private CollegeNoticeScraperService scraperService;

    @InjectMocks
    private CollegeNoticeScraperController controller;

    @Test
    void previewScrapedNoticesReturnsList() {
        ScrapedNoticeDto notice = ScrapedNoticeDto.builder()
                .title("07/09/2026 Examination Postponed")
                .pdfUrl("https://www.sitcoe.ac.in/notice.pdf")
                .category("Exam")
                .build();
        when(scraperService.previewScrapedNotices()).thenReturn(List.of(notice));

        ResponseEntity<List<ScrapedNoticeDto>> response = controller.previewScrapedNotices();

        assertEquals(200, response.getStatusCode().value());
        assertNotNull(response.getBody());
        assertEquals(1, response.getBody().size());
        assertEquals("07/09/2026 Examination Postponed", response.getBody().get(0).getTitle());
        verify(scraperService).previewScrapedNotices();
    }

    @Test
    void syncCollegeNoticesReturnsResultMap() {
        Map<String, Object> syncResult = Map.of(
                "status", "SUCCESS",
                "newlyAdded", 3,
                "alreadyExisted", 2
        );
        when(scraperService.syncCollegeNoticesToDatabase()).thenReturn(syncResult);

        ResponseEntity<Map<String, Object>> response = controller.syncCollegeNotices();

        assertEquals(200, response.getStatusCode().value());
        assertNotNull(response.getBody());
        assertEquals("SUCCESS", response.getBody().get("status"));
        assertEquals(3, response.getBody().get("newlyAdded"));
        verify(scraperService).syncCollegeNoticesToDatabase();
    }

    @Test
    void getScraperStatusReturnsMap() {
        Map<String, Object> statusMap = Map.of(
                "lastSyncStatus", "IDLE",
                "lastSyncedCount", 5
        );
        when(scraperService.getScraperStatus()).thenReturn(statusMap);

        ResponseEntity<Map<String, Object>> response = controller.getScraperStatus();

        assertEquals(200, response.getStatusCode().value());
        assertNotNull(response.getBody());
        assertEquals("IDLE", response.getBody().get("lastSyncStatus"));
        verify(scraperService).getScraperStatus();
    }
}
