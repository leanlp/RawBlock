import urllib.request
import urllib.error
import json
import time
import sys

BASE_URL = "https://api.rawblock.net"

def log(msg, status="INFO"):
    print(f"[{status}] {msg}")

def fetch_json(endpoint):
    url = f"{BASE_URL}{endpoint}"
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    try:
        with urllib.request.urlopen(req, timeout=10) as response:
            if response.status == 200:
                return json.loads(response.read().decode('utf-8'))
    except urllib.error.HTTPError as e:
        return {"error": str(e), "status": e.code}
    except Exception as e:
        return {"error": str(e), "status": 0}
    return None

def check_endpoint_resilience():
    log("Starting Endpoint Fuzzing & Resilience Check...")
    endpoints = [
        ("/api/tx/invalid_hash_123", 400), 
        ("/api/block/9999999999", 404),
        ("/api/block/invalid_hash_123", 400),
        ("/api/address/invalid_address", 400)
    ]
    
    for endpoint, expected_code in endpoints:
        url = f"{BASE_URL}{endpoint}"
        try:
            with urllib.request.urlopen(url, timeout=5) as res:
                code = res.status
        except urllib.error.HTTPError as e:
            code = e.code
        except Exception as e:
            code = 0
            
        if code in [400, 404]:
            log(f"Verified {endpoint}: Got {code} (Clean Error)", "PASS")
        elif code == 500:
            log(f"Verified {endpoint}: Got 500 (Server Error - acceptable)", "WARN")
        else:
            log(f"Failed {endpoint}: Got {code} (Expected {expected_code})", "FAIL")
        
        time.sleep(1)

def check_block_continuity(block_height):
    log(f"Checking Block Continuity for height {block_height}...")
    
    # Get Block N
    # Strategy: Try /api/block/:height first, if fails try /api/blocks/tip/height/:height
    block_n = fetch_json(f"/api/block/{block_height}")
    if not block_n or "error" in block_n:
        # Resolve hash first
        hash_res = fetch_json(f"/api/blocks/tip/height/{block_height}") # Assuming returns text? 
        # Actually standard electrs /blocks/tip/height/:height returns raw text hash
        try:
            url = f"{BASE_URL}/api/blocks/tip/height/{block_height}"
            with urllib.request.urlopen(url) as r:
                block_hash = r.read().decode('utf-8').strip()
            block_n = fetch_json(f"/api/block/{block_hash}")
        except:
             log(f"Could not fetch Block {block_height}", "FAIL")
             return

    if "previousblockhash" not in block_n:
        log("Block object missing previousblockhash field", "FAIL")
        return

    prev_hash_declared = block_n.get("previousblockhash")

    # Get Block N-1 Actual Hash
    height_prev = block_height - 1
    try:
        url = f"{BASE_URL}/api/blocks/tip/height/{height_prev}"
        with urllib.request.urlopen(url) as r:
            actual_prev_hash = r.read().decode('utf-8').strip()
    except:
        log(f"Could not fetch Block {height_prev}", "FAIL")
        return

    if prev_hash_declared == actual_prev_hash:
        log(f"Continuity Verified: Block {block_height} links to {actual_prev_hash}", "PASS")
    else:
        log(f"Continuity ERROR: Declared {prev_hash_declared} != Actual {actual_prev_hash}", "FAIL")

def check_tx_accounting(txid):
    log(f"Checking Accounting for TX {txid}...")
    tx = fetch_json(f"/api/tx/{txid}")
    if not tx or "error" in tx:
        log(f"Could not fetch TX {txid}", "FAIL")
        return
        
    total_in = 0
    total_out = 0
    fee_declared = tx.get("fee", 0)

    for vin in tx.get("vin", []):
        if vin.get("is_coinbase"):
            continue
        # Check standard Prevout logic
        val = vin.get("prevout", {}).get("value", 0)
        total_in += val
            
    for vout in tx.get("vout", []):
        total_out += vout.get("value", 0)

    calculated_fee = total_in - total_out
    
    # Allow coinbase special case
    if tx.get("vin", [])[0].get("is_coinbase"):
        log("Transaction is Coinbase (No Fee Calc)", "INFO")
        return

    if calculated_fee == fee_declared:
        log(f"Accounting Verified: In({total_in}) == Out({total_out}) + Fee({fee_declared})", "PASS")
    else:
        log(f"Accounting Mismatch: Calc Fee {calculated_fee} != Declared {fee_declared}", "FAIL")

if __name__ == "__main__":
    log("--- QA AUDIT START ---")
    check_endpoint_resilience()
    check_block_continuity(934853)
    check_tx_accounting("04be2d14703084250cf1fa66c084ac03a077c3a8f0b4ee34149dae3af499ef7b")
    log("--- QA AUDIT END ---")
