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
public class DeviceDeliverySummaryResponse {
    private String status;
    private Long noticeId;
    private String noticeTitle;
    private int totalTargetDevices;
    private int newlyDeliveredCount;
    private int duplicatesSkippedCount;
    private int failedCount;
    private String message;
    private String deliveredAt;
    private List<String> deliveredEndpoints;
    private List<String> skippedEndpoints;
}
