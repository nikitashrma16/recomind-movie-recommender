# Recomind 🎬

**Find your next movie without the endless scrolling.**

Recomind is a movie recommendation app built with React and Java Spring Boot. You choose your preferences, and the app ranks movies from a local catalogue based on how well they match what you're looking for.

I built it as a hands-on project to explore how a simple recommendation engine works, from collecting user preferences in the frontend to scoring and ranking movies in the backend.

The interface has a warm, film-club-inspired look, with illustrated movie posters, preference controls, explanations for recommendations, and a watchlist that stays saved in your browser.

## ✨ Features

- **Personalized recommendations:** Choose a genre, mood, and comedy preference to get a new ranking.
- **Explainable results:** Each recommendation includes an explanation of why the movie matched your preferences.
- **Simple watchlist:** Save or remove movies and revisit your list later.
- **Responsive interface:** Browse using a layout designed for different screen sizes.
- **Loading and error states:** Get feedback while recommendations load, with an option to retry if the backend is unavailable.
- **No external poster service required:** Movie poster artwork is generated with CSS.

## 🛠️ Tech Stack

**Frontend:** React, Vite, JavaScript, CSS  
**Backend:** Java 17+, Spring Boot, REST API  
**Build tools:** npm, Maven  
**Storage:** Browser Local Storage  
**Data:** Local movie catalogue

## 🚀 Getting Started

### Requirements

- Node.js 20+ and npm
- Java 17+
- Maven 3.6+

No database, API key, or external movie API is required.

### 1. Start the backend

Open a terminal in the project directory and run:

```bash
cd backend
mvn spring-boot:run
```

The backend starts at:

`http://localhost:8080`

Check that it's running:

```bash
curl http://localhost:8080/api/health
```

Expected response:

```json
{"status":"ok"}
```

### 2. Start the frontend

Open a second terminal in the project directory:

```bash
cd frontend
npm install
npm run dev
```

Open the URL printed by Vite, normally:

`http://localhost:5174`

Port `5174` is configured in `vite.config.js` so the app can run alongside another local project using port `5173`.

## 🎯 How Recommendations Work

Recomind uses a simple, rule-based content recommendation system. Each movie receives a score out of 100 based on the selected preferences.

| Matching factor | Maximum score |
|---|---:|
| Genre match | 50 points |
| Mood match | 35 points |
| Comedy preference | 15 points |
| **Total** | **100 points** |

The backend calculates the scores, ranks the movies, and returns the top three results along with explanations for the matches.

This is a content-based, rule-based recommender rather than a trained machine-learning model. The goal was to build something understandable and make it clear why a movie appears in the results.

## 📁 Project Structure

```text
recomind/
├── backend/
│   ├── pom.xml
│   └── src/main/java/com/recomind/
│       ├── RecomindApplication.java
│       ├── controller/
│       │   └── RecommendationController.java
│       ├── model/
│       │   ├── Movie.java
│       │   ├── RecommendationRequest.java
│       │   └── RecommendationResult.java
│       └── service/
│           └── RecommendationService.java
└── frontend/
    ├── package.json
    ├── index.html
    ├── vite.config.js
    └── src/
        ├── main.jsx
        ├── App.jsx
        └── App.css
```

## 🔧 Troubleshooting

- **`mvn` not found:** Install Maven or use an IDE with Maven support.
- **Java version error:** Make sure your terminal uses Java 17 or newer.
- **Port 8080 is busy:** Stop the other process using that port before starting the backend.
- **Frontend cannot connect:** Check that the backend is running on port 8080.
- **`npm` not found:** Install Node.js 20 or newer, reopen Terminal, and check with `node -v` and `npm -v`.

## 💡 What I Learned

Building Recomind gave me an opportunity to work across a React frontend and a Java backend, connect them through a REST API, and implement a recommendation system with understandable scoring rules. It also helped me think about how to present recommendations clearly and handle common application states, including loading, errors, and saved user preferences.