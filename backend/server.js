require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const app = express();
app.use(cors({ origin: "http://localhost:5173", credentials: true }));
app.use(express.json());

// ==========================================
// 1. DATABASE CONNECTION
// ==========================================
const MONGODB_URI =
  process.env.MONGODB_URI ||
  "mongodb://127.0.0.1:27017/airliquide_smart_factory";
mongoose
  .connect(MONGODB_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.error("❌ MongoDB Error:", err));

// ==========================================
// 2. DATABASE MODELS
// ==========================================
const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: {
    type: String,
    enum: ["admin", "logistics", "laboratory", "production", "distribution"],
    default: "admin",
  },
  fullName: String,
});
const User = mongoose.model("User", UserSchema);

const BatchSchema = new mongoose.Schema({
  lotId: { type: String, required: true, unique: true },
  gasId: { type: String, required: true },
  type: { type: String, enum: ["RM", "FP", "CITERNE"], default: "RM" },
  party: { type: String, required: true },
  status: { type: String, required: true },
  quantity: String,
  supplier: String,
  equipe: String,
  citerneType: String,
  client: { type: String, default: "Internal" },
  date: { type: Date, default: Date.now },
  labResults: { purity: Number, co: Number, co2: Number, h2o: Number },
  history: [
    {
      action: String,
      performedBy: String,
      timestamp: { type: Date, default: Date.now },
    },
  ],
});
const Batch = mongoose.model("Batch", BatchSchema);

// NEW: Settings Model for persistent platform configuration
const SettingSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  value: { type: mongoose.Schema.Types.Mixed, required: true },
});
const Setting = mongoose.model("Setting", SettingSchema);

// ==========================================
// 3. AUTO-SEED DEFAULT USERS & SETTINGS
// ==========================================
const seedUsers = async () => {
  const count = await User.countDocuments();
  if (count === 0) {
    const hashedPass = await bcrypt.hash("123456", 10);
    await User.insertMany([
      {
        username: "admin",
        password: hashedPass,
        role: "admin",
        fullName: "Dr. Amine K.",
      },
      {
        username: "logistics",
        password: hashedPass,
        role: "logistics",
        fullName: "Logistics Team",
      },
      {
        username: "laboratory",
        password: hashedPass,
        role: "laboratory",
        fullName: "Lab Team",
      },
      {
        username: "production",
        password: hashedPass,
        role: "production",
        fullName: "Production Team",
      },
      {
        username: "distribution",
        password: hashedPass,
        role: "distribution",
        fullName: "Distribution Team",
      },
    ]);
    console.log("🌱 Default users created! (Password for all is: 123456)");
  }
};

const seedSettings = async () => {
  const count = await Setting.countDocuments();
  if (count === 0) {
    await Setting.insertMany([
      { key: "language", value: "en" }, // Default language: English
      { key: "companyName", value: "Air Liquide Medical" },
      { key: "quarantineDays", value: 3 },
    ]);
    console.log("🌱 Default platform settings created!");
  }
};

seedUsers();
seedSettings();

// ==========================================
// 4. MIDDLEWARE
// ==========================================
const authenticate = (req, res, next) => {
  const token = req.header("Authorization")?.replace("Bearer ", "");
  if (!token) return res.status(401).json({ error: "Access denied" });
  try {
    req.user = jwt.verify(
      token,
      process.env.JWT_SECRET || "super_secret_internship_key",
    );
    next();
  } catch (err) {
    res.status(400).json({ error: "Invalid token" });
  }
};

const authorize =
  (...roles) =>
  (req, res, next) => {
    if (!roles.includes(req.user.role))
      return res.status(403).json({ error: "Forbidden" });
    next();
  };

// ==========================================
// 5. API ROUTES
// ==========================================

