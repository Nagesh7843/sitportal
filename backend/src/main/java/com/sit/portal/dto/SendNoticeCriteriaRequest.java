package com.sit.portal.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SendNoticeCriteriaRequest {
    private Long noticeId;
    private String title;
    private String message;
    private TargetCriteriaDto criteria;
    private String idempotencyKey;
}
