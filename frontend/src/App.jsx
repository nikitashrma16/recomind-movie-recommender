import { useEffect, useMemo, useState } from "react";
import "./App.css";

const CINEMETA = "https://v3-cinemeta.strem.io";
const genres = ["Any mood", "Action", "Adventure", "Animation", "Comedy", "Crime", "Drama", "Fantasy", "Horror", "Romance", "Sci-Fi", "Thriller"];
const moods = [
  { label: "Thought-provoking", emoji: "✳", hint: "Give me something to think about" },
  { label: "Suspenseful", emoji: "◒", hint: "Keep me guessing" },
  { label: "Lighthearted", emoji: "☀", hint: "Nothing too heavy" },
  { label: "Emotional", emoji: "♡", hint: "I want to feel something" },
  { label: "Dark", emoji: "☾", hint: "A little darker, please" },
  { label: "Quirky", emoji: "✷", hint: "Something a bit different" },
];

const comedyGenres = new Set(["Comedy", "Animation", "Adventure", "Romance"]);

// Search understands common genre aliases and mood language, not just literal title matches.
const searchIntents = [
  { terms: ["fantasy", "magical", "magic", "wizard", "witch", "mythical"], genres: ["fantasy"] },
  { terms: ["sci-fi", "scifi", "science fiction", "space", "alien", "futuristic"], genres: ["sci-fi", "science fiction"] },
  { terms: ["funny", "laugh", "laughter", "hilarious", "feel-good", "feel good", "lighthearted", "light-hearted", "comfort", "cozy", "happy"], genres: ["comedy", "animation", "family", "romance", "adventure"] },
  { terms: ["scary", "horror", "terrifying", "spooky"], genres: ["horror"] },
  { terms: ["suspense", "suspenseful", "mystery", "twisty", "keep me guessing"], genres: ["thriller", "mystery", "crime", "horror"] },
  { terms: ["dark", "gritty", "intense", "grim"], genres: ["crime", "thriller", "horror", "drama"] },
  { terms: ["emotional", "tearjerker", "sad", "heartbreaking", "romantic", "love"], genres: ["drama", "romance", "family"] },
  { terms: ["thought-provoking", "thought provoking", "mind-bending", "mind bending", "deep", "philosophical", "quirky", "different", "weird"], genres: ["sci-fi", "science fiction", "drama", "mystery", "fantasy"] },
  { terms: ["action-packed", "action packed", "adventure"], genres: ["action", "adventure"] },
];

function searchMatches(movie, rawQuery) {
  const q = rawQuery.trim().toLocaleLowerCase();
  if (!q) return true;
  const title = movie.title.toLocaleLowerCase();
  const description = (movie.description || "").toLocaleLowerCase();
  const movieGenres = (movie.genres || []).map((g) => g.toLocaleLowerCase());
  if (title.includes(q) || description.includes(q) || movieGenres.some((g) => g.includes(q))) return true;

  // Treat direct genre names as genre filters, including partial words.
  const knownGenre = genres.find((g) => g !== "Any mood" && g.toLocaleLowerCase() === q);
  if (knownGenre && movieGenres.some((g) => g === knownGenre.toLocaleLowerCase())) return true;

  // Mood/phrase aliases match relevant genres, so "feel-good" can find comedies
  // even when that exact phrase isn't present in the movie metadata.
  const intent = searchIntents.find((item) => item.terms.some((term) => term === q || (q.length >= 4 && term.includes(q))));
  if (intent && movieGenres.some((g) => intent.genres.some((wanted) => g === wanted || g.includes(wanted)))) return true;

  // Also allow a short phrase to match a genre word embedded in a natural-language query.
  const genreWords = ["action", "adventure", "animation", "comedy", "crime", "drama", "fantasy", "horror", "romance", "thriller", "mystery"];
  return genreWords.some((g) => q.includes(g) && movieGenres.some((mg) => mg.includes(g)));
}


