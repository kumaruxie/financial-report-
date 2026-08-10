const mongoose = require("mongoose");

const enquirySchema = new mongoose.Schema({
  name:    { type: String, default: "Client User" },
  email:   { type: String, default: "" },
  topic:   { type: String, default: "General Enquiry" },
  message: { type: String, default: "" },
}, {
  timestamps: true
});

module.exports = mongoose.model("Enquiry", enquirySchema);
