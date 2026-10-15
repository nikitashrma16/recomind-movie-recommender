package com.recomind.model;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;

public record RecommendationRequest(
        @NotBlank String genre,
        @NotBlank String mood,
        @Min(0) @Max(100) int comedy
) {}
