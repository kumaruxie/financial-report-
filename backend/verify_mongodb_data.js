const dns = require("dns");
dns.setServers(["8.8.8.8", "1.1.1.1"]);

const mongoose = require("mongoose");
const uri = "mongodb+srv://kumaruxie_db_user:MMDK3ZWcSJ7UOSI5@clusterfinrep.ekp9nzy.mongodb.net/financial_report?retryWrites=true&w=majority";

async function verifyMongo() {
  console.log("=== MONGODB ATLAS VERIFICATION ===");
  try {
    await mongoose.connect(uri);
    console.log("1. Connection status: SUCCESS (Connected to MongoDB Atlas)");

    const Lead = mongoose.model("Lead", new mongoose.Schema({
      name: String,
      email: String,
      mobile: String,
      city: String,
      income: String,
      createdAt: Date
    }, { timestamps: true, collection: "leads" }));

    // Insert new test lead
    const newTestLead = await Lead.create({
      name: "LIVE TEST USER - " + new Date().toISOString(),
      email: "testuser@apkacoach.com",
      mobile: "+91 9999988888",
      city: "Mumbai",
      income: "200000"
    });
    console.log("2. Inserted fresh lead directly into Atlas database with ID:", newTestLead._id);

    // Fetch all leads
    const allLeads = await Lead.find().lean();
    console.log(`3. Total documents currently stored in MongoDB Atlas 'leads' collection: ${allLeads.length}`);
    console.log("4. Full List of Documents in MongoDB Atlas:");
    allLeads.forEach((l, idx) => {
      console.log(`   [${idx + 1}] ID: ${l._id} | Name: ${l.name} | Email: ${l.email || 'N/A'} | City: ${l.city || 'N/A'}`);
    });

    await mongoose.disconnect();
    console.log("=== END VERIFICATION ===");
  } catch (err) {
    console.error("MongoDB Atlas Verification Error:", err.message);
  }
}

verifyMongo();
