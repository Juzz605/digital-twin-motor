const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGODB_URI);

const MotorSchema = new mongoose.Schema({
  temperature: Number,
  vibration: Number,
  rpm: Number,
  load: Number,
  timestamp: { type: Date, default: Date.now },
  status: String
});

const Motor = mongoose.model("Motor", MotorSchema);

const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

function healthModel({ temperature, vibration, load }) {
  let score = 0;
  if (temperature > 90) score += 2;
  if (vibration > 6) score += 2;
  if (load > 85) score += 1;

  if (score >= 4) return "FAILURE_RISK";
  if (score >= 2) return "WARNING";
  return "NORMAL";
}

/* 🔥 INGEST (REAL DATA) */
app.post("/ingest", async (req, res) => {
  let { temperature, vibration, rpm, load } = req.body;

  temperature = clamp(temperature, 30, 120);
  vibration = clamp(vibration, 0, 10);
  load = clamp(load, 0, 100);

  const status = healthModel({ temperature, vibration, load });

  const doc = await Motor.create({
    temperature,
    vibration,
    rpm,
    load,
    status
  });

  res.json(doc);
});

/* 🔮 WHAT-IF SIMULATION */
app.post("/whatif", (req, res) => {
  let { load, rpm = 1480 } = req.body;

  load = clamp(load, 0, 100);

  const temperature = clamp(60 + load * 0.6, 30, 120);
  const vibration = clamp(1.2 + load * 0.04, 0, 10);

  const status = healthModel({ temperature, vibration, load });

  res.json({
    temperature,
    vibration,
    rpm,
    load,
    status
  });
});

/* 📊 DASHBOARD DATA */
app.get("/data", async (_, res) => {
  const data = await Motor.find().sort({ timestamp: -1 }).limit(200);
  res.json(data.reverse());
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log("Backend running on", PORT));