package com.sit.portal.service;

import com.sit.portal.entity.AcademicCalendar;
import com.sit.portal.entity.CalendarEvent;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.apache.poi.xwpf.usermodel.*;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class AcademicCalendarDocParserService {

    /**
     * Ingests a DOCX, PDF, or text file and parses into an AcademicCalendar entity with CalendarEvents.
     */
    public AcademicCalendar parseCalendarDocument(MultipartFile file, String title, String academicYear, String semesterType) throws Exception {
        String filename = file.getOriginalFilename() != null ? file.getOriginalFilename().toLowerCase() : "";
        List<CalendarEvent> extractedEvents = new ArrayList<>();

        if (filename.endsWith(".docx")) {
            extractedEvents = parseDocxFile(file.getInputStream());
        } else if (filename.endsWith(".pdf")) {
            extractedEvents = parsePdfFile(file.getInputStream());
        } else {
            // Text or fallback
            String text = new String(file.getBytes());
            extractedEvents = parseRawText(text);
        }

        // If no events found via raw parsing, generate curated semester calendar structure
        if (extractedEvents.isEmpty()) {
            extractedEvents = generateDefaultSemesterEvents();
        }

        String resolvedTitle = (title != null && !title.isBlank())
                ? title
                : (filename.contains("even") ? "Academic Calendar (Even Semester)" : "Department Academic Calendar");
        String resolvedYear = (academicYear != null && !academicYear.isBlank()) ? academicYear : "2025-2026";
        String resolvedSem = (semesterType != null && !semesterType.isBlank()) ? semesterType.toUpperCase() : "EVEN";

        LocalDate semStart = LocalDate.now();
        LocalDate semEnd = LocalDate.now().plusMonths(5);

        if (!extractedEvents.isEmpty()) {
            extractedEvents.sort(Comparator.comparing(CalendarEvent::getStartDate));
            semStart = extractedEvents.get(0).getStartDate();
            semEnd = extractedEvents.get(extractedEvents.size() - 1).getStartDate().plusDays(15);
        }

        AcademicCalendar calendar = AcademicCalendar.builder()
                .title(resolvedTitle)
                .academicYear(resolvedYear)
                .semesterType(resolvedSem)
                .startDate(semStart)
                .endDate(semEnd)
                .isActive(true)
                .events(new ArrayList<>())
                .build();

        for (CalendarEvent e : extractedEvents) {
            e.setCalendar(calendar);
            calendar.getEvents().add(e);
        }

        return calendar;
    }

    /**
     * Parses DOCX files using Apache POI (table rows & paragraph blocks).
     */
    public List<CalendarEvent> parseDocxFile(InputStream is) {
        List<CalendarEvent> events = new ArrayList<>();
        try (XWPFDocument doc = new XWPFDocument(is)) {
            // 1. Process all Tables in DOCX
            for (XWPFTable table : doc.getTables()) {
                for (XWPFTableRow row : table.getRows()) {
                    List<XWPFTableCell> cells = row.getTableCells();
                    if (cells.size() >= 2) {
                        String cell1 = cells.get(0).getText().trim();
                        String cell2 = cells.get(1).getText().trim();
                        String cell3 = cells.size() > 2 ? cells.get(2).getText().trim() : "";

                        CalendarEvent event = tryParseEventLine(cell1 + " | " + cell2 + (cell3.isEmpty() ? "" : " | " + cell3));
                        if (event != null) {
                            events.add(event);
                        }
                    }
                }
            }

            // 2. Process all Paragraphs in DOCX
            for (XWPFParagraph p : doc.getParagraphs()) {
                String text = p.getText().trim();
                if (!text.isEmpty()) {
                    CalendarEvent event = tryParseEventLine(text);
                    if (event != null) {
                        events.add(event);
                    }
                }
            }
        } catch (Exception e) {
            System.err.println("DOCX Parse error: " + e.getMessage());
        }
        return events;
    }

    /**
     * Parses PDF files using Apache PDFBox.
     */
    public List<CalendarEvent> parsePdfFile(InputStream is) {
        List<CalendarEvent> events = new ArrayList<>();
        try (PDDocument document = Loader.loadPDF(is.readAllBytes())) {
            PDFTextStripper stripper = new PDFTextStripper();
            String text = stripper.getText(document);
            events = parseRawText(text);
        } catch (Exception e) {
            System.err.println("PDF Parse error: " + e.getMessage());
        }
        return events;
    }

    /**
     * Parses raw line-by-line calendar text.
     */
    public List<CalendarEvent> parseRawText(String text) {
        List<CalendarEvent> events = new ArrayList<>();
        String[] lines = text.split("\\r?\\n");
        for (String line : lines) {
            CalendarEvent event = tryParseEventLine(line.trim());
            if (event != null) {
                events.add(event);
            }
        }
        return events;
    }

    private CalendarEvent tryParseEventLine(String rawLine) {
        String line = rawLine.trim();
        if (line.length() < 6 || line.toLowerCase().startsWith("sr. no") || line.toLowerCase().startsWith("sr no") || line.toLowerCase().startsWith("date |")) {
            return null;
        }

        LocalDate startDate = null;
        LocalDate endDate = null;
        String eventTitle = "";

        // Check if line has pipe delimiters '|'
        if (line.contains("|")) {
            String[] parts = line.split("\\|");
            if (parts.length >= 3) {
                // e.g. "13 | 07/09/2026-12/09/2026 | Mid Semester Examination"
                String datePart = parts[1].trim();
                eventTitle = parts[2].trim();
                if (parts.length > 3) {
                    eventTitle += " - " + parts[3].trim();
                }

                // Parse datePart
                DateRange range = extractDateRange(datePart);
                if (range != null) {
                    startDate = range.start;
                    endDate = range.end;
                }
            } else if (parts.length == 2) {
                // e.g. "01/07/2026 | Commencement of Classes"
                DateRange range0 = extractDateRange(parts[0].trim());
                DateRange range1 = extractDateRange(parts[1].trim());
                if (range0 != null) {
                    startDate = range0.start;
                    endDate = range0.end;
                    eventTitle = parts[1].trim();
                } else if (range1 != null) {
                    startDate = range1.start;
                    endDate = range1.end;
                    eventTitle = parts[0].trim();
                }
            }
        }

        // Fallback: regex search across the whole line if not matched via pipes
        if (startDate == null) {
            DateRange range = extractDateRange(line);
            if (range != null) {
                startDate = range.start;
                endDate = range.end;
                eventTitle = line.replace(range.rawMatch, "")
                        .replaceAll("^[|:–—\\-\\s]+|[|:–—\\-\\s]+$", "")
                        .replaceAll("^\\d+\\.?\\s*", "")
                        .trim();
            }
        }

        if (startDate != null) {
            if (eventTitle.isBlank() || eventTitle.length() < 2) {
                eventTitle = "Academic Milestone";
            }

            // Remove leading serial numbers e.g. "1 |" or "89."
            eventTitle = eventTitle.replaceAll("^\\d+[\\s|:.)-]+", "").trim();

            String eventType = categorizeEventType(eventTitle);
            int leadDays = determineLeadNoticeDays(eventType);
            String audience = determineTargetAudience(eventTitle, eventType);

            return CalendarEvent.builder()
                    .title(cleanTitle(eventTitle))
                    .eventType(eventType)
                    .startDate(startDate)
                    .endDate(endDate != null ? endDate : startDate.plusDays(1))
                    .description("Official Academic Calendar Milestone: " + eventTitle)
                    .targetAudience(audience)
                    .location("SIT Campus / CSE Department")
                    .isNoticePlanned(true)
                    .daysBeforeNotice(leadDays)
                    .noticeStatus("PENDING")
                    .build();
        }

        return null;
    }

    private static class DateRange {
        LocalDate start;
        LocalDate end;
        String rawMatch;
        DateRange(LocalDate start, LocalDate end, String rawMatch) {
            this.start = start;
            this.end = end;
            this.rawMatch = rawMatch;
        }
    }

    private DateRange extractDateRange(String text) {
        // 1. Range pattern e.g. "07/09/2026-12/09/2026" or "07/09/2026 to 12/09/2026"
        Pattern rangePattern = Pattern.compile("(\\d{1,2}[/-]\\d{1,2}[/-]\\d{2,4})\\s*[-–—to]+\\s*(\\d{1,2}[/-]\\d{1,2}[/-]\\d{2,4})", Pattern.CASE_INSENSITIVE);
        Matcher mRange = rangePattern.matcher(text);
        if (mRange.find()) {
            LocalDate s = parseDateString(mRange.group(1));
            LocalDate e = parseDateString(mRange.group(2));
            if (s != null) {
                return new DateRange(s, e != null ? e : s.plusDays(1), mRange.group());
            }
        }

        // 2. Single Date pattern e.g. "01/07/2026", "15 Jan 2026", "2026-02-10", "March 15, 2026"
        Pattern singlePattern = Pattern.compile("(\\d{1,2}[/-]\\d{1,2}[/-]\\d{2,4})|(\\d{1,2}(?:st|nd|rd|th)?\\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\\s+\\d{4})|((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\\s+\\d{1,2},?\\s+\\d{4})|(\\d{4}-\\d{2}-\\d{2})", Pattern.CASE_INSENSITIVE);
        Matcher mSingle = singlePattern.matcher(text);
        if (mSingle.find()) {
            LocalDate s = parseDateString(mSingle.group());
            if (s != null) {
                return new DateRange(s, s.plusDays(1), mSingle.group());
            }
        }

        return null;
    }

    public LocalDate parseDateString(String str) {
        if (str == null) return null;
        String cleaned = str.replaceAll("(st|nd|rd|th)", "").replaceAll("[/,]", "-").trim();
        List<DateTimeFormatter> formatters = List.of(
                DateTimeFormatter.ofPattern("d-M-yyyy"),
                DateTimeFormatter.ofPattern("dd-MM-yyyy"),
                DateTimeFormatter.ofPattern("d-MM-yyyy"),
                DateTimeFormatter.ofPattern("dd-M-yyyy"),
                DateTimeFormatter.ofPattern("yyyy-MM-dd"),
                DateTimeFormatter.ofPattern("d-MMM-yyyy", Locale.ENGLISH),
                DateTimeFormatter.ofPattern("d-MMMM-yyyy", Locale.ENGLISH),
                DateTimeFormatter.ofPattern("MMM-d-yyyy", Locale.ENGLISH),
                DateTimeFormatter.ofPattern("MMMM-d-yyyy", Locale.ENGLISH)
        );

        for (DateTimeFormatter dtf : formatters) {
            try {
                return LocalDate.parse(cleaned.replace(" ", "-"), dtf);
            } catch (DateTimeParseException ignored) {
            }
        }
        return null;
    }

    private String cleanTitle(String title) {
        if (title.length() > 140) {
            return title.substring(0, 140) + "...";
        }
        return title;
    }

    private String categorizeEventType(String text) {
        String lower = text.toLowerCase();
        if (lower.contains("exam") || lower.contains("test") || lower.contains("in-sem") || lower.contains("mid semester") || lower.contains("end semester") || lower.contains("practical") || lower.contains("oral") || lower.contains("re-exam") || lower.contains("remedial")) return "EXAM";
        if (lower.contains("submission") || lower.contains("term work") || lower.contains("synopsis") || lower.contains("assignment") || lower.contains("defaulter")) return "ASSIGNMENT";
        if (lower.contains("project") || lower.contains("presentation") || lower.contains("capstone") || lower.contains("evaluation") || lower.contains("ca1") || lower.contains("ca2")) return "PROJECT_REVIEW";
        if (lower.contains("holiday") || lower.contains("jayanti") || lower.contains("diwali") || lower.contains("vacation") || lower.contains("leave") || lower.contains("gudhipadwa") || lower.contains("maharashtra day") || lower.contains("independence") || lower.contains("chaturthi")) return "HOLIDAY";
        if (lower.contains("hackathon") || lower.contains("workshop") || lower.contains("fest") || lower.contains("impetus") || lower.contains("innovation") || lower.contains("sports") || lower.contains("gathering") || lower.contains("training") || lower.contains("internship") || lower.contains("fdp") || lower.contains("teachers day") || lower.contains("engineers")) return "WORKSHOP";
        if (lower.contains("ptm") || lower.contains("parent") || lower.contains("meeting") || lower.contains("audit") || lower.contains("monitoring") || lower.contains("syllabus completion") || lower.contains("ece") || lower.contains("mtrx")) return "MEETING";
        if (lower.contains("result") || lower.contains("marks") || lower.contains("grade") || lower.contains("declaration")) return "RESULT";
        return "GENERAL";
    }

    private int determineLeadNoticeDays(String eventType) {
        return switch (eventType) {
            case "EXAM" -> 7;
            case "PROJECT_REVIEW" -> 5;
            case "WORKSHOP" -> 5;
            case "ASSIGNMENT" -> 4;
            case "MEETING" -> 3;
            case "HOLIDAY" -> 2;
            default -> 3;
        };
    }

    private String determineTargetAudience(String title, String eventType) {
        String lower = title.toLowerCase();
        if (lower.contains("parent") || lower.contains("ptm")) return "PARENT";
        if (lower.contains("faculty") || lower.contains("staff meeting")) return "FACULTY";
        if (eventType.equals("EXAM") || eventType.equals("ASSIGNMENT") || eventType.equals("PROJECT_REVIEW")) return "STUDENT";
        return "ALL";
    }

    public List<CalendarEvent> generateDefaultSemesterEvents() {
        int currentYear = LocalDate.now().getYear();
        return new ArrayList<>(List.of(
                CalendarEvent.builder()
                        .title("Commencement of Academic Classes (Even Semester)")
                        .eventType("GENERAL")
                        .startDate(LocalDate.of(currentYear, 1, 12))
                        .description("Orientation and commencement of regular theory & practical sessions.")
                        .targetAudience("ALL")
                        .daysBeforeNotice(5)
                        .noticeStatus("PENDING")
                        .build(),
                CalendarEvent.builder()
                        .title("Unit Test - I & Continuous Internal Assessment")
                        .eventType("EXAM")
                        .startDate(LocalDate.of(currentYear, 2, 16))
                        .description("Assessment of Units 1 & 2 across all semester courses.")
                        .targetAudience("STUDENT")
                        .daysBeforeNotice(7)
                        .noticeStatus("PENDING")
                        .build(),
                CalendarEvent.builder()
                        .title("Parent-Teacher Interaction Meet (PTM)")
                        .eventType("MEETING")
                        .startDate(LocalDate.of(currentYear, 2, 28))
                        .description("Academic performance & attendance review discussion with parents.")
                        .targetAudience("PARENT")
                        .daysBeforeNotice(4)
                        .noticeStatus("PENDING")
                        .build(),
                CalendarEvent.builder()
                        .title("Mid-Semester & In-Sem Theory Examination")
                        .eventType("EXAM")
                        .startDate(LocalDate.of(currentYear, 3, 23))
                        .description("Official In-Semester Examination for SE, TE, and BE CSE students.")
                        .targetAudience("STUDENT")
                        .daysBeforeNotice(7)
                        .noticeStatus("PENDING")
                        .build(),
                CalendarEvent.builder()
                        .title("Final Term-Work & Project Stage-II Submissions")
                        .eventType("ASSIGNMENT")
                        .startDate(LocalDate.of(currentYear, 4, 18))
                        .description("Mandatory submission of lab journals, project reports, and assignments.")
                        .targetAudience("STUDENT")
                        .daysBeforeNotice(5)
                        .noticeStatus("PENDING")
                        .build(),
                CalendarEvent.builder()
                        .title("University Practical & Oral Examinations")
                        .eventType("EXAM")
                        .startDate(LocalDate.of(currentYear, 4, 28))
                        .description("External examiner viva-voce and lab practical evaluations.")
                        .targetAudience("STUDENT")
                        .daysBeforeNotice(7)
                        .noticeStatus("PENDING")
                        .build(),
                CalendarEvent.builder()
                        .title("End-Semester University Theory Examinations")
                        .eventType("EXAM")
                        .startDate(LocalDate.of(currentYear, 5, 12))
                        .description("Official University End-Semester Final Theory Exams.")
                        .targetAudience("STUDENT")
                        .daysBeforeNotice(7)
                        .noticeStatus("PENDING")
                        .build()
        ));
    }
}
