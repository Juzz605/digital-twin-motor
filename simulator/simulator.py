import random
import time
import requests

API_URL = "https://digital-twin-motor.onrender.com/ingest"

def generate_motor_data():
    load = random.randint(30, 95)
    rpm = random.randint(900, 1800)

    temperature = round(35 + load * 0.5 + random.uniform(-2, 3), 2)
    vibration = round(0.8 + load * 0.03 + random.uniform(-0.2, 0.3), 2)

    status = "HEALTHY"
    if temperature > 85 or vibration > 4:
        status = "FAILURE_RISK"

    return {
        "temperature": temperature,
        "vibration": vibration,
        "rpm": rpm,
        "load": load,
        "status": status,
        "timestamp": time.time()
    }

while True:
    data = generate_motor_data()
    try:
        requests.post(API_URL, json=data, timeout=5)
        print("Sent:", data)
    except Exception as e:
        print("Error:", e)

    time.sleep(2)