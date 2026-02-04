
import urllib.request
import json
import base64

# Local Node Config
RPC_URL = "http://192.168.1.41:8332/"
RPC_USER = 
RPC_PASS = 

def rpc(method, params=[]):
    payload = {
        "jsonrpc": "1.0",
        "id": "fetch_pizza",
        "method": method,
        "params": params
    }
    
    req = urllib.request.Request(RPC_URL)
    req.add_header('Content-Type', 'text/plain;')
    
    # Auth
    auth_str = f"{RPC_USER}:{RPC_PASS}"
    auth_bytes = auth_str.encode('ascii')
    auth_b64 = base64.b64encode(auth_bytes).decode('ascii')
    req.add_header('Authorization', f"Basic {auth_b64}")
    
    data = json.dumps(payload).encode('utf-8')
    
    try:
        with urllib.request.urlopen(req, data) as f:
            resp = json.loads(f.read().decode('utf-8'))
            if resp['error']:
                raise Exception(resp['error'])
            return resp['result']
    except Exception as e:
        print(f"RPC Error: {e}")
        return None

def main():
    print("Fetching Pizza Transaction...")
    # 1. Get Pizza Tx
    pizza_txid = "cca7507897abc89628f450e8b1e0c6fca4ec3f7b34cccf55f3f531c659ff4d79"
    pizza_tx = rpc("getrawtransaction", [pizza_txid, True])
    
    if not pizza_tx:
        print("Failed to fetch pizza tx")
        return

    # 2. Identify Parent (Major Input)
    # The pizza tx has 1 input: a1075...
    parent_txid = pizza_tx['vin'][0]['txid']
    print(f"Parent Transaction identified: {parent_txid}")
    
    parent_tx = rpc("getrawtransaction", [parent_txid, True])
    if not parent_tx:
        print("Failed to fetch parent tx")
        return
        
    inputs = parent_tx['vin']
    print(f"Processing {len(inputs)} inputs from Parent Tx...")
    
    real_utxos = []
    
    # 3. Resolve Inputs (The 'Coins' used)
    for i, vin in enumerate(inputs):
        try:
            prev_txid = vin['txid']
            prev_vout = vin['vout']
            
            # Fetch previous tx to get value/address
            prev_tx = rpc("getrawtransaction", [prev_txid, True])
            if not prev_tx: continue
            
            output = prev_tx['vout'][prev_vout]
            
            value = output['value']
            # Handle different scriptPubKey types
            addresses = []
            if 'scriptPubKey' in output:
                spk = output['scriptPubKey']
                if 'addresses' in spk:
                    addresses = spk['addresses']
                elif 'address' in spk:
                     addresses = [spk['address']]
            
            address = addresses[0] if addresses else "Unknown"
            
            real_utxos.append({
                "txid": prev_txid,
                "vout": prev_vout,
                "value": value,
                "amount": value, # Compatibility
                "height": 57000, # Approx
                "scriptPubKey": output['scriptPubKey']['hex'] if 'hex' in output['scriptPubKey'] else "",
                "address": address,
                "tag": "Pizza Input"
            })
            
            if i % 10 == 0:
                print(f"Processed {i}/{len(inputs)} inputs...")
                
        except Exception as e:
            print(f"Error processing input {i}: {e}")
            continue

    # 4. Construct Final JSON
    data = {
        "type": "address",
        "address": "1XPTgYs9xZ64oM22f7QWpZnqbL6N3Fp1xH", # Laszlo
        "balance": sum(u['value'] for u in real_utxos),
        "utxoCount": len(real_utxos),
        "utxos": real_utxos
    }
    
    print(f"Done! Saving {len(real_utxos)} real inputs.")
    
    with open("public/data/forensics/pizza.json", "w") as f:
        json.dump(data, f, indent=2)

if __name__ == "__main__":
    main()
