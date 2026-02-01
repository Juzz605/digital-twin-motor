import time
import random
import requests

API_URL = "https://digital-twin-motor.onrender.com/ingest"

RPM = 1480

# ✅ CONSTANT BASELINES (NEVER MUTATE)
BASE_TEMP = 60.0          # °C
BASE_VIBRATION = 1.2      # mm/s

def clamp(v, min_v, max_v):
    return max(min_v, min(max_v, v))

while True:
    load = random.randint(20, 80)

    # ✅ Physics-inspired model
    temperature = (
        BASE_TEMP
        + (load * 0.5)          # load → heat
        + random.uniform(-1.5, 1.5)
    )

    vibration = (
        BASE_VIBRATION
        + (load * 0.03)         # load → vibration
        + random.uniform(-0.1, 0.1)
    )

    # ✅ HARD SAFETY LIMITS (MANDATORY)
    temperature = clamp(temperature, 30, 120)
    vibration = clamp(vibration, 0, 10)

    data = {
        "temperature": round(temperature, 2),
        "vibration": round(vibration, 2),
        "rpm": RPM,
        "load": load
    }

    print(data)
    requests.post(API_URL, json=data, timeout=5)
    time.sleep(2)