// --- Auth ---
app.post("/api/auth/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (!user) return res.status(400).json({ error: "User not found" });

    const validPass = await bcrypt.compare(password, user.password);
    if (!validPass) return res.status(400).json({ error: "Invalid password" });

    const token = jwt.sign(
      {
        id: user._id,
        username: user.username,
        role: user.role,
        fullName: user.fullName,
      },
      process.env.JWT_SECRET || "super_secret_internship_key",
      { expiresIn: "24h" },
    );
    res.json({
      token,
      user: {
        username: user.username,
        role: user.role,
        fullName: user.fullName,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Batches ---
app.get("/api/batches", authenticate, async (req, res) => {
  try {
    const { gasId, party } = req.query;
    const filter = {};
    if (gasId && gasId !== "all") filter.gasId = gasId;
    if (party) filter.party = party;
    const batches = await Batch.find(filter).sort({ date: -1 });
    res.json(batches);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post(
  "/api/batches",
  authenticate,
  authorize("admin", "logistics"),
  async (req, res) => {
    try {
      let finalLotId = req.body.lotId;

      // 🔒 BACKEND VALIDATION:
      // If the user is NOT an admin, force auto-generation of the lotId.
      // This prevents non-admins from submitting custom or malicious batch numbers via API.
      if (req.user.role !== "admin") {
        const date = new Date();
        const yy = String(date.getFullYear()).slice(-2);
        const mm = String(date.getMonth() + 1).padStart(2, "0");
        const dd = String(date.getDate()).padStart(2, "0");
        const seq = String(Math.floor(Math.random() * 90) + 10);

        if (req.body.isCiterne && req.body.gasId === "O2") {
          finalLotId = `${req.body.gasId}-${yy}-${mm}-${dd}-${req.body.citerneType || "3C"}-${seq}`;
        } else {
          finalLotId = `${req.body.gasId}-${yy}-${mm}-${dd}-${seq}`;
        }
      }

      const newBatch = new Batch({
        ...req.body,
        lotId: finalLotId, // <-- Enforce the validated/generated lotId
        party: req.body.party || "logistics",
        status: req.body.status || "received",
        history: [{ action: "Created", performedBy: req.user.fullName }],
      });

      await newBatch.save();
      res.status(201).json(newBatch);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
);

app.patch("/api/batches/:id/move", authenticate, async (req, res) => {
  try {
    const { nextParty, newStatus, ...updates } = req.body;
    const batch = await Batch.findOne({ lotId: req.params.id });
    if (!batch) return res.status(404).json({ error: "Batch not found" });

    if (nextParty) batch.party = nextParty;
    if (newStatus) batch.status = newStatus;
    Object.assign(batch, updates);

    batch.history.push({
      action: nextParty ? `Moved to ${nextParty}` : "Updated",
      performedBy: req.user.fullName,
    });
    await batch.save();
    res.json(batch);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post(
  "/api/batches/produce",
  authenticate,
  authorize("admin", "production"),
  async (req, res) => {
    try {
      const { rmLotId, fpLotId, gasId, equipe, quantity } = req.body;
      const rmBatch = await Batch.findOne({ lotId: rmLotId });

      if (rmBatch) {
        rmBatch.status = "processed";
        rmBatch.history.push({
          action: "Processed into FP",
          performedBy: req.user.fullName,
        });
        await rmBatch.save();
      }

      const newFP = new Batch({
        lotId: fpLotId,
        gasId,
        type: "FP",
        party: "fp_lab",
        status: "pending",
        equipe,
        quantity,
        date: new Date(),
        history: [
          {
            action: `Produced from RM ${rmLotId}`,
            performedBy: req.user.fullName,
          },
        ],
      });
      await newFP.save();
      res.status(201).json(newFP);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
);

app.patch(
  "/api/batches/:id/lab",
  authenticate,
  authorize("admin", "laboratory"),
  async (req, res) => {
    try {
      const { purity, co, co2, h2o } = req.body;
      const batch = await Batch.findOne({ lotId: req.params.id });
      if (!batch) return res.status(404).json({ error: "Batch not found" });

      batch.labResults = { purity, co, co2, h2o };
      batch.status = "ready";
      batch.history.push({
        action: "Lab results submitted",
        performedBy: req.user.fullName,
      });
      await batch.save();
      res.json(batch);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
);

app.patch(
  "/api/batches/:id/reject",
  authenticate,
  authorize("admin", "laboratory"),
  async (req, res) => {
    try {
      const batch = await Batch.findOne({ lotId: req.params.id });
      if (!batch) return res.status(404).json({ error: "Batch not found" });

      batch.status = "rejected";
      batch.history.push({
        action: "Rejected and quarantined",
        performedBy: req.user.fullName,
      });
      await batch.save();
      res.json(batch);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
);

// --- Settings (NEW) ---
app.get("/api/settings", authenticate, async (req, res) => {
  try {
    const settings = await Setting.find();
    // Convert array of {key, value} to a simple object { key: value } for easy frontend consumption
    const settingsObj = {};
    settings.forEach((s) => {
      settingsObj[s.key] = s.value;
    });
    res.json(settingsObj);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.patch(
  "/api/settings",
  authenticate,
  authorize("admin"),
  async (req, res) => {
    try {
      const updates = req.body;
      // Loop through all provided keys and update them in the DB
      for (const [key, value] of Object.entries(updates)) {
        await Setting.findOneAndUpdate(
          { key },
          { value },
          { upsert: true, new: true }, // Creates the setting if it doesn't exist yet
        );
      }
      res.json({ message: "Settings updated successfully" });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
);

// --- Users Management (Admin Only) ---
app.get("/api/users", authenticate, authorize("admin"), async (req, res) => {
  try {
    // Fetch all users but exclude the password hash from the response
    const users = await User.find().select("-password");
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.patch(
  "/api/users/:id",
  authenticate,
  authorize("admin"),
  async (req, res) => {
    try {
      const { password, fullName } = req.body;
      const updateData = {};

      if (fullName) updateData.fullName = fullName;
      if (password) {
        // Hash the new password before saving
        updateData.password = await bcrypt.hash(password, 10);
      }

      const updatedUser = await User.findByIdAndUpdate(
        req.params.id,
        updateData,
        { new: true },
      ).select("-password");

      if (!updatedUser)
        return res.status(404).json({ error: "User not found" });

      res.json(updatedUser);
      console.log(
        `✅ User ${updatedUser.username} updated by ${req.user.fullName}`,
      );
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
);

// ==========================================
// 6. START SERVER
// ==========================================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(`🚀 Server running on http://localhost:${PORT}`),
);
