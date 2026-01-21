const mongoose = require("mongoose");

async function connectToMongo(uri, dbName) {
  if (!uri) throw new Error("Missing MongoDB connection URI");

  await mongoose.connect(uri, {
    dbName,
    serverSelectionTimeoutMS: 5000,
  });

  console.log("✅ Connected to MongoDB with Mongoose");
}

module.exports = { connectToMongo };
