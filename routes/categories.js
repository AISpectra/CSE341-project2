const express = require("express");
const Category = require("../models/Category");

const router = express.Router();

function httpError(statusCode, message, errors) {
  const err = new Error(message);
  err.statusCode = statusCode;
  if (errors) err.errors = errors;
  return err;
}

// GET all
router.get("/", async (req, res, next) => {
  try {
    const categories = await Category.find().lean();
    res.status(200).json(categories);
  } catch (err) {
    next(err);
  }
});

// GET by id
router.get("/:id", async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.id).lean();
    if (!category) return next(httpError(404, "Category not found"));
    res.status(200).json(category);
  } catch (err) {
    next(err);
  }
});

// POST create
router.post("/", async (req, res, next) => {
  try {
    const created = await Category.create({
      name: String(req.body.name || "").trim(),
      description: String(req.body.description || "").trim(),
    });

    res.status(201).json({ id: created._id });
  } catch (err) {
    next(err);
  }
});

// PUT update
router.put("/:id", async (req, res, next) => {
  try {
    const updated = await Category.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          name: String(req.body.name || "").trim(),
          description: String(req.body.description || "").trim(),
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

// DELETE
router.delete("/:id", async (req, res, next) => {
  try {
    const deleted = await Category.findByIdAndDelete(req.params.id);
    if (!deleted) return next(httpError(404, "Category not found"));
    res.sendStatus(204);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
