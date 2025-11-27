// Load environment variables
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const morgan = require("morgan");

// Routes
const authRoutes = require("./routes/authRoutes");
const transcriptRoutes = require("./routes/transcriptRoutes");

// Optional: custom error handler
// const errorHandler = require("./middleware/errorHandler");

const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI;
const JWT_SECRET = process.env.JWT_SECRET;

// --- Validate environment variables ---
if (!MONGODB_URI) {
  console.error("❌ ERROR: MONGODB_URI is missing in .env");
  process.exit(1);
}
if (!JWT_SECRET) {
  console.error("❌ ERROR: JWT_SECRET is missing in .env");
  process.exit(1);
}

// --- Middleware ---
app.use(cors());
app.use(morgan("tiny"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// --- Static files ---
app.use("/public", express.static(path.join(__dirname, "public")));

// --- Health check route ---
app.get("/", (req, res) => {
  res.send("🚀 API is working!");
});

// --- API Routes ---
app.use("/api/auth", authRoutes);
app.use("/api", transcriptRoutes);

// --- Error handler middleware ---
// app.use(errorHandler);

// --- Start server after MongoDB connection ---
async function startServer() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("✅ MongoDB Connected Successfully");

    // Optional: Test collection and document
    const db = mongoose.connection.db;
    const collections = await db.listCollections({ name: "Test" }).toArray();
    if (collections.length === 0) {
      await db.createCollection("Test");
      console.log("📁 Test collection created");
    }

    const Test = mongoose.model("Test", new mongoose.Schema({ name: String }));
    const exists = await Test.findOne({ name: "DB test" });
    if (!exists) {
      await Test.create({ name: "DB test" });
      console.log("📝 Test document inserted");
    }

    // Start Express server
    app.listen(PORT, () => {
      console.log(`🚀 Backend running on port ${PORT}`);
    });
  } catch (err) {
    console.error("❌ MongoDB Connection Error:", err);
    process.exit(1);
  }
}

// Start server
startServer();
