const express = require("express");
const Category = require("../models/Category");

const router = express.Router();

// ---- AUTH GUARD ----
function ensureAuth(req, res, next) {
  if (req.isAuthenticated && req.isAuthenticated()) {
    return next();
  }
  return res.status(401).json({ message: "Authentication required" });
}

// ---- HELPERS ----
function httpError(statusCode, message, errors) {
  const err = new Error(message);
  err.statusCode = statusCode;
  if (errors) err.errors = errors;
  return err;
}

const REQUIRED = ["name", "description"];
function missingFields(body) {
  return REQUIRED.filter(
    (f) =>
      body?.[f] === undefined ||
      body?.[f] === null ||
      String(body[f]).trim() === ""
  );
}

// ---- ROUTES ----

// GET all (PUBLIC)
router.get("/", async (req, res, next) => {
  try {
    const categories = await Category.find().lean();
    res.status(200).json(categories);
  } catch (err) {
    next(err);
  }
});

// GET by id (PUBLIC)
router.get("/:id", async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.id).lean();
    if (!category) return next(httpError(404, "Category not found"));
    res.status(200).json(category);
  } catch (err) {
    next(err);
  }
});

// POST create (PROTECTED + VALIDATION)
router.post("/", ensureAuth, async (req, res, next) => {
  try {
    const missing = missingFields(req.body);
    if (missing.length) {
      return next(
        httpError(400, `Missing required fields: ${missing.join(", ")}`)
      );
    }

    const created = await Category.create({
      name: String(req.body.name).trim(),
      description: String(req.body.description).trim(),
    });

    res.status(201).json({ id: created._id });
  } catch (err) {
    next(err);
  }
});

// PUT update (PROTECTED + VALIDATION)
router.put("/:id", ensureAuth, async (req, res, next) => {
  try {
    const missing = missingFields(req.body);
    if (missing.length) {
      return next(
        httpError(400, `Missing required fields: ${missing.join(", ")}`)
      );
    }

    const updated = await Category.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          name: String(req.body.name).trim(),
          description: String(req.body.description).trim(),
        },
      },
      { runValidators: true }
    );

    if (!updated) return next(httpError(404, "Category not found"));
    res.sendStatus(204);
  } catch (err) {
    next(err);
  }
});

// DELETE (PROTECTED)
router.delete("/:id", ensureAuth, async (req, res, next) => {
  try {
    const deleted = await Category.findByIdAndDelete(req.params.id);
    if (!deleted) return next(httpError(404, "Category not found"));
    res.sendStatus(204);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
