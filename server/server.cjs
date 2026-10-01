const path = require("path");

require("dotenv").config({
  path: path.join(__dirname, "..", ".env"),
});

const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const db = require("./database.cjs");

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

// ===============================
// TEST SERVER
// ===============================
app.get("/", (req, res) => {
  res.json({
    message: "News Hub server is working!",
  });
});

// ===============================
// SIGN UP
// ===============================
app.post("/api/auth/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    console.log("SIGNUP REQUEST RECEIVED:", req.body);

    if (!name || !email || !password) {
      return res.status(400).json({
        error: "Name, email and password are required.",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        error: "Password must be at least 6 characters.",
      });
    }

    const cleanEmail = email.toLowerCase().trim();

    const existingUser = db
      .prepare("SELECT id FROM users WHERE email = ?")
      .get(cleanEmail);

    if (existingUser) {
      return res.status(409).json({
        error: "An account with this email already exists.",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = db
      .prepare("INSERT INTO users (name, email, password) VALUES (?, ?, ?)")
      .run(name.trim(), cleanEmail, hashedPassword);

    const user = db
      .prepare("SELECT id, name, email, created_at FROM users WHERE id = ?")
      .get(result.lastInsertRowid);

    res.status(201).json({
      message: "Account created successfully.",
      user,
    });
  } catch (error) {
    console.error("SIGNUP ERROR:", error);

    res.status(500).json({
      error: "Could not create account.",
    });
  }
});

// ===============================
// LOGIN
// ===============================
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log("LOGIN REQUEST RECEIVED:", email);

    if (!email || !password) {
      return res.status(400).json({
        error: "Email and password are required.",
      });
    }

    const cleanEmail = email.toLowerCase().trim();

    const user = db
      .prepare("SELECT * FROM users WHERE email = ?")
      .get(cleanEmail);

    if (!user) {
      return res.status(401).json({
        error: "Invalid email or password.",
      });
    }

    const passwordMatches = await bcrypt.compare(password, user.password);

    if (!passwordMatches) {
      return res.status(401).json({
        error: "Invalid email or password.",
      });
    }

    res.json({
      message: "Login successful.",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        created_at: user.created_at,
      },
    });
  } catch (error) {
    console.error("LOGIN ERROR:", error);

    res.status(500).json({
      error: "Could not log in.",
    });
  }
});

// ===============================
// NEWS
// ===============================
app.get("/api/news", async (req, res) => {
  try {
    const category = req.query.category || "general";

    if (!process.env.GNEWS_API_KEY) {
      return res.status(500).json({
        error: "GNews API key is missing.",
      });
    }

    const response = await fetch(
      `https://gnews.io/api/v4/top-headlines?category=${encodeURIComponent(
        category,
      )}&lang=en&country=ng&max=10&apikey=${process.env.GNEWS_API_KEY}`,
    );

    const data = await response.json();

    if (!response.ok || data.errors) {
      console.error("GNEWS ERROR:", data);

      return res.status(response.status || 400).json(data);
    }

    res.json(data);
  } catch (error) {
    console.error("NEWS ERROR:", error);

    res.status(500).json({
      error: "Could not get news.",
    });
  }
});

// ===============================
// SEARCH NEWS
// ===============================
app.get("/api/news/search", async (req, res) => {
  try {
    const query = req.query.q;

    if (!query) {
      return res.status(400).json({
        error: "Search query is required.",
      });
    }

    if (!process.env.GNEWS_API_KEY) {
      return res.status(500).json({
        error: "GNews API key is missing.",
      });
    }

    const response = await fetch(
      `https://gnews.io/api/v4/search?q=${encodeURIComponent(
        query,
      )}&lang=en&country=ng&max=10&apikey=${process.env.GNEWS_API_KEY}`,
    );

    const data = await response.json();

    if (!response.ok || data.errors) {
      console.error("GNEWS SEARCH ERROR:", data);

      return res.status(response.status || 400).json(data);
    }

    res.json(data);
  } catch (error) {
    console.error("SEARCH NEWS ERROR:", error);

    res.status(500).json({
      error: "Could not search news.",
    });
  }
});

// ===============================
// START SERVER
// ===============================
app.listen(PORT, () => {
  console.log("================================");
  console.log("News Hub server is running");
  console.log(`Server: http://localhost:${PORT}`);
  console.log("GNews API key loaded:", !!process.env.GNEWS_API_KEY);
  console.log("================================");
});
