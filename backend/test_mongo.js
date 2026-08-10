const dns = require("dns");
dns.setServers(["8.8.8.8", "1.1.1.1"]);

const mongoose = require("mongoose");

const uri = "mongodb+srv://kumaruxie_db_user:MMDK3ZWcSJ7UOSI5@clusterfinrep.ekp9nzy.mongodb.net/financial_report?retryWrites=true&w=majority";

async function run() {
  try {
    console.log("Connecting to Mongo with Google DNS...");
    await mongoose.connect(uri);
    console.log("✅ Connected successfully!");

    const Lead = mongoose.model("Lead", new mongoose.Schema({ name: String }, { timestamps: true }));

    const created = await Lead.create({ name: "Test Lead Local" });
    console.log("Created lead:", created._id);

    const leads = await Lead.find();
    console.log("Fetched leads count from DB:", leads.length);

    await mongoose.disconnect();
  } catch (err) {
    console.error("Mongo Error:", err.message);
  }
}

run();
