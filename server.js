require("dotenv").config();
const express = require("express");
const cors = require("cors");

const { connectToMongo } = require("./db/connect");

const productsRoutes = require("./routes/products");
const categoriesRoutes = require("./routes/categories");

const swaggerUi = require("swagger-ui-express");
const swaggerDocument = require("./swagger.json");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/health", (req, res) => res.status(200).json({ status: "ok" }));
app.get("/", (req, res) => res.send("Project 2 API is running. Visit /api-docs"));

app.use("/products", productsRoutes);
app.use("/categories", categoriesRoutes);

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// 404 route
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// error handler
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
