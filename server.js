require("dotenv").config();
require("./auth/github"); // passport strategy setup

const express = require("express");
const cors = require("cors");
const session = require("express-session");
const passport = require("passport");

const { connectToMongo } = require("./db/connect");

const productsRoutes = require("./routes/products");
const categoriesRoutes = require("./routes/categories");

const swaggerUi = require("swagger-ui-express");
const swaggerDocument = require("./swagger.json");

const app = express();

// Needed for secure cookies behind Render proxy
app.set("trust proxy", 1);

const BASE_URL = process.env.BASE_URL || `http://localhost:${process.env.PORT || 8080}`;
const isHttps = BASE_URL.startsWith("https");

// CORS (important if Swagger / browser needs cookies)
app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Sessions (cookie-based auth)
app.use(
  session({
    secret: process.env.SESSION_SECRET || "dev_secret_change_me",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: "lax",
      secure: isHttps, // true on Render
    },
  })
);

app.use(passport.initialize());
app.use(passport.session());

// -------- Helpers --------
function ensureAuth(req, res, next) {
  // Passport adds isAuthenticated()
  if (req.isAuthenticated && req.isAuthenticated()) return next();
  return res.status(401).json({ message: "Not authenticated" });
}

// Only protect non-GET methods (GET stays public)
function protectNonGet(req, res, next) {
  if (req.method === "GET") return next();
  return ensureAuth(req, res, next);
}

// -------- Basic routes --------
app.get("/health", (req, res) => res.status(200).json({ status: "ok" }));
app.get("/", (req, res) => res.send("Project 2 API is running. Visit /api-docs"));

// -------- AUTH ROUTES --------

// Start OAuth (IMPORTANT: this is a redirect -> Swagger "Execute" often shows Failed to fetch)
app.get("/auth/github", passport.authenticate("github", { scope: ["user:email"] }));

// OAuth callback
app.get(
  "/auth/github/callback",
  passport.authenticate("github", { failureRedirect: "/auth/failed" }),
  (req, res) => {
    // After login, redirect somewhere simple
    res.redirect("/auth/success");
  }
);

app.get("/auth/success", (req, res) => {
  res.status(200).json({
    message: "Logged in",
    user: req.user?.username || req.user?.displayName || "unknown",
  });
});

app.get("/auth/failed", (req, res) => {
  res.status(401).json({ message: "Login failed" });
});

// Check current session
app.get("/auth/me", (req, res) => {
  if (!req.isAuthenticated || !req.isAuthenticated()) {
    return res.status(401).json({ message: "Not authenticated" });
  }
  return res.status(200).json({ user: req.user });
});

// Logout
app.post("/auth/logout", (req, res) => {
  req.logout(() => {
    req.session.destroy(() => {
      res.clearCookie("connect.sid");
      res.status(200).json({ message: "Logged out" });
    });
  });
});

// -------- API ROUTES (protected for POST/PUT/DELETE) --------
app.use("/products", protectNonGet, productsRoutes);
app.use("/categories", protectNonGet, categoriesRoutes);

// Swagger
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// 404
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// Error handler
app.use((err, req, res, next) => {
  console.error("❌ Error:", err);

  if (err.statusCode) {
    return res.status(err.statusCode).json({
      message: err.message,
      errors: err.errors || undefined,
    });
  }

  if (err.name === "CastError") {
    return res.status(400).json({ message: "Invalid id format" });
  }

  if (err.name === "ValidationError") {
    const details = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({ message: "Validation error", errors: details });
  }

  if (err.code === 11000) {
    return res.status(409).json({ message: "Duplicate key error", errors: err.keyValue });
  }

  res.status(500).json({ message: "Internal Server Error" });
});

const PORT = process.env.PORT || 8080;

async function start() {
  try {
    await connectToMongo(process.env.MONGODB_URI, process.env.DB_NAME);
    app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
  } catch (err) {
    console.error("❌ Failed to start server:", err);
    process.exit(1);
  }
}

start();
