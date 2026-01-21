const mongoose = require("mongoose");

const ProductSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "name is required"],
      trim: true,
      minlength: [2, "name must be at least 2 characters"],
    },
    sku: {
      type: String,
      required: [true, "sku is required"],
      trim: true,
      uppercase: true,
      unique: true,
    },
    price: {
      type: Number,
      required: [true, "price is required"],
      min: [0, "price must be >= 0"],
    },
    currency: {
      type: String,
      required: [true, "currency is required"],
      enum: ["EUR", "USD"],
      default: "EUR",
    },
    inStock: {
      type: Boolean,
      default: true,
    },
    quantity: {
      type: Number,
      required: [true, "quantity is required"],
      min: [0, "quantity must be >= 0"],
    },
    tags: {
      type: [String],
      default: [],
    },
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: [true, "categoryId is required"],
    },
  },
  { versionKey: false, timestamps: true }
);

module.exports = mongoose.model("Product", ProductSchema);
