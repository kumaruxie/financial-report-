const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    mobile: { type: String, default: "" },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ["client", "advisor", "admin", "superadmin"], default: "client" },
    status: { type: String, enum: ["active", "inactive"], default: "active" },
    assignedLeadsCount: { type: Number, default: 0 },
    conversionsCount: { type: Number, default: 0 },
    lastLoginAt: { type: Date, default: null }
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.models.User || mongoose.model("User", userSchema);
