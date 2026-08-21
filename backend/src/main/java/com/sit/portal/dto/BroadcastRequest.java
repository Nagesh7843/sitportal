package com.sit.portal.dto;

import lombok.Data;
import java.util.List;
import java.util.Map;

@Data
public class BroadcastRequest {
    private String senderName;
    private String senderEmail;
    private String senderRole;
    private String targetRole; // "FACULTY" or "STUDENT"
    private String subject;
    private String content;
    private String priority;
    private String scheduledAt;
    private List<String> attachments;
    private Filters filters;

    @Data
    public static class Filters {
        private List<String> studentEmails;
        private List<String> academicYears;
        private List<String> divisions;
        private List<String> batches;
        private List<String> facultyIds;
    }
}
