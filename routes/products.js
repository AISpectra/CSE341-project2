const express = require("express");
const Product = require("../models/Product");

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

const REQUIRED = ["name", "sku", "price", "currency", "quantity", "categoryId"];

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
    const products = await Product.find().lean();
    res.status(200).json(products);
  } catch (err) {
    next(err);
  }
});

// GET by id (PUBLIC)
router.get("/:id", async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id).lean();
    if (!product) return next(httpError(404, "Product not found"));
    res.status(200).json(product);
  } catch (err) {
    next(err);
  }
});

// POST create (PROTECTED)
router.post("/", ensureAuth, async (req, res, next) => {
  try {
    const missing = missingFields(req.body);
    if (missing.length) {
      return next(
        httpError(400, `Missing required fields: ${missing.join(", ")}`)
      );
    }

    const created = await Product.create({
      name: String(req.body.name).trim(),
      sku: String(req.body.sku).trim(),
      price: Number(req.body.price),
      currency: String(req.body.currency).trim(),
      inStock: req.body.inStock !== undefined ? Boolean(req.body.inStock) : true,
      quantity: Number(req.body.quantity),
      tags: Array.isArray(req.body.tags)
        ? req.body.tags.map((t) => String(t).trim())
        : [],
      categoryId: req.body.categoryId,
    });

    res.status(201).json({ id: created._id });
  } catch (err) {
    next(err);
  }
});

// PUT update (PROTECTED)
router.put("/:id", ensureAuth, async (req, res, next) => {
  try {
    const missing = missingFields(req.body);
    if (missing.length) {
      return next(
        httpError(400, `Missing required fields: ${missing.join(", ")}`)
      );
    }

    const updated = await Product.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          name: String(req.body.name).trim(),
          sku: String(req.body.sku).trim(),
          price: Number(req.body.price),
          currency: String(req.body.currency).trim(),
          inStock:
            req.body.inStock !== undefined ? Boolean(req.body.inStock) : true,
          quantity: Number(req.body.quantity),
          tags: Array.isArray(req.body.tags)
            ? req.body.tags.map((t) => String(t).trim())
            : [],
          categoryId: req.body.categoryId,
        },
      },
      { runValidators: true }
    );

    if (!updated) return next(httpError(404, "Product not found"));
    res.sendStatus(204);
  } catch (err) {
    next(err);
  }
});

// DELETE (PROTECTED)
router.delete("/:id", ensureAuth, async (req, res, next) => {
  try {
    const deleted = await Product.findByIdAndDelete(req.params.id);
    if (!deleted) return next(httpError(404, "Product not found"));
    res.sendStatus(204);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
