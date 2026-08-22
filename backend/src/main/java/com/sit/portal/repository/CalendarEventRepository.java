package com.sit.portal.repository;

import com.sit.portal.entity.CalendarEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CalendarEventRepository extends JpaRepository<CalendarEvent, Long> {
    List<CalendarEvent> findByCalendarIdOrderByStartDateAsc(Long calendarId);
    List<CalendarEvent> findByCalendarIdAndNoticeStatusAndIsNoticePlannedTrue(Long calendarId, String noticeStatus);
}
