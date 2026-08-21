package com.sit.portal.controller;

import com.sit.portal.entity.Notice;
import com.sit.portal.service.NoticeService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.ResponseEntity;

import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class NoticeControllerTest {

    @Mock
    private NoticeService noticeService;

    @InjectMocks
    private NoticeController controller;

    @Test
    void getAllNoticesReturnsList() {
        Notice notice = Notice.builder().id(1L).title("Exam timetable").build();
        when(noticeService.getAllNotices()).thenReturn(List.of(notice));

        List<Notice> result = controller.getAllNotices();

        assertEquals(1, result.size());
        assertEquals("Exam timetable", result.get(0).getTitle());
        verify(noticeService).getAllNotices();
    }

    @Test
    void getNoticeByIdReturnsNoticeWhenFound() {
        Notice notice = Notice.builder().id(1L).title("Exam timetable").build();
        when(noticeService.getNoticeById(1L)).thenReturn(Optional.of(notice));

        ResponseEntity<Notice> response = controller.getNoticeById(1L);

        assertEquals(200, response.getStatusCode().value());
        assertNotNull(response.getBody());
        assertEquals("Exam timetable", response.getBody().getTitle());
    }

    @Test
    void getNoticeByIdReturnsNotFoundWhenMissing() {
        when(noticeService.getNoticeById(999L)).thenReturn(Optional.empty());

        ResponseEntity<Notice> response = controller.getNoticeById(999L);

        assertEquals(404, response.getStatusCode().value());
    }

    @Test
    void createNoticeReturnsCreatedStatus() {
        Notice notice = Notice.builder().title("Exam timetable").publishedAt("May 10, 2026 at 10:00 AM").build();
        when(noticeService.createNotice(any(Notice.class))).thenReturn(notice);

        ResponseEntity<Notice> response = controller.createNotice(notice);

        assertEquals(201, response.getStatusCode().value());
        assertNotNull(response.getBody());
        assertEquals("Exam timetable", response.getBody().getTitle());
        verify(noticeService).createNotice(notice);
    }

    @Test
    void updateNoticeReturnsUpdatedNoticeWhenFound() {
        Notice updateData = Notice.builder().title("Updated Timetable").build();
        Notice updatedResult = Notice.builder().id(1L).title("Updated Timetable").build();
        when(noticeService.updateNotice(eq(1L), any(Notice.class))).thenReturn(updatedResult);

        ResponseEntity<Notice> response = controller.updateNotice(1L, updateData);

        assertEquals(200, response.getStatusCode().value());
        assertEquals("Updated Timetable", response.getBody().getTitle());
    }

    @Test
    void updateNoticeReturnsNotFoundWhenMissing() {
        Notice updateData = Notice.builder().title("Updated Timetable").build();
        when(noticeService.updateNotice(eq(999L), any(Notice.class))).thenReturn(null);

        ResponseEntity<Notice> response = controller.updateNotice(999L, updateData);

        assertEquals(404, response.getStatusCode().value());
    }

    @Test
    void deletesTheRequestedNoticeWhenFound() {
        Notice notice = Notice.builder().id(42L).title("Test").build();
        when(noticeService.getNoticeById(42L)).thenReturn(Optional.of(notice));

        ResponseEntity<Void> response = controller.deleteNotice(42L);

        assertEquals(204, response.getStatusCode().value());
        verify(noticeService).deleteNotice(42L);
    }

    @Test
    void deleteNoticeReturnsNotFoundWhenMissing() {
        when(noticeService.getNoticeById(999L)).thenReturn(Optional.empty());

        ResponseEntity<Void> response = controller.deleteNotice(999L);

        assertEquals(404, response.getStatusCode().value());
        verify(noticeService, never()).deleteNotice(999L);
    }
}
