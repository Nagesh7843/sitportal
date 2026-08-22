package com.sit.portal.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CollegeNewsEventDto {
    private String id;
    private String title;
    private String category;
    private String date;
    private String description;
    private String imageUrl;
    private String sourceUrl;
    private String location;
    private String organizer;
}
