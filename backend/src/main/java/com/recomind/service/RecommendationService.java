package com.recomind.service;

import com.recomind.model.Movie;
import com.recomind.model.RecommendationRequest;
import com.recomind.model.RecommendationResult;
import org.springframework.stereotype.Service;

import java.util.Comparator;
import java.util.List;

@Service
public class RecommendationService {
    private final List<Movie> movies = List.of(
            new Movie(1, "Interstellar", 2014, List.of("Sci-fi", "Drama"),
                    List.of("Thought-provoking", "Emotional"), 5,
                    "A journey beyond the limits of space and time."),
            new Movie(2, "Arrival", 2016, List.of("Sci-fi", "Thriller"),
                    List.of("Thought-provoking", "Suspenseful"), 5,
                    "A linguist attempts to communicate with visitors from another world."),
            new Movie(3, "The Dark Knight", 2008, List.of("Thriller", "Action"),
                    List.of("Suspenseful", "Dark"), 10,
                    "A city is pushed to its limits by a criminal mastermind."),
            new Movie(4, "The Truman Show", 1998, List.of("Comedy", "Drama"),
                    List.of("Thought-provoking", "Lighthearted"), 45,
                    "One man's ordinary life turns out to be anything but ordinary."),
            new Movie(5, "The Grand Budapest Hotel", 2014, List.of("Comedy", "Adventure"),
                    List.of("Lighthearted", "Quirky"), 90,
                    "An unusual concierge becomes involved in a chaotic adventure."),
            new Movie(6, "The Martian", 2015, List.of("Sci-fi", "Adventure"),
                    List.of("Lighthearted", "Thought-provoking"), 55,
                    "An astronaut improvises his way through a desperate survival mission."),
            new Movie(7, "Shutter Island", 2010, List.of("Thriller", "Drama"),
                    List.of("Dark", "Suspenseful"), 0,
                    "An investigation on a remote island takes unexpected turns."),
            new Movie(8, "Toy Story", 1995, List.of("Comedy", "Adventure"),
                    List.of("Lighthearted", "Emotional"), 70,
                    "Toys discover friendship, rivalry, and what it means to belong."),
            new Movie(9, "Blade Runner 2049", 2017, List.of("Sci-fi", "Thriller"),
                    List.of("Dark", "Thought-provoking"), 0,
                    "A discovery forces a detective to question reality and identity."),
            new Movie(10, "The Pursuit of Happyness", 2006, List.of("Drama"),
                    List.of("Emotional", "Thought-provoking"), 10,
                    "A father fights to build a better future for his son.")
    );

    public List<RecommendationResult> recommend(RecommendationRequest request) {
        return movies.stream()
                .map(movie -> score(movie, request))
                .sorted(Comparator.comparingInt(RecommendationResult::score).reversed()
                        .thenComparing(result -> result.movie().title()))
                .limit(3)
                .toList();
    }

    private RecommendationResult score(Movie movie, RecommendationRequest request) {
        boolean genreMatch = movie.genres().contains(request.genre());
        boolean moodMatch = movie.moods().contains(request.mood());

        int genrePoints = genreMatch ? 50 : 0;
        int moodPoints = moodMatch ? 35 : 0;
        double similarity = 1.0 - Math.abs(movie.comedy() - request.comedy()) / 100.0;
        int preferencePoints = (int) Math.round(15.0 * similarity);
        int score = genrePoints + moodPoints + preferencePoints;

        List<String> reasons = new java.util.ArrayList<>();
        if (genreMatch) {
            reasons.add("Matches your " + request.genre() + " genre preference");
        }
        if (moodMatch) {
            reasons.add("Fits your " + request.mood().toLowerCase() + " mood");
        }
        if (preferencePoints >= 12) {
            reasons.add("Closely matches your comedy preference");
        }
        if (reasons.isEmpty()) {
            reasons.add("A partial match based on your preferences");
        }

        return new RecommendationResult(movie, score, List.copyOf(reasons));
    }
}
