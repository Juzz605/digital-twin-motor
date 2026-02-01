const express = require("express")
const mongoose = require("mongoose")
const cors = require("cors")

const app = express()
app.use(cors())
app.use(express.json())

/* =======================
   MongoDB Connection
======================= */
mongoose
  .connect(
    "process.env.MONGO_URI"
  )
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.error(err))

/* =======================
   Schema
======================= */
const MotorSchema = new mongoose.Schema({
  temperature: Number,
  vibration: Number,
  rpm: Number,
  load: Number,
  timestamp: Number,
  status: String
})

const Motor = mongoose.model("Motor", MotorSchema)

/* =======================
   UTILS
======================= */

// Linear trend (learning from history)
function trend(values) {
  const n = values.length
  let sx = 0, sy = 0, sxy = 0, sx2 = 0
  for (let i = 0; i < n; i++) {
    sx += i
    sy += values[i]
    sxy += i * values[i]
    sx2 += i * i
  }
  return (n * sxy - sx * sy) / (n * sx2 - sx * sx)
}

// Mean
function mean(arr) {
  return arr.reduce((a, b) => a + b, 0) / arr.length
}

// Std deviation (for anomaly detection)
function std(arr, avg) {
  return Math.sqrt(
    arr.reduce((s, v) => s + Math.pow(v - avg, 2), 0) / arr.length
  )
}

/* =======================
   ML: HEALTH PREDICTION
======================= */
function predictHealth(history) {
  if (history.length < 20) return "LEARNING"

  const temps = history.map(d => d.temperature)
  const vibs = history.map(d => d.vibration)

  const tempTrend = trend(temps)
  const vibTrend = trend(vibs)

  if (tempTrend > 0.6 && vibTrend > 0.05) return "FAILURE LIKELY"
  if (tempTrend > 0.3 || vibTrend > 0.03) return "WARNING"

  return "HEALTHY"
}

/* =======================
   ML: ANOMALY DETECTION
======================= */
function detectAnomaly(history, current) {
  if (history.length < 20) return false

  const temps = history.map(d => d.temperature)
  const vibs = history.map(d => d.vibration)

  const tMean = mean(temps)
  const vMean = mean(vibs)
  const tStd = std(temps, tMean)
  const vStd = std(vibs, vMean)

  return (
    Math.abs(current.temperature - tMean) > 2.5 * tStd ||
    Math.abs(current.vibration - vMean) > 2.5 * vStd
  )
}

/* =======================
   WHAT-IF SIMULATION
======================= */
function simulateWhatIf(current, scenario) {
  let temp = current.temperature
  let vib = current.vibration

  for (let i = 0; i < scenario.duration / 10; i++) {
    temp += scenario.load * 0.04
    vib += temp * 0.002
  }

  let risk = "HEALTHY"
  if (temp > 90 || vib > 6) risk = "FAILURE LIKELY"
  else if (temp > 75 || vib > 5) risk = "WARNING"

  return {
    predictedTemperature: Number(temp.toFixed(2)),
    predictedVibration: Number(vib.toFixed(2)),
    risk
  }
}

/* =======================
   FUTURE PREDICTION
======================= */
function predictFuture(history, steps = 10) {
  const temps = history.map(d => d.temperature)
  const vibs = history.map(d => d.vibration)

  const tSlope = trend(temps)
  const vSlope = trend(vibs)

  let future = []
  let t = temps[temps.length - 1]
  let v = vibs[vibs.length - 1]

  for (let i = 0; i < steps; i++) {
    t += tSlope
    v += vSlope
    future.push({
      step: i + 1,
      temperature: Number(t.toFixed(2)),
      vibration: Number(v.toFixed(2))
    })
  }

  return future
}

/* =======================
   ROUTES
======================= */
app.get("/", (req, res) => {
  res.send("Digital Twin Backend is running 🚀")
})
// Ingest sensor data
app.post("/data", async (req, res) => {
  try {
    const history = await Motor.find()
      .sort({ timestamp: -1 })
      .limit(30)

    const anomaly = detectAnomaly(history, req.body)
    const health = predictHealth(history)

    const status = anomaly ? "ANOMALY" : health

    await Motor.create({
      ...req.body,
      status
    })

    res.send("Data saved")
  } catch (err) {
    res.status(500).send("Error saving data")
  }
})

// Dashboard data
app.get("/data", async (req, res) => {
  const data = await Motor.find()
    .sort({ timestamp: -1 })
    .limit(50)

  res.json(data)
})

// What-if simulation
app.post("/simulate", async (req, res) => {
  const latest = await Motor.findOne().sort({ timestamp: -1 })
  if (!latest) return res.status(400).json({ error: "No data yet" })

  const result = simulateWhatIf(latest, req.body)
  res.json(result)
})

// Future prediction
app.get("/predict/future", async (req, res) => {
  const history = await Motor.find()
    .sort({ timestamp: -1 })
    .limit(30)

  const future = predictFuture(history.reverse())
  res.json(future)
})

/* =======================
   START SERVER
======================= */
const PORT = process.env.PORT || 5001
app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`)
})