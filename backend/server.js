import express from "express";
import mongoose from "mongoose";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.error(err));

const MotorSchema = new mongoose.Schema({
  temperature: Number,
  vibration: Number,
  rpm: Number,
  load: Number,
  status: String,
  timestamp: Number
});

const Motor = mongoose.model("Motor", MotorSchema);

app.get("/", (req, res) => {
  res.send("Backend alive");
});

/* Ingest sensor data */
app.post("/ingest", async (req, res) => {
  const data = req.body;
  await Motor.create(data);
  res.json({ ok: true });
});

/* Fetch recent data */
app.get("/data", async (req, res) => {
  const data = await Motor.find().sort({ timestamp: -1 }).limit(50);
  res.json(data.reverse());
});

/* WHAT-IF simulation */
app.post("/simulate", (req, res) => {
  const { load, rpm, power } = req.body;

  const temperature = 30 + load * 0.6 + power * 0.4;
  const vibration = 0.7 + load * 0.04 + rpm / 3000;

  const failureRisk =
    temperature > 85 || vibration > 4 ? "HIGH" : "LOW";

  res.json({
    input: { load, rpm, power },
    predicted: {
      temperature: Number(temperature.toFixed(2)),
      vibration: Number(vibration.toFixed(2)),
      failureRisk
    }
  });
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log("Backend running on port", PORT);
});