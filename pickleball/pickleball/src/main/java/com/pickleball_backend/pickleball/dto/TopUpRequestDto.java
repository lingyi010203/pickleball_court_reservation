package com.pickleball_backend.pickleball.dto;

import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class TopUpRequestDto {
    @NotNull(message = "Amount is required")
    @DecimalMin(value = "20.0", message = "Minimum top-up amount is RM20")
    @DecimalMax(value = "1000.0", message = "Maximum top-up amount is RM1000")
    private Double amount;

    @NotBlank(message = "Source is required")
    @Pattern(regexp = "CREDIT_EARNED|INTERNAL_CREDIT",
            message = "Source must be CREDIT_EARNED or INTERNAL_CREDIT")
    private String source;
}