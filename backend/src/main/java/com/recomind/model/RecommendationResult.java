package com.recomind.model;

import java.util.List;

public record RecommendationResult(
        Movie movie,
        int score,
        List<String> reasons
) {}
