package com.recomind.service;

import com.recomind.model.RecommendationRequest;
import com.recomind.model.RecommendationResult;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class RecommendationServiceTest {
    private final RecommendationService service = new RecommendationService();

    @Test
    void returnsThreeRankedRecommendations() {
        List<RecommendationResult> results = service.recommend(
                new RecommendationRequest("Sci-fi", "Thought-provoking", 20)
        );

        assertEquals(3, results.size());
        assertTrue(results.get(0).score() >= results.get(1).score());
        assertTrue(results.get(1).score() >= results.get(2).score());
    }

    @Test
    void explainsMatchingPreferences() {
        List<RecommendationResult> results = service.recommend(
                new RecommendationRequest("Sci-fi", "Thought-provoking", 20)
        );

        assertTrue(results.get(0).reasons().stream()
                .anyMatch(reason -> reason.contains("Sci-fi")));
    }
}
