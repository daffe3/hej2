const express = require("express");
const cookieParser = require("cookie-parser");
const { Pool } = require("pg");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const cors = require("cors");
require("dotenv").config();

const app = express();
const PORT = 5000;

const pool = new Pool({
  host: process.env.PG_HOST,
  port: process.env.PG_PORT,
  user: process.env.PG_USER,
  password: process.env.PG_PASSWORD,
  database: process.env.PG_DATABASE,
});

app.use(cors({
  origin: "https://todo-teal-chi-90.vercel.app/",
  credentials: true,
}));

app.use(express.json());
app.use(cookieParser());

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: "Ingen token" });

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.id;
    next();
  } catch {
    res.status(401).json({ error: "Ogiltig token" });
  }
};

app.post("/register", async (req, res) => {
  const { username, password } = req.body;

  try {
    const hash = await bcrypt.hash(password, 10);
    await pool.query(
      "INSERT INTO users (username, password_hash) VALUES ($1, $2)",
      [username, hash]
    );
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: "Användarnamnet är upptaget" });
  }
});

app.post("/login", async (req, res) => {
  const { username, password } = req.body;

  try {
    const result = await pool.query(
      "SELECT * FROM users WHERE username = $1",
      [username]
    );
    const user = result.rows[0];

    if (!user || !user.password_hash) {
      return res.status(400).json({ error: "Fel användarnamn eller lösenord" });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(400).json({ error: "Fel användarnamn eller lösenord" });
    }

    const accessToken = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
      expiresIn: "15m",
    });

    const refreshToken = jwt.sign({ id: user.id }, process.env.JWT_REFRESH_SECRET, {
      expiresIn: "7d",
    });

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({ accessToken });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Något gick fel" });
  }
});

app.post("/refresh-token", (req, res) => {
  const token = req.cookies.refreshToken;
  if (!token) return res.status(401).json({ error: "Ingen refresh token" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    const newAccessToken = jwt.sign({ id: decoded.id }, process.env.JWT_SECRET, {
      expiresIn: "15m",
    });
    res.json({ accessToken: newAccessToken });
  } catch {
    res.status(403).json({ error: "Ogiltig refresh token" });
  }
});

app.post("/logout", (req, res) => {
  res.clearCookie("refreshToken", { httpOnly: true, sameSite: "strict" });
  res.json({ success: true });
});

app.get("/profile", authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT username FROM users WHERE id = $1",
      [req.userId]
    );
    const user = result.rows[0];
    if (!user) return res.status(404).json({ error: "Användare hittades inte" });

    res.json({ username: user.username });
  } catch {
    res.status(401).json({ error: "Ogiltig token" });
  }
});

app.put("/profile/password", authMiddleware, async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  try {
    const result = await pool.query(
      "SELECT password_hash FROM users WHERE id = $1",
      [req.userId]
    );
    const user = result.rows[0];
    if (!user) return res.status(404).json({ error: "Användare hittades inte" });

    const isMatch = await bcrypt.compare(oldPassword, user.password_hash);
    if (!isMatch) return res.status(400).json({ error: "Fel gammalt lösenord" });

    const newHash = await bcrypt.hash(newPassword, 10);
    await pool.query(
      "UPDATE users SET password_hash = $1 WHERE id = $2",
      [newHash, req.userId]
    );

    res.json({ success: true, message: "Lösenord uppdaterat" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Kunde inte uppdatera lösenord" });
  }
});

app.delete("/profile", authMiddleware, async (req, res) => {
  try {
    await pool.query("DELETE FROM todos WHERE user_id = $1", [req.userId]);
    await pool.query("DELETE FROM users WHERE id = $1", [req.userId]);

    res.json({ success: true, message: "Användare borttagen" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Kunde inte ta bort användare" });
  }
});

app.get("/todos", authMiddleware, async (req, res) => {
  console.log("GET /todos called for user:", req.userId);
  try {
    const result = await pool.query(
      "SELECT * FROM todos WHERE user_id = $1 ORDER BY created_at DESC",
      [req.userId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Kunde inte hämta todos" });
  }
});

app.post("/todos", authMiddleware, async (req, res) => {
  const { text, created_at, priority = 'medel', category = null } = req.body;
  try {
    await pool.query(
      "INSERT INTO todos (user_id, text, created_at, priority, category) VALUES ($1, $2, $3, $4, $5)",
      [req.userId, text, created_at, priority, category]
    );
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Kunde inte lägga till todo" });
  }
});

app.delete("/todos/:id", authMiddleware, async (req, res) => {
  const todoId = req.params.id;
  try {
    await pool.query(
      "DELETE FROM todos WHERE id = $1 AND user_id = $2",
      [todoId, req.userId]
    );
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Kunde inte ta bort todo" });
  }
});

app.put("/todos/:id", authMiddleware, async (req, res) => {
  const todoId = req.params.id;
  const { text, priority, category, created_at } = req.body;
  try {
    await pool.query(
      "UPDATE todos SET text = $1, priority = $2, category = $3, created_at = $4 WHERE id = $5 AND user_id = $6",
      [text, priority, category, created_at, todoId, req.userId]
    );
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Kunde inte uppdatera todo" });
  }
});


app.listen(PORT, () => {
  console.log(`🚀 Servern körs på http://localhost:${PORT}`);
});
