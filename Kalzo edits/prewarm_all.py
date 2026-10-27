import json, urllib.request, time

with open('src/pages/Reels.json', 'r', encoding='utf-8') as f:
    reels = json.load(f)

print(f"Total reels to process: {len(reels)}")

for r in reels:
    src = r.get('src', '')
    if 'cloudinary.com' in src:
        clean = src.replace('.mov', '.mp4').replace('.MOV', '.mp4')
        v_url = clean.replace('/video/upload/', '/video/upload/w_720,c_limit,vc_auto,q_auto:good/')
        t_url = clean.replace('.mp4', '.jpg').replace('/video/upload/', '/video/upload/so_5,w_600,c_limit,q_auto:good,f_auto/')
        
        # 1. Warm thumbnail
        try:
            req = urllib.request.Request(t_url, headers={'User-Agent': 'Mozilla/5.0'})
            with urllib.request.urlopen(req, timeout=10) as res:
                pass
        except Exception:
            pass
            
        # 2. Warm video first chunk
        try:
            req = urllib.request.Request(v_url, headers={'User-Agent': 'Mozilla/5.0', 'Range': 'bytes=0-65535'})
            with urllib.request.urlopen(req, timeout=15) as res:
                pass
        except Exception:
            pass

print("Finished pre-warming all reels!")
