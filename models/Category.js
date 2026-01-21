const mongoose = require("mongoose");

const CategorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "name is required"],
      trim: true,
      minlength: [2, "name must be at least 2 characters"],
      unique: true,
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
  },
  { versionKey: false, timestamps: true }
);

module.exports = mongoose.model("Category", CategorySchema);
