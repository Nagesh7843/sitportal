package com.sit.portal.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StudentAddressDto {

    @NotBlank(message = "Address Line 1 is required.")
    private String addressLine1;

    private String addressLine2;

    @NotBlank(message = "Village / City is required.")
    private String villageCity;

    @NotBlank(message = "Taluka is required.")
    private String taluka;

    @NotBlank(message = "District is required.")
    private String district;

    @NotBlank(message = "State is required.")
    @Builder.Default
    private String state = "Maharashtra";

    @NotBlank(message = "PIN Code is required.")
    @Pattern(regexp = "^[1-9][0-9]{5}$", message = "PIN Code must be a valid 6-digit Indian postal code (e.g. 416115).")
    private String pinCode;

    @NotBlank(message = "Country is required.")
    @Builder.Default
    private String country = "India";
}
