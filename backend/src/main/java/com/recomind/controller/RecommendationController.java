package com.recomind.controller;

import com.recomind.model.RecommendationRequest;
import com.recomind.model.RecommendationResult;
import com.recomind.service.RecommendationService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:5174"})
public class RecommendationController {
    private final RecommendationService recommendationService;

    public RecommendationController(RecommendationService recommendationService) {
        this.recommendationService = recommendationService;
    }

    @GetMapping("/health")
    public Map<String, String> health() {
        return Map.of("status", "ok");
    }

    @PostMapping("/recommendations")
    public List<RecommendationResult> recommend(
            @Valid @RequestBody RecommendationRequest request
    ) {
        return recommendationService.recommend(request);
    }
}
