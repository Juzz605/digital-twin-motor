import random
import time
import requests

API_URL = "http://localhost:5001/data"

temp = 45
vibration = 2.5
rpm = 1480
load = 35

while True:
    load += random.randint(-3, 3)
    load = max(10, min(load, 100))

    temp += load * 0.03 + random.uniform(-0.4, 0.4)
    vibration += (temp - 60) * 0.02 + random.uniform(-0.1, 0.1)

    data = {
        "temperature": round(temp, 2),
        "vibration": round(vibration, 2),
        "rpm": rpm,
        "load": load,
        "timestamp": time.time()
    }

    requests.post(API_URL, json=data)
    print(data)
    time.sleep(2)