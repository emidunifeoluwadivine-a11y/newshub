import { useEffect, useState } from "react";
import "./App.css";

const API = "http://localhost:5000";

/* ADVERTISEMENT SPACE */
function AdSpace({ label = "ADVERTISEMENT" }) {
  return (
    <div className="ad-space">
      <span>{label}</span>
      <strong>Ad Space</strong>
      <small>Your advertisement could appear here</small>
    </div>
  );
}

function App() {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem("newsHubUser");
    return saved ? JSON.parse(saved) : null;
  });

  const [page, setPage] = useState("login");
  const [view, setView] = useState("home");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [category, setCategory] = useState("general");
  const [search, setSearch] = useState("");

  const [savedArticles, setSavedArticles] = useState(() => {
    const saved = localStorage.getItem("newsHubSaved");
    return saved ? JSON.parse(saved) : [];
  });

  const [selectedArticle, setSelectedArticle] = useState(null);

  const [profileName, setProfileName] = useState(() => {
    const saved = localStorage.getItem("newsHubUser");
    return saved ? JSON.parse(saved).name : "";
  });

  const [profileImage, setProfileImage] = useState(() => {
    return localStorage.getItem("newsHubProfileImage") || "";
  });

  useEffect(() => {
    if (user && view === "home") {
      getNews();
    }
  }, [user, category]);

  async function getNews() {
    setLoading(true);
    setError("");
    setSelectedArticle(null);

    try {
      const response = await fetch(`${API}/api/news?category=${category}`);

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to load news");
      }

      setArticles(data.articles || []);
    } catch (err) {
      console.error(err);
      setError("Unable to load news right now.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSearch(e) {
    e.preventDefault();

    if (!search.trim()) {
      getNews();
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `${API}/api/news/search?q=${encodeURIComponent(search)}`,
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Search failed");
      }

      setArticles(data.articles || []);
    } catch (err) {
      console.error(err);
      setError("Search failed.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSignup(e) {
    e.preventDefault();
    setError("");

    try {
      const response = await fetch(`${API}/api/auth/signup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          email,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Signup failed");
      }

      setUser(data.user);

      localStorage.setItem("newsHubUser", JSON.stringify(data.user));

      setProfileName(data.user.name);

      setName("");
      setEmail("");
      setPassword("");
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleLogin(e) {
    e.preventDefault();
    setError("");

    try {
      const response = await fetch(`${API}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Login failed");
      }

      setUser(data.user);
      setProfileName(data.user.name);

      localStorage.setItem("newsHubUser", JSON.stringify(data.user));

      setEmail("");
      setPassword("");
    } catch (err) {
      setError(err.message);
    }
  }

  function logout() {
    localStorage.removeItem("newsHubUser");

    setUser(null);
    setArticles([]);
    setSelectedArticle(null);
    setView("home");
    setPage("login");
  }

  function toggleSave(article) {
    let updated;

    const alreadySaved = savedArticles.some((item) => item.id === article.id);

    if (alreadySaved) {
      updated = savedArticles.filter((item) => item.id !== article.id);
    } else {
      updated = [...savedArticles, article];
    }

    setSavedArticles(updated);

    localStorage.setItem("newsHubSaved", JSON.stringify(updated));
  }

  function openArticle(article) {
    setSelectedArticle(article);
    setView("article");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function openSaved() {
    setView("saved");
    setSelectedArticle(null);
  }

  function openProfile() {
    setView("profile");
    setSelectedArticle(null);
  }

  function saveProfile() {
    const updatedUser = {
      ...user,
      name: profileName,
    };

    setUser(updatedUser);

    localStorage.setItem("newsHubUser", JSON.stringify(updatedUser));

    alert("Profile updated successfully!");
  }

  function handleProfileImage(e) {
    const file = e.target.files[0];

    if (!file) return;

    const reader = new FileReader();

    reader.onload = () => {
      setProfileImage(reader.result);

      localStorage.setItem("newsHubProfileImage", reader.result);
    };

    reader.readAsDataURL(file);
  }

  /* LOGIN / SIGNUP */

  if (!user) {
    return (
      <div className="auth-page">
        <div className="auth-box">
          <div className="auth-logo">
            NEWS<span>HUB</span>
          </div>

          {page === "login" ? (
            <>
              <h1>Welcome Back</h1>

              <p>Stay informed. Stay ahead.</p>

              <form onSubmit={handleLogin}>
                <input
                  type="email"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />

                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />

                <button type="submit">Login</button>
              </form>

              {error && <div className="error-box">{error}</div>}

              <p className="switch-text">
                Don't have an account?
                <button
                  className="link-button"
                  onClick={() => {
                    setPage("signup");
                    setError("");
                  }}
                >
                  Sign Up
                </button>
              </p>
            </>
          ) : (
            <>
              <h1>Create Account</h1>

              <p>Join NewsHub today.</p>

              <form onSubmit={handleSignup}>
                <input
                  type="text"
                  placeholder="Full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />

                <input
                  type="email"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />

                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />

                <button type="submit">Create Account</button>
              </form>

              {error && <div className="error-box">{error}</div>}

              <p className="switch-text">
                Already have an account?
                <button
                  className="link-button"
                  onClick={() => {
                    setPage("login");
                    setError("");
                  }}
                >
                  Login
                </button>
              </p>
            </>
          )}
        </div>
      </div>
    );
  }

  /* PROFILE */

  if (view === "profile") {
    return (
      <div className="app">
        <header className="header">
          <div className="logo" onClick={() => setView("home")}>
            NEWS<span>HUB</span>
          </div>

          <div className="header-right">
            <button className="save-btn" onClick={openSaved}>
              ♥ Saved ({savedArticles.length})
            </button>

            <button className="logout-btn" onClick={logout}>
              Logout
            </button>
          </div>
        </header>

        <main className="content profile-page">
          <button className="back-btn" onClick={() => setView("home")}>
            ← Back to News
          </button>

          <AdSpace />

          <div className="profile-card">
            <div className="profile-top">
              <div className="profile-avatar">
                {profileImage ? (
                  <img src={profileImage} alt="Profile" />
                ) : (
                  <span>
                    {profileName ? profileName.charAt(0).toUpperCase() : "U"}
                  </span>
                )}
              </div>

              <label className="upload-btn">
                Change Photo
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleProfileImage}
                />
              </label>
            </div>

            <div className="profile-info">
              <p className="section-label">YOUR ACCOUNT</p>

              <h1>Profile Settings</h1>

              <label>Full Name</label>

              <input
                value={profileName}
                onChange={(e) => setProfileName(e.target.value)}
              />

              <label>Email Address</label>

              <input value={user.email} disabled />

              <button className="profile-save" onClick={saveProfile}>
                Save Changes
              </button>
            </div>

            <div className="profile-stats">
              <div>
                <strong>{savedArticles.length}</strong>

                <span>Saved Articles</span>
              </div>

              <div>
                <strong>{articles.length}</strong>

                <span>Stories Loaded</span>
              </div>
            </div>
          </div>
        </main>

        <footer className="footer">
          <strong>NEWSHUB</strong>

          <p>Stay informed. Stay ahead.</p>

          <small>© 2026 NewsHub</small>
        </footer>
      </div>
    );
  }

  /* ARTICLE */

  if (view === "article" && selectedArticle) {
    const isSaved = savedArticles.some(
      (item) => item.id === selectedArticle.id,
    );

    return (
      <div className="app">
        <header className="header">
          <div className="logo" onClick={() => setView("home")}>
            NEWS<span>HUB</span>
          </div>

          <div className="header-right">
            <button className="profile-btn" onClick={openProfile}>
              👤 Profile
            </button>

            <button className="save-btn" onClick={openSaved}>
              ♥ Saved ({savedArticles.length})
            </button>

            <button className="logout-btn" onClick={logout}>
              Logout
            </button>
          </div>
        </header>

        <main className="content article-page">
          <button className="back-btn" onClick={() => setView("home")}>
            ← Back to News
          </button>

          {/* AD BEFORE ARTICLE */}

          <AdSpace />

          <article className="article-detail">
            {selectedArticle.image && (
              <img
                className="article-detail-image"
                src={selectedArticle.image}
                alt=""
              />
            )}

            <div className="article-detail-content">
              <p className="news-source">
                {selectedArticle.source?.name || "News"}
              </p>

              <h1>{selectedArticle.title}</h1>

              {selectedArticle.publishedAt && (
                <p className="article-date">
                  {new Date(selectedArticle.publishedAt).toLocaleString()}
                </p>
              )}

              <p className="article-description">
                {selectedArticle.description}
              </p>

              {selectedArticle.content && (
                <p className="article-full-content">
                  {selectedArticle.content}
                </p>
              )}

              <div className="article-actions">
                <button
                  className="save-btn"
                  onClick={() => toggleSave(selectedArticle)}
                >
                  {isSaved ? "♥ Saved" : "♡ Save Article"}
                </button>

                <a
                  className="read-btn"
                  href={selectedArticle.url}
                  target="_blank"
                  rel="noreferrer"
                >
                  Read Original Story →
                </a>
              </div>
            </div>
          </article>

          {/* AD AFTER ARTICLE */}

          <AdSpace />
        </main>

        <footer className="footer">
          <strong>NEWSHUB</strong>

          <p>Stay informed. Stay ahead.</p>

          <small>© 2026 NewsHub</small>
        </footer>
      </div>
    );
  }

  /* SAVED ARTICLES */

  if (view === "saved") {
    return (
      <div className="app">
        <header className="header">
          <div className="logo" onClick={() => setView("home")}>
            NEWS<span>HUB</span>
          </div>

          <div className="header-right">
            <button className="profile-btn" onClick={openProfile}>
              👤 Profile
            </button>

            <button className="logout-btn" onClick={logout}>
              Logout
            </button>
          </div>
        </header>

        <main className="content">
          <button className="back-btn" onClick={() => setView("home")}>
            ← Back to News
          </button>

          <AdSpace />

          <div className="section-heading">
            <div>
              <p className="section-label">YOUR COLLECTION</p>

              <h2>Saved Articles</h2>
            </div>
          </div>

          {savedArticles.length === 0 ? (
            <div className="empty">You haven't saved any articles yet.</div>
          ) : (
            <div className="news-grid">
              {savedArticles.map((article) => (
                <article className="news-card" key={article.id}>
                  {article.image && (
                    <img className="news-image" src={article.image} alt="" />
                  )}

                  <div className="news-content">
                    <p className="news-source">
                      {article.source?.name || "News"}
                    </p>

                    <h3 className="news-title">{article.title}</h3>

                    <p className="news-description">{article.description}</p>

                    <div className="news-actions">
                      <button
                        className="save-btn"
                        onClick={() => toggleSave(article)}
                      >
                        ♥ Saved
                      </button>

                      <button
                        className="read-btn"
                        onClick={() => openArticle(article)}
                      >
                        Read Story →
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}

          <AdSpace />
        </main>

        <footer className="footer">
          <strong>NEWSHUB</strong>

          <p>Stay informed. Stay ahead.</p>

          <small>© 2026 NewsHub</small>
        </footer>
      </div>
    );
  }

  /* HOME */

  return (
    <div className="app">
      <header className="header">
        <div className="logo" onClick={() => setView("home")}>
          NEWS<span>HUB</span>
        </div>

        <div className="header-right">
          <span className="user-name">Hi, {user.name}</span>

          <button className="profile-btn" onClick={openProfile}>
            👤 Profile
          </button>

          <button className="save-btn" onClick={openSaved}>
            ♥ Saved ({savedArticles.length})
          </button>

          <button className="logout-btn" onClick={logout}>
            Logout
          </button>
        </div>
      </header>

      <nav className="nav">
        {[
          "general",
          "world",
          "technology",
          "sports",
          "business",
          "entertainment",
          "health",
        ].map((item) => (
          <button
            key={item}
            className={category === item ? "active" : ""}
            onClick={() => {
              setCategory(item);
              setView("home");
            }}
          >
            {item.charAt(0).toUpperCase() + item.slice(1)}
          </button>
        ))}
      </nav>

      <section className="hero">
        <div>
          <p className="hero-label">NEWS • WORLDWIDE</p>

          <h1>
            Stay informed.
            <br />
            Stay ahead.
          </h1>

          <p className="hero-text">
            Discover the latest stories from Nigeria and around the world.
          </p>
        </div>
      </section>

      <form className="search-area" onSubmit={handleSearch}>
        <input
          type="text"
          placeholder="Search for news..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <button type="submit">Search</button>
      </form>

      {/* MAIN HOME AD */}

      <AdSpace />

      <main className="content">
        <div className="section-heading">
          <div>
            <p className="section-label">LATEST STORIES</p>

            <h2>Top Stories</h2>
          </div>

          <button className="refresh-btn" onClick={getNews}>
            ↻ Refresh
          </button>
        </div>

        {loading && <div className="loading">Loading latest stories...</div>}

        {error && <div className="error">{error}</div>}

        {!loading && !error && articles.length === 0 && (
          <div className="empty">No articles found.</div>
        )}

        {!loading && !error && articles.length > 0 && (
          <div className="news-grid">
            {articles.map((article) => (
              <article className="news-card" key={article.id}>
                {article.image && (
                  <img className="news-image" src={article.image} alt="" />
                )}

                <div className="news-content">
                  <p className="news-source">
                    {article.source?.name || "News"}
                  </p>

                  <h3 className="news-title">{article.title}</h3>

                  <p className="news-description">{article.description}</p>

                  <div className="news-actions">
                    <button
                      className="save-btn"
                      onClick={() => toggleSave(article)}
                    >
                      {savedArticles.some((item) => item.id === article.id)
                        ? "♥ Saved"
                        : "♡ Save"}
                    </button>

                    <button
                      className="read-btn"
                      onClick={() => openArticle(article)}
                    >
                      Read Story →
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}

        {/* SECOND HOME AD */}

        <AdSpace />
      </main>

      <footer className="footer">
        <strong>NEWSHUB</strong>

        <p>Stay informed. Stay ahead.</p>

        <small>© 2026 NewsHub</small>
      </footer>
    </div>
  );
}

export default App;
