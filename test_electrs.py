import requests
import sys

url = "http://192.168.1.41:3002/blocks/tip/height"
print(f"Testing connectivity to {url}...")

try:
    response = requests.get(url, timeout=5)
    if response.status_code == 200:
        print(f"SUCCESS: Height is {response.text}")
    else:
        print(f"ERROR: Status {response.status_code}")
except Exception as e:
    print(f"EXCEPTION: {e}")
