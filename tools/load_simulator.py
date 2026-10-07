import asyncio
import httpx
import uuid
import random
import time
from datetime import datetime, timezone

API_BASE = "http://localhost:8000/events/test-event"
TOKEN = "dev_token"
N_PARTICIPANTS = 5
BATCH_SIZE = 50

class Participant:
    def __init__(self, pid: str):
        self.pid = pid
        self.lat = random.uniform(-0.01, 0.01)
        self.lng = random.uniform(-0.01, 0.01)
        self.seq = 0
        
    def step(self):
        self.seq += 1
        self.lat += random.uniform(-0.0001, 0.0001)
        self.lng += random.uniform(-0.0001, 0.0001)
        
        # 5% outage
        if random.random() < 0.05:
            return None
            
        return {
            "schema_version": "1.0",
            "record_id": str(uuid.uuid4()),
            "seq": self.seq,
            "participant_id": self.pid,
            "source_type": "gps",
            "is_simulated": True,
            "device_time": datetime.now(timezone.utc).isoformat(),
            "clock_offset_ms": 0,
            "latitude": self.lat,
            "longitude": self.lng,
            "accuracy_m": random.uniform(5.0, 15.0),
            "speed_mps": random.uniform(0.0, 1.5),
            "heading_deg": random.uniform(0, 360),
            "mock_location_flag": False,
            "movement_score": random.uniform(0.0, 1.0),
            "movement_state": "moving",
            "accel_variance": 0.0,
            "motion_intensity_raw": 0.0,
            "battery_level": 100.0,
            "gps_enabled": True,
            "network_status": "wifi",
            "app_status": "foreground"
        }

async def send_batch(client, batch):
    try:
        resp = await client.post(
            f"{API_BASE}/telemetry", 
            headers={"Authorization": f"Bearer {TOKEN}"},
            json={"records": batch}
        )
        if resp.status_code == 429:
            await asyncio.sleep(float(resp.headers.get("Retry-After", 1)))
    except Exception as e:
        pass

async def main():
    import sys
    global N_PARTICIPANTS
    if len(sys.argv) > 1:
        N_PARTICIPANTS = int(sys.argv[1])
        
    print(f"Starting simulator with {N_PARTICIPANTS} participants...")
    participants = [Participant(f"sim_{i}_{uuid.uuid4().hex[:8]}") for i in range(N_PARTICIPANTS)]
    
    async with httpx.AsyncClient(limits=httpx.Limits(max_connections=200)) as client:
        while True:
            start_t = time.time()
            tasks = []
            current_batch = []
            
            for p in participants:
                rec = p.step()
                if rec:
                    current_batch.append(rec)
                    
                if len(current_batch) >= BATCH_SIZE:
                    tasks.append(send_batch(client, current_batch))
                    current_batch = []
                    
            if current_batch:
                tasks.append(send_batch(client, current_batch))
                
            await asyncio.gather(*tasks)
            
            elapsed = time.time() - start_t
            if elapsed < 1.0:
                await asyncio.sleep(1.0 - elapsed)

if __name__ == "__main__":
    asyncio.run(main())
