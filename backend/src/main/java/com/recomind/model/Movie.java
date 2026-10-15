package com.recomind.model;

import java.util.List;

public record Movie(
        int id,
        String title,
        int year,
        List<String> genres,
        List<String> moods,
        int comedy,
        String description
) {}
