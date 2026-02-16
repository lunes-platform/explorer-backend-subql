import sys
import os
sys.path.append(os.path.join(os.getcwd(), 'backend-py'))

from services.market_data import fetch_lunes_data
import time

print("Testing fetch_lunes_data...")
data = fetch_lunes_data()
print(f"Data received: {data}")

if data['price'] > 0:
    print("SUCCESS: Price is greater than 0")
else:
    print("WARNING: Price is 0 (might be fallback or issue)")

if data['source']:
    print(f"Source: {data['source']}")
else:
    print("ERROR: Source missing")

print("\nTesting cache (calling again immediatey)...")
start = time.time()
data2 = fetch_lunes_data()
end = time.time()
print(f"Second call took {end - start:.4f}s")

if data2 == data:
    print("SUCCESS: Data matches cached version")
else:
    print("WARNING: Data changed (cache might not be working or expired)")