function normalize(item) {
  const id = item.imdb_id || item.id;
  const yearText = item.releaseInfo || item.year || "";
  const year = String(yearText).match(/\d{4}/)?.[0] || "";
  const genreList = Array.isArray(item.genres) ? item.genres : Array.isArray(item.genre) ? item.genre : [];
  return {
    id: String(id || item.name), title: item.name || item.title || "Untitled",
    year, genres: genreList, description: item.description || "A story waiting to be discovered.",
    poster: item.poster || "", background: item.background || "", rating: item.imdbRating || "",
  };
}

async function fetchCatalog(url) {
  const response = await fetch(url, { headers: { Accept: "application/json" } });
  if (!response.ok) throw new Error(`Movie service returned ${response.status}`);
  const data = await response.json();
  return (data.metas || []).map(normalize).filter((movie) => movie.title && movie.id);
}

function shuffle(items) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export default function App() {
  const [genre, setGenre] = useState("Any mood");
  const [mood, setMood] = useState("Thought-provoking");
  const [comedy, setComedy] = useState(35);
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("discover");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState(null);
  const [searching, setSearching] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [refreshCount, setRefreshCount] = useState(0);
  const [saved, setSaved] = useState(() => {
    try { return JSON.parse(localStorage.getItem("recomind-watchlist") || "[]"); } catch { return []; }
  });

  useEffect(() => { localStorage.setItem("recomind-watchlist", JSON.stringify(saved)); }, [saved]);

  async function loadMovies({ fresh = false, selectedGenre = genre } = {}) {
    setLoading(true); setError(""); setSearchResults(null); setSearchQuery("");
    try {
      let results = [];
      if (selectedGenre !== "Any mood") {
        results = await fetchCatalog(`${CINEMETA}/catalog/movie/top/search=${encodeURIComponent(selectedGenre)}.json`);
      }
      if (results.length < 12) {
        const popular = await fetchCatalog(`${CINEMETA}/catalog/movie/top.json`);
        results = [...results, ...popular];
      }
      const unique = [...new Map(results.map((movie) => [movie.id, movie])).values()];
      const filtered = selectedGenre === "Any mood" ? unique : unique.filter((movie) => movie.genres.some((g) => g.toLowerCase() === selectedGenre.toLowerCase()));
      const pool = filtered.length >= 8 ? filtered : unique;
      const ranked = pool.map((movie) => {
        const comedyLike = movie.genres.some((g) => comedyGenres.has(g)) ? 75 : 15;
        let score = Math.max(0, 100 - Math.abs(comedyLike - comedy));
        if (selectedGenre !== "Any mood" && movie.genres.some((g) => g.toLowerCase() === selectedGenre.toLowerCase())) score += 30;
        const genreText = movie.genres.join(" ").toLowerCase();
        if (mood === "Lighthearted" && /comedy|animation|adventure|family/.test(genreText)) score += 12;
        if (mood === "Suspenseful" && /thriller|mystery|crime|horror/.test(genreText)) score += 12;
        if (mood === "Emotional" && /drama|romance|family/.test(genreText)) score += 12;
        if (mood === "Dark" && /crime|thriller|horror/.test(genreText)) score += 12;
        if (mood === "Thought-provoking" && /sci-fi|science fiction|drama|mystery/.test(genreText)) score += 12;
        return { ...movie, score: Math.min(score, 100) };
      });
      let next = ranked.sort((a, b) => b.score - a.score);
      if (fresh) {
        const oldIds = new Set(movies.map((movie) => movie.id));
        const newBatch = next.filter((movie) => !oldIds.has(movie.id));
        next = shuffle(newBatch.length >= 8 ? newBatch : next);
        setRefreshCount((n) => n + 1);
      }
      setMovies(next);
    } catch (err) {
      setError("Couldn't reach the movie shelf just now. Check your connection and try again.");
    } finally { setLoading(false); }
  }

  useEffect(() => { loadMovies(); /* initial catalogue */ }, []);

  useEffect(() => {
    const query = searchQuery.trim();
    if (!query) { setSearchResults(null); setSearching(false); return; }
    if (activeTab === "watchlist") { setSearchResults(null); return; }
    let cancelled = false;
    const timer = setTimeout(async () => {
      setSearching(true);
      setError("");
      try {
        // Cinemeta search is title-oriented and may return no matches for genres like
        // "fantasy". Combine title search with its public top catalogue and match locally.
        const [titleMatches, catalogue] = await Promise.all([
          fetchCatalog(`${CINEMETA}/catalog/movie/top/search=${encodeURIComponent(query)}.json`).catch(() => []),
          fetchCatalog(`${CINEMETA}/catalog/movie/top.json`).catch(() => []),
        ]);
        const all = [...new Map([...titleMatches, ...catalogue].map((movie) => [movie.id, movie])).values()];
        const matches = all.filter((movie) => searchMatches(movie, query));
        if (!cancelled) setSearchResults(matches);
      } catch {
        if (!cancelled) setSearchResults(movies.filter((movie) => searchMatches(movie, query)));
      } finally { if (!cancelled) setSearching(false); }
    }, 350);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [searchQuery, activeTab]);

  function toggleSaved(movie) {
    setSaved((items) => items.some((item) => item.id === movie.id) ? items.filter((item) => item.id !== movie.id) : [...items, movie]);
  }
  const savedIds = useMemo(() => new Set(saved.map((movie) => movie.id)), [saved]);
  const visibleMovies = activeTab === "watchlist" ? saved.filter((m) => !searchQuery || `${m.title} ${m.genres.join(" ")}`.toLowerCase().includes(searchQuery.toLowerCase())) : searchResults !== null ? searchResults : movies;

  return <div className="site-shell" id="home">
    <header className="topbar">
      <a className="wordmark" href="#home" aria-label="Recomind home"><span className="wordmark-icon">r</span><span>recomind</span></a>
      <div className="search-wrap">
        <label className="search-box"><span className="search-symbol">⌕</span><input value={searchQuery} onFocus={() => setSearchFocused(true)} onBlur={() => setTimeout(() => setSearchFocused(false), 180)} onChange={(e) => setSearchQuery(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { setSearchFocused(false); document.querySelector(".results-section")?.scrollIntoView({ behavior: "smooth", block: "start" }); } if (e.key === "Escape") { setSearchQuery(""); setSearchFocused(false); } }} placeholder="Search a title, genre, or vibe…" aria-label="Search movie titles" aria-expanded={searchFocused && Boolean(searchQuery.trim())} />{searchQuery && <button type="button" className="clear-search" onMouseDown={(e) => e.preventDefault()} onClick={() => setSearchQuery("")} aria-label="Clear search">×</button>}</label>
        {searchQuery.trim() && searchFocused && <div className="search-feedback" role="status" aria-live="polite">
          {searching ? <div className="search-feedback-status"><span className="mini-spinner" /> Searching movie titles and genres…</div> : searchResults?.length ? <><div className="search-feedback-heading">{searchResults.length} {searchResults.length === 1 ? "match" : "matches"} found <span>Press Enter to see results</span></div><div className="search-suggestions">{searchResults.slice(0, 5).map((movie) => <button type="button" className="search-suggestion" key={movie.id} onMouseDown={(e) => e.preventDefault()} onClick={() => { setSearchFocused(false); document.querySelector(".results-section")?.scrollIntoView({ behavior: "smooth", block: "start" }); }}><span className="suggestion-poster">{movie.poster ? <img src={movie.poster} alt="" /> : "🎬"}</span><span className="suggestion-copy"><strong>{movie.title}</strong><small>{[movie.year, movie.genres.slice(0, 2).join(" · ")].filter(Boolean).join(" · ") || "Movie"}</small></span><span className="suggestion-arrow">↗</span></button>)}</div></> : <div className="search-feedback-status">No matches yet. Try “fantasy”, “feel-good”, “scary”, or a movie title.</div>}
        </div>}
      </div>
      <nav className="top-nav"><button className={activeTab === "discover" ? "nav-link active" : "nav-link"} onClick={() => setActiveTab("discover")}>Discover</button><button className={activeTab === "watchlist" ? "nav-link active" : "nav-link"} onClick={() => { setActiveTab("watchlist"); setSearchQuery(""); }}>My watchlist <span className="watch-count">{saved.length}</span></button></nav>
      <div className="header-note"><span className="live-dot" /> FOR YOUR NEXT MOVIE NIGHT</div>
    </header>
    <main>
      <section className="intro"><div className="intro-copy"><p className="eyebrow"><span className="eyebrow-line" /> A LITTLE LAUGHTER NEVER HURTS</p><h1>Find your next<br /><em>film fixation.</em></h1><p className="intro-text">A place to collect movie-night moods, save the stories that catch your eye, and find something that feels just right.</p><div className="intro-footnote"><span className="tiny-star">✳</span> Good films. Good feelings. No overthinking.</div></div><div className="intro-art" aria-hidden="true"><div className="ticket ticket-back"><span>TONIGHT'S SHOW</span><b>ANYTHING<br />BUT<br />ORDINARY</b><small>ADMIT ONE · YOUR SOFA</small></div><div className="ticket ticket-front"><div className="ticket-circle">R<span>✳</span></div><span className="ticket-small">A LITTLE FILM CLUB</span><strong>Good stories<br />stay with us.</strong><div className="ticket-bottom"><span>EST. TONIGHT</span><span>NO. 001</span></div></div><span className="art-spark spark-a">✳</span><span className="art-spark spark-b">✦</span></div></section>
      {activeTab === "discover" && <section className="taste-panel"><div className="panel-heading"><div><span className="step-label">YOUR KIND OF MOVIE <span>01 — 03</span></span><h2>What's the mood?</h2><p>There are no wrong answers. It's movie night.</p></div><button className="text-button" onClick={() => { setGenre("Any mood"); setMood("Thought-provoking"); setComedy(35); loadMovies({ selectedGenre: "Any mood" }); }}>Start over <span>↺</span></button></div>
        <div className="preference-block"><div className="field-heading"><span className="field-number">01</span><label>Pick a genre</label><span className="field-note">THE KIND OF STORY</span></div><div className="genre-list">{genres.map((item, i) => <button key={item} className={`genre-chip ${genre === item ? "selected" : ""}`} onClick={() => { setGenre(item); loadMovies({ selectedGenre: item }); }} aria-pressed={genre === item}><span className="genre-symbol">{["✧", "↗", "✦", "❋", "☺", "◈", "♡", "✧", "☾", "♥", "✳", "◒"][i]}</span>{item}{genre === item && <span className="chip-check">✓</span>}</button>)}</div></div>
        <div className="preference-block mood-block"><div className="field-heading"><span className="field-number">02</span><label>Choose a feeling</label><span className="field-note">HOW SHOULD IT FEEL?</span></div><div className="mood-grid">{moods.map((item) => <button key={item.label} className={`mood-choice ${mood === item.label ? "selected" : ""}`} onClick={() => { setMood(item.label); loadMovies({ selectedGenre: genre }); }} aria-pressed={mood === item.label}><span className="mood-icon">{item.emoji}</span><span className="mood-text"><strong>{item.label}</strong><small>{item.hint}</small></span><span className="mood-radio">{mood === item.label ? "✓" : ""}</span></button>)}</div></div>
        <div className="preference-block comedy-block"><div className="field-heading"><span className="field-number">03</span><label>How much do you want to laugh?</label><span className="field-note">YOUR CALL</span></div><div className="comedy-row"><span className="comedy-face serious">☹</span><input aria-label="Comedy preference" type="range" min="0" max="100" step="5" value={comedy} onChange={(e) => setComedy(Number(e.target.value))} /><span className="comedy-face funny">☺</span><span className="comedy-value">{comedy}%</span></div><div className="range-caption"><span>Keep it serious</span><span>Make me laugh</span></div></div>
        <div className="panel-bottom"><span><span className="little-lock">✳</span> Your taste, your call. Change these anytime.</span><button className="find-button" onClick={() => loadMovies()} disabled={loading}>{loading ? <><span className="button-spinner" /> Finding films</> : <>Find my films <span>↗</span></>}</button></div></section>}
      <section className="results-section" aria-live="polite"><div className="results-heading"><div><p className="eyebrow"><span className="eyebrow-line" /> {activeTab === "watchlist" ? "SAVED FOR LATER" : searchQuery ? "MOVIE SEARCH" : "A FEW GOOD OPTIONS"}</p><h2>{activeTab === "watchlist" ? "Your saved collection" : searchQuery ? `Results for “${searchQuery}”` : "Ideas worth keeping."}</h2><p className="results-subtitle">{activeTab === "watchlist" ? "Your little corner of films for later." : "Save the ones that spark something. There's plenty more to find."}</p></div>{activeTab === "discover" && <div className="results-meta"><span className="result-pill">{visibleMovies.length} {searchQuery ? "matches" : "films"}</span><span className="sorted-note">Made for your mood <span>✳</span></span></div>}</div>
        {(loading || searching) && <div className="loading-state"><span className="loading-orbit">✳</span><div><strong>{searching ? "Looking for that title…" : "Finding your kind of story…"}</strong><p>One moment, we're browsing the movie shelf.</p></div></div>}
        {error && !searching && <div className="message-state error-state"><span>☁</span><div><strong>One tiny technical hiccup.</strong><p>{error}</p><button className="inline-action" onClick={() => loadMovies()}>Try again ↗</button></div></div>}
        {!loading && !searching && !error && visibleMovies.length === 0 && <div className="message-state empty-state"><span>{searchQuery ? "⌕" : "♡"}</span><div><strong>{searchQuery ? "No matches this time." : activeTab === "watchlist" ? "Your saved collection is a blank slate." : "No films on this shelf yet."}</strong><p>{searchQuery ? "Try a movie title or a genre like fantasy, comedy, or thriller." : "Save a film that catches your eye and it'll be waiting here."}</p><button className="inline-action" onClick={() => searchQuery ? setSearchQuery("") : setActiveTab("discover")}>{searchQuery ? "Clear search ↗" : "Find something to save ↗"}</button></div></div>}
        {!loading && !searching && !error && visibleMovies.length > 0 && <div className="movie-grid pinterest-grid">{visibleMovies.map((movie, index) => { const isSaved = savedIds.has(movie.id); return <article className="movie-card" key={movie.id}><div className="poster-wrap">{movie.poster ? <img className="real-poster" src={movie.poster} alt={`${movie.title} poster`} loading={index < 8 ? "eager" : "lazy"} onError={(e) => { e.currentTarget.style.display = "none"; }} /> : <div className="poster-fallback"><span>{movie.genres[0] || "A FILM"}</span><strong>{movie.title}</strong></div>}<button className={`save-button ${isSaved ? "is-saved" : ""}`} onClick={() => toggleSaved(movie)} aria-label={isSaved ? `Remove ${movie.title} from watchlist` : `Save ${movie.title}`} title={isSaved ? "Remove from watchlist" : "Save for later"}>{isSaved ? "Saved ✓" : "Save +"}</button></div><div className="movie-info"><div className="movie-meta"><span>{movie.year || "Film"}</span><span className="meta-dot">·</span><span>{movie.genres.slice(0, 3).join(" / ") || "Movie"}</span>{movie.rating && <span className="match-score">★ {movie.rating}</span>}</div><h3>{movie.title}</h3><p className="movie-description">{movie.description}</p><button className={`card-action ${isSaved ? "saved-action" : ""}`} onClick={() => toggleSaved(movie)}>{isSaved ? "Saved to your collection" : "Save this idea"}<span>{isSaved ? "✓" : "+"}</span></button></div></article>; })}</div>}
        {activeTab === "discover" && !loading && !error && !searchQuery && <div className="results-foot"><span><span className="tiny-star">✳</span> A whole world of movies, one good pick at a time.</span><button onClick={() => loadMovies({ fresh: true })} className="refresh-button" disabled={loading}>Show me more <span>↻</span></button></div>}
      </section>
    </main>
    <footer className="footer"><a className="footer-brand" href="#home">recomind<span>.</span></a><p>Your personal pinboard for movie-night moods.</p><div className="footer-tech"><span>MADE FOR MOVIE NIGHTS</span><i>·</i><span>GOOD STORIES</span></div></footer>
  </div>;
}
