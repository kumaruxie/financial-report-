require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

const authRoutes = require("./routes/auth");
const reportRoutes = require("./routes/reports");
const adminRoutes = require("./routes/admin");

const app = express();
const PORT = process.env.PORT || 5000;

// --- Middleware ---
app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));
app.use(express.json({ limit: "5mb" }));

// --- Routes ---
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/reports", reportRoutes);
app.use("/api/v1/admin", adminRoutes);

// --- Health check ---
app.get("/", (req, res) => {
  res.json({ status: "ok", message: "Wealth Compass API is running" });
});

app.get("/api/v1/health", (req, res) => {
  res.json({ status: "ok", uptime: process.uptime() });
});

// --- Start server & Connect to MongoDB if MONGO_URI or MONGODB_URI exists ---
const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI;

const startServer = () => {
  app.listen(PORT, () => {
    console.log(`🚀 Wealth Compass API Server running on port ${PORT}`);
    console.log(`   Health: http://localhost:${PORT}/`);
    console.log(`   API:    http://localhost:${PORT}/api/v1/`);
  });
};

if (MONGO_URI) {
  mongoose
    .connect(MONGO_URI)
    .then(() => {
      console.log("✅ Connected to MongoDB Atlas");
      startServer();
    })
    .catch((err) => {
      console.error("⚠️ MongoDB connection notice:", err.message);
      console.log("Starting server in standalone mode...");
      startServer();
    });
} else {
  console.log("ℹ️ MONGO_URI not set in environment. Running API server in fallback mode.");
  startServer();
}

