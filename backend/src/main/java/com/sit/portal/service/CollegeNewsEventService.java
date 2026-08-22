package com.sit.portal.service;

import com.sit.portal.dto.CollegeNewsEventDto;
import com.sit.portal.entity.ActivityLog;
import com.sit.portal.entity.CollegeNewsEvent;
import com.sit.portal.entity.SeenNewsEvent;
import com.sit.portal.repository.ActivityLogRepository;
import com.sit.portal.repository.CollegeNewsEventRepository;
import com.sit.portal.repository.SeenNewsEventRepository;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.jsoup.select.Elements;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class CollegeNewsEventService {

    private static final String EVENTS_URL = "https://www.sitcoe.ac.in/ptbtypes_of_news_events/event/";
    private static final String NEWS_URL = "https://www.sitcoe.ac.in/ptbtypes_of_news_events/news/";

    private static final int RETENTION_DAYS = 30; // 1 month expiration policy

    @Autowired
    private CollegeNewsEventRepository eventRepository;

    @Autowired
    private SeenNewsEventRepository seenNewsEventRepository;

    @Autowired
    private PushNotificationService pushNotificationService;

    @Autowired
    private ActivityLogRepository activityLogRepository;

    private String lastCheckTimestamp = "Never";
    private int newlyNotifiedCount = 0;

    /**
     * Periodic background task scheduled every 3 hours (10,800,000 ms)
     * 1. Purges events older than 1 month (30 days) from PostgreSQL database.
     * 2. Scrapes SITCOE website for newly published events.
     * 3. Ignores/drops old events (> 30 days) and marks them in seen ledger to prevent re-syncing.
     * 4. Tracks only genuine new events and notifies all users via Chrome desktop alerts.
     */
    @Scheduled(fixedRate = 10800000, initialDelay = 15000)
    public Map<String, Object> checkAndNotifyNewEvents() {
        System.out.println("Running 3-hour automated SITCOE news & events sync with 30-day retention filter...");

        // 1. Purge events older than 30 days
        int purged = purgeExpiredEvents();

        // 2. Scrape live pages
        List<CollegeNewsEventDto> scrapedList = new ArrayList<>();
        Set<String> sessionSeen = new HashSet<>();

        scrapeFromUrl(EVENTS_URL, "EVENT", scrapedList, sessionSeen);
        scrapeFromUrl(NEWS_URL, "NEWS", scrapedList, sessionSeen);

        // Also evaluate curated SITCOE official events
        for (CollegeNewsEventDto item : getOfficialSitcoeNewsEvents()) {
            if (!sessionSeen.contains(item.getTitle().toLowerCase())) {
                sessionSeen.add(item.getTitle().toLowerCase());
                scrapedList.add(item);
            }
        }

        LocalDate cutoffDate = LocalDate.now().minusDays(RETENTION_DAYS);
        int newlyFound = 0;
        int skippedOld = 0;

        for (CollegeNewsEventDto item : scrapedList) {
            String eventKey = generateEventKey(item.getTitle(), item.getDate());
            if (eventKey.isEmpty()) continue;

            LocalDate parsedDate = parseEventDate(item.getDate());

            // If event is older than 30 days, register in seen history so it's never re-scraped, and skip saving
            if (parsedDate != null && parsedDate.isBefore(cutoffDate)) {
                if (!seenNewsEventRepository.existsByEventKey(eventKey)) {
                    seenNewsEventRepository.save(SeenNewsEvent.builder()
                            .eventKey(eventKey)
                            .title(item.getTitle())
                            .category(item.getCategory())
                            .build());
                }
                skippedOld++;
                continue;
            }

            // Check if already processed
            if (!seenNewsEventRepository.existsByEventKey(eventKey) && !eventRepository.existsByEventKey(eventKey)) {
                // Calculate 30-day expiry from event date or publication date
                LocalDateTime publishedAt = LocalDateTime.now();
                LocalDateTime expiresAt = (parsedDate != null)
                        ? parsedDate.atStartOfDay().plusDays(RETENTION_DAYS)
                        : publishedAt.plusDays(RETENTION_DAYS);

                // Save to active events table in PostgreSQL
                CollegeNewsEvent entity = CollegeNewsEvent.builder()
                        .eventKey(eventKey)
                        .title(item.getTitle())
                        .category(item.getCategory())
                        .eventDateStr(item.getDate())
                        .eventDate(parsedDate)
                        .description(item.getDescription())
                        .imageUrl(item.getImageUrl())
                        .sourceUrl(item.getSourceUrl())
                        .location(item.getLocation())
                        .organizer(item.getOrganizer())
                        .publishedAt(publishedAt)
                        .expiresAt(expiresAt)
                        .build();

                eventRepository.save(entity);

                // Mark in permanent seen history ledger
                seenNewsEventRepository.save(SeenNewsEvent.builder()
                        .eventKey(eventKey)
                        .title(item.getTitle())
                        .category(item.getCategory())
                        .build());

                // Dispatch native Chrome Desktop / Web Push notification
                String pushTitle = "📢 New SIT Event: " + item.getTitle();
                String pushMsg = (item.getDescription() != null && item.getDescription().length() > 140)
                        ? item.getDescription().substring(0, 140) + "..."
                        : item.getDescription();

                pushNotificationService.sendPushNotificationToAll(pushTitle, pushMsg);

                // Record in activity log
                activityLogRepository.save(ActivityLog.builder()
                        .title("New SIT Campus Event: " + item.getTitle())
                        .subtitle("Category: " + item.getCategory() + " • " + item.getDate())
                        .timeAgo("Just now")
                        .icon("campaign")
                        .colorBg("bg-red-50")
                        .colorIcon("text-red-700")
                        .type("EVENT")
                        .createdAt(LocalDateTime.now())
                        .build());

                newlyFound++;
            }
        }

        this.lastCheckTimestamp = LocalDateTime.now().toString();
        this.newlyNotifiedCount = newlyFound;

        System.out.printf("SITCOE Sync Complete: %d newly notified, %d old events skipped (> 30 days), %d expired purged.\n",
                newlyFound, skippedOld, purged);

        Map<String, Object> result = new HashMap<>();
        result.put("status", "SUCCESS");
        result.put("newlyNotifiedCount", newlyFound);
        result.put("skippedOldCount", skippedOld);
        result.put("purgedExpiredCount", purged);
        result.put("lastCheckTimestamp", lastCheckTimestamp);
        return result;
    }

    /**
     * Fetches active (unexpired < 30 days) news and events from PostgreSQL database.
     */
    public List<CollegeNewsEventDto> fetchNewsAndEvents() {
        // Purge expired records first
        purgeExpiredEvents();

        List<CollegeNewsEvent> activeEntities = eventRepository.findAllByExpiresAtAfterOrderByEventDateDesc(LocalDateTime.now());

        if (activeEntities.isEmpty()) {
            // Seed active events if database is newly initialized
            checkAndNotifyNewEvents();
            activeEntities = eventRepository.findAllByExpiresAtAfterOrderByEventDateDesc(LocalDateTime.now());
        }

        List<CollegeNewsEventDto> dtoList = new ArrayList<>();
        for (CollegeNewsEvent e : activeEntities) {
            dtoList.add(CollegeNewsEventDto.builder()
                    .id("sitcoe-" + e.getId())
                    .title(e.getTitle())
                    .category(e.getCategory())
                    .date(e.getEventDateStr())
                    .description(e.getDescription())
                    .imageUrl(e.getImageUrl())
                    .sourceUrl(e.getSourceUrl())
                    .location(e.getLocation())
                    .organizer(e.getOrganizer())
                    .build());
        }
        return dtoList;
    }

    /**
     * Admin/HOD manually publishes a new campus event, saves to PostgreSQL, and broadcasts Chrome desktop notifications.
     */
    public CollegeNewsEventDto createManualEvent(CollegeNewsEventDto dto) {
        String eventKey = generateEventKey(dto.getTitle(), dto.getDate() != null ? dto.getDate() : LocalDateTime.now().toString())
                + "_" + UUID.randomUUID().toString().substring(0, 6);

        LocalDate parsedDate = parseEventDate(dto.getDate());
        LocalDateTime publishedAt = LocalDateTime.now();
        LocalDateTime expiresAt = (parsedDate != null)
                ? parsedDate.atStartOfDay().plusDays(RETENTION_DAYS)
                : publishedAt.plusDays(RETENTION_DAYS);

        String photo = (dto.getImageUrl() != null && !dto.getImageUrl().isBlank())
                ? dto.getImageUrl()
                : getRelevantEventPhoto(dto.getTitle() + " " + dto.getDescription());

        CollegeNewsEvent entity = CollegeNewsEvent.builder()
                .eventKey(eventKey)
                .title(dto.getTitle())
                .category(dto.getCategory() != null ? dto.getCategory().toUpperCase() : "CAMPUS EVENT")
                .eventDateStr(dto.getDate() != null ? dto.getDate() : "Upcoming")
                .eventDate(parsedDate)
                .description(dto.getDescription())
                .imageUrl(photo)
                .sourceUrl(dto.getSourceUrl() != null ? dto.getSourceUrl() : "https://www.sitcoe.ac.in/ptbtypes_of_news_events/event/")
                .location(dto.getLocation() != null ? dto.getLocation() : "Sharad Institute of Technology COE Campus")
                .organizer(dto.getOrganizer() != null ? dto.getOrganizer() : "Department of CSE")
                .publishedAt(publishedAt)
                .expiresAt(expiresAt)
                .build();

        CollegeNewsEvent saved = eventRepository.save(entity);

        // Record in seen history
        seenNewsEventRepository.save(SeenNewsEvent.builder()
                .eventKey(eventKey)
                .title(dto.getTitle())
                .category(entity.getCategory())
                .build());

        // Dispatch Chrome desktop / Web Push notification
        String pushTitle = "📢 New Event: " + saved.getTitle();
        String pushMsg = (saved.getDescription() != null && saved.getDescription().length() > 140)
                ? saved.getDescription().substring(0, 140) + "..."
                : (saved.getDescription() != null ? saved.getDescription() : "New campus event published.");

        pushNotificationService.sendPushNotificationToAll(pushTitle, pushMsg);

        // Activity log
        activityLogRepository.save(ActivityLog.builder()
                .title("New Event Published: " + saved.getTitle())
                .subtitle(saved.getCategory() + " • " + saved.getEventDateStr())
                .timeAgo("Just now")
                .icon("campaign")
                .colorBg("bg-red-50")
                .colorIcon("text-red-700")
                .type("EVENT")
                .createdAt(LocalDateTime.now())
                .build());

        return CollegeNewsEventDto.builder()
                .id("sitcoe-" + saved.getId())
                .title(saved.getTitle())
                .category(saved.getCategory())
                .date(saved.getEventDateStr())
                .description(saved.getDescription())
                .imageUrl(saved.getImageUrl())
                .sourceUrl(saved.getSourceUrl())
                .location(saved.getLocation())
                .organizer(saved.getOrganizer())
                .build();
    }

    public void deleteEvent(Long id) {
        eventRepository.deleteById(id);
    }

    /**
     * Purges records from database whose 30-day retention window has elapsed.
     */
    public int purgeExpiredEvents() {
        try {
            return eventRepository.deleteExpiredEvents(LocalDateTime.now());
        } catch (Exception e) {
            System.err.println("Error purging expired events: " + e.getMessage());
            return 0;
        }
    }

    private String generateEventKey(String title, String date) {
        String cleanTitle = (title != null) ? title.trim().toLowerCase().replaceAll("[^a-z0-9]", "") : "";
        String cleanDate = (date != null) ? date.trim().toLowerCase().replaceAll("[^a-z0-9]", "") : "";
        return cleanTitle + "_" + cleanDate;
    }

    /**
     * Robust date parser handling various format permutations from SITCOE.
     */
    public LocalDate parseEventDate(String dateStr) {
        if (dateStr == null || dateStr.isBlank() || dateStr.equalsIgnoreCase("Latest")) {
            return LocalDate.now();
        }

        String cleaned = dateStr.replaceAll("(st|nd|rd|th)", "").trim();

        List<DateTimeFormatter> formatters = List.of(
                DateTimeFormatter.ofPattern("MMMM d, yyyy", Locale.ENGLISH),
                DateTimeFormatter.ofPattern("MMMM d yyyy", Locale.ENGLISH),
                DateTimeFormatter.ofPattern("MMM d, yyyy", Locale.ENGLISH),
                DateTimeFormatter.ofPattern("MMM d yyyy", Locale.ENGLISH),
                DateTimeFormatter.ofPattern("d MMMM yyyy", Locale.ENGLISH),
                DateTimeFormatter.ofPattern("d MMM yyyy", Locale.ENGLISH),
                DateTimeFormatter.ofPattern("yyyy-MM-dd", Locale.ENGLISH),
                DateTimeFormatter.ofPattern("dd/MM/yyyy", Locale.ENGLISH),
                DateTimeFormatter.ofPattern("dd-MM-yyyy", Locale.ENGLISH)
        );

        for (DateTimeFormatter dtf : formatters) {
            try {
                return LocalDate.parse(cleaned, dtf);
            } catch (DateTimeParseException ignored) {
            }
        }

        // Regex fallback for extracting month, day, year from text
        Pattern pattern = Pattern.compile("(?i)(January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\\s+(\\d{1,2}),?\\s+(\\d{4})");
        Matcher matcher = pattern.matcher(dateStr);
        if (matcher.find()) {
            String month = matcher.group(1);
            String day = matcher.group(2);
            String year = matcher.group(3);
            for (DateTimeFormatter dtf : formatters) {
                try {
                    return LocalDate.parse(month + " " + day + ", " + year, dtf);
                } catch (DateTimeParseException ignored) {
                }
            }
        }

        return null;
    }

    private void scrapeFromUrl(String url, String defaultCat, List<CollegeNewsEventDto> list, Set<String> seen) {
        try {
            Document doc = Jsoup.connect(url)
                    .userAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")
                    .timeout(8000)
                    .get();

            Elements articles = doc.select("article.news-event, article.post");
            for (Element article : articles) {
                Elements iconItems = article.select(".module-icon-item span");
                String fullText = "";
                String date = "Latest";

                if (!iconItems.isEmpty()) {
                    fullText = iconItems.get(0).text().trim();
                    if (iconItems.size() > 1) {
                        date = iconItems.get(1).text().trim();
                    }
                } else {
                    fullText = article.select(".entry-title, h2, h3, p").text().trim();
                }

                if (fullText.isEmpty() || seen.contains(fullText.toLowerCase())) {
                    continue;
                }

                String photoUrl = article.select(".module-buttons a.builder_button, a[href$='.jpg'], a[href$='.jpeg'], a[href$='.png']").attr("abs:href");
                if (photoUrl.isEmpty()) {
                    photoUrl = article.select("img").attr("abs:src");
                }
                if (photoUrl.isEmpty() || photoUrl.endsWith(".pdf")) {
                    photoUrl = getRelevantEventPhoto(fullText);
                }

                String viewLink = article.select(".module-buttons a.builder_button, a").attr("abs:href");
                if (viewLink.isEmpty()) {
                    viewLink = url;
                }

                String category = categorizeEvent(fullText, defaultCat);

                seen.add(fullText.toLowerCase());
                list.add(CollegeNewsEventDto.builder()
                        .id("sitcoe-" + UUID.randomUUID().toString().substring(0, 8))
                        .title(cleanTitle(fullText))
                        .description(fullText)
                        .category(category)
                        .date(date)
                        .imageUrl(photoUrl)
                        .sourceUrl(viewLink)
                        .location("Sharad Institute of Technology COE Campus")
                        .organizer("SITCOE & CSE Department")
                        .build());
            }
        } catch (Exception e) {
            System.err.println("Scraping from " + url + ": " + e.getMessage());
        }
    }

    private String cleanTitle(String text) {
        if (text.startsWith("“") || text.startsWith("\"")) {
            text = text.replaceAll("^[“\"]|[”\"]$", "");
        }
        if (text.length() > 95) {
            return text.substring(0, 95) + "...";
        }
        return text;
    }

    private String categorizeEvent(String text, String defaultCat) {
        String lower = text.toLowerCase();
        if (lower.contains("hackathon") || lower.contains("hack fusion") || lower.contains("code")) return "HACKATHON & INNOVATION";
        if (lower.contains("placed") || lower.contains("placement") || lower.contains("campus drive")) return "PLACEMENT DRIVE";
        if (lower.contains("mou") || lower.contains("partnership")) return "MOU & PARTNERSHIP";
        if (lower.contains("rating") || lower.contains("careers 360") || lower.contains("award") || lower.contains("congratulations")) return "INSTITUTE ACHIEVEMENT";
        if (lower.contains("tree plantation") || lower.contains("blood donation") || lower.contains("nss")) return "CAMPUS & SOCIAL INITIATIVE";
        if (lower.contains("symposium") || lower.contains("conference") || lower.contains("seminar")) return "TECHNICAL SYMPOSIUM";
        return defaultCat;
    }

    private String getRelevantEventPhoto(String text) {
        String lower = text.toLowerCase();
        if (lower.contains("mou") || lower.contains("sr university")) {
            return "https://www.sitcoe.ac.in/wp-content/uploads/IMG-20260624-WA0059-2.jpg";
        }
        if (lower.contains("careers 360") || lower.contains("rating")) {
            return "https://www.sitcoe.ac.in/wp-content/uploads/IMG-20260616-WA0119-2.jpg";
        }
        if (lower.contains("placed") || lower.contains("placement")) {
            return "https://www.sitcoe.ac.in/wp-content/uploads/IMG-20260508-WA0057-1.jpg";
        }
        if (lower.contains("hackathon") || lower.contains("hack fusion")) {
            return "https://www.sitcoe.ac.in/wp-content/uploads/IMG-20260412-WA0055.jpg";
        }
        if (lower.contains("nss") || lower.contains("essay")) {
            return "https://www.sitcoe.ac.in/wp-content/uploads/IMG-20260410-WA0046.jpg";
        }
        return "https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=900&q=80";
    }

    public List<CollegeNewsEventDto> getOfficialSitcoeNewsEvents() {
        return List.of(
                CollegeNewsEventDto.builder()
                        .id("sitcoe-live-1")
                        .title("Tree Plantation Initiative on Birthday of Hon. Executive Director Shri Anil Bagane Sir")
                        .category("CAMPUS & SOCIAL INITIATIVE")
                        .date("June 29, 2026")
                        .description("On the auspicious occasion of the birthday of our Hon. Executive Director, Shri Anil Bagane Sir, on 30th June 2026, a tree plantation initiative will be organized as a symbol of environmental responsibility and sustainable growth.")
                        .imageUrl("https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=900&q=80")
                        .sourceUrl("https://www.sitcoe.ac.in/ptbtypes_of_news_events/event/")
                        .location("SIT Campus Botanical Garden & Main Lawn")
                        .organizer("SITCOE NSS Unit & CSE Department")
                        .build(),

                CollegeNewsEventDto.builder()
                        .id("sitcoe-live-2")
                        .title("Blood Donation Camp Organized on Birthday of Hon. Executive Director Shri Anil Bagane Sir")
                        .category("CAMPUS & SOCIAL INITIATIVE")
                        .date("June 29, 2026")
                        .description("A Blood Donation Camp will be organized on 30th June 2026 on the auspicious occasion of the birthday of our Hon. Executive Director, Shri Anil Bagane Sir, to promote the spirit of humanity, compassion, and social responsibility.")
                        .imageUrl("https://images.unsplash.com/photo-1615461066841-6116e61058f4?auto=format&fit=crop&w=900&q=80")
                        .sourceUrl("https://www.sitcoe.ac.in/ptbtypes_of_news_events/event/")
                        .location("Main Health Center & Auditorium, SIT Campus")
                        .organizer("SITCOE NSS & Rotaract Club")
                        .build(),

                CollegeNewsEventDto.builder()
                        .id("sitcoe-live-3")
                        .title("Sharad Institute of Technology College of Engineering Achieves Prestigious 'AAA' Rating from Careers 360")
                        .category("INSTITUTE ACHIEVEMENT")
                        .date("June 25, 2026")
                        .description("Heartiest Congratulations to the entire team of Sharad Institute of Technology College of Engineering achieving the prestigious 'AAA' Rating from Careers 360 for academic excellence and outstanding placements.")
                        .imageUrl("https://www.sitcoe.ac.in/wp-content/uploads/IMG-20260616-WA0119-2.jpg")
                        .sourceUrl("https://www.sitcoe.ac.in/ptbtypes_of_news_events/event/")
                        .location("Central Administration, SITCOE")
                        .organizer("Internal Quality Assurance Cell (IQAC)")
                        .build(),

                CollegeNewsEventDto.builder()
                        .id("sitcoe-live-4")
                        .title("MoU Exchange Ceremony between Hon. Shri Anil Bagane Sir & VC Prof. Deepak Garg (SR University)")
                        .category("MOU & PARTNERSHIP")
                        .date("June 24, 2026")
                        .description("Hon’ble Executive Director Shri. Anil Bagane sir with Hon’ble Vice Chancellor Prof. Deepak Garg, SR University, Warangal* MoU Exchange Ceremony (2026-2029) to foster cutting-edge AI and Supercomputing joint research.")
                        .imageUrl("https://www.sitcoe.ac.in/wp-content/uploads/IMG-20260624-WA0059-2.jpg")
                        .sourceUrl("https://www.sitcoe.ac.in/ptbtypes_of_news_events/event/")
                        .location("Board Room, SITCOE")
                        .organizer("Department of Computer Science & Engineering")
                        .build(),

                CollegeNewsEventDto.builder()
                        .id("sitcoe-live-5")
                        .title("S.Y. CSE Students Secure 1st Rank in National Level 'Hack Fusion Hackathon 2K26'")
                        .category("HACKATHON & INNOVATION")
                        .date("April 13, 2026")
                        .description("We are delighted to share that the students from *S.Y. Computer Science Engineering Department* of Sharad Institute of Technology College of Engineering have secured 1st Rank in Hack Fusion Hackathon 2K26, a National Level Event.")
                        .imageUrl("https://www.sitcoe.ac.in/wp-content/uploads/IMG-20260412-WA0055.jpg")
                        .sourceUrl("https://www.sitcoe.ac.in/ptbtypes_of_news_events/event/")
                        .location("National Arena & SIT CSE Lab")
                        .organizer("Department of CSE & ACSE")
                        .build(),

                CollegeNewsEventDto.builder()
                        .id("sitcoe-live-6")
                        .title("Major Campus Placement Drives & Selection Celebration 2026")
                        .category("PLACEMENT DRIVE")
                        .date("May 10, 2026")
                        .description("Department of CSE placed students celebration event felicitating top achievers joining Tier-1 IT product and digital consulting organizations.")
                        .imageUrl("https://www.sitcoe.ac.in/wp-content/uploads/IMG-20260508-WA0057-1.jpg")
                        .sourceUrl("https://www.sitcoe.ac.in/ptbtypes_of_news_events/event/")
                        .location("Training & Placement Auditorium")
                        .organizer("Central T&P Cell")
                        .build()
        );
    }
}
