package com.sit.portal.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TargetCriteriaDto {
    private String department;
    private List<String> academicYears;
    private List<String> divisions;
    private List<String> batches;
    private List<String> roles;
    private List<String> studentEmails;
    private List<String> deviceEndpoints;
    private Long noticeId;
}
