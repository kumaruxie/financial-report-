const mongoose = require("mongoose");

const auditLogSchema = new mongoose.Schema({
  type:    { type: String, required: true },
  user:    { type: String, default: "Anonymous" },
  status:  { type: String, default: "Success" },
  details: { type: String, default: "" },
}, {
  timestamps: true
});

module.exports = mongoose.model("AuditLog", auditLogSchema);
