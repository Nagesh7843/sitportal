package com.sit.portal.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ScrapedNoticeDto {
    private String title;
    private String pdfUrl;
    private String category;
    private String priority;
    private String date;
    private String sourceUrl;
    private String author;
    private boolean isNew;
}
