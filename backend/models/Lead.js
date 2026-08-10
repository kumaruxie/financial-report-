const mongoose = require("mongoose");

const leadSchema = new mongoose.Schema({
  name:            { type: String, required: true },
  email:           { type: String, default: "" },
  mobile:          { type: String, default: "" },
  age:             { type: String, default: "" },
  income:          { type: String, default: "0" },
  expenses:        { type: String, default: "0" },
  savings:         { type: String, default: "0" },
  city:            { type: String, default: "" },
  retirementAge:   { type: String, default: "60" },
  termInsurance:   { type: String, default: "no" },
  termAmount:      { type: String, default: "0" },
  healthInsurance: { type: String, default: "no" },
  healthAmount:    { type: String, default: "0" },
  goals:           { type: Array, default: [] },
  pdfUrl:          { type: String, default: null },
}, {
  timestamps: true
});

module.exports = mongoose.model("Lead", leadSchema);
