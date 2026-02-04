import urllib.request
import sys

url = "http://192.168.1.41:3002/blocks/tip/height"
print(f"Testing connectivity to {url}...")

try:
    with urllib.request.urlopen(url, timeout=5) as response:
        if response.status == 200:
            print(f"SUCCESS: Height is {response.read().decode('utf-8')}")
        else:
            print(f"ERROR: Status {response.status}")
except Exception as e:
    print(f"EXCEPTION: {e}")
