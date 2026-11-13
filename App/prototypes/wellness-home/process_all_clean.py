import os
import glob
from PIL import Image
import numpy as np
import rembg

BRAIN_DIR = r"C:\Users\Admin\.gemini\antigravity\brain\685e195b-af4b-4fee-8d91-49c1fcd4597d"
DEST_DIR = r"D:\botly\App\prototypes\wellness-home\assets\items"

os.makedirs(DEST_DIR, exist_ok=True)

ASSET_CONFIGS = [
    {
        "pattern": "garden_pot_terracotta_01_*.jpg",
        "filenames": ["garden-pot-terracotta-01.png", "flower_pot_01.png"],
        "name": "Terracotta Pot"
    },
    {
        "pattern": "garden_bench_wood_01_*.jpg",
        "filenames": ["garden-bench-wood-01.png", "wooden_bench_01.png"],
        "name": "Wooden Bench"
    },
    {
        "pattern": "indoor_plant_pot_01_*.jpg",
        "filenames": ["indoor-plant-pot-01.png", "flower_pot_02.png"],
        "name": "Monstera Indoor Pot"
    },
    {
        "pattern": "garden_chair_wood_01_*.jpg",
        "filenames": ["garden-chair-wood-01.png", "outdoor_chair_01.png"],
        "name": "Outdoor Wood Chair"
    },
    {
        "pattern": "indoor_coffee_table_01_*.jpg",
        "filenames": ["indoor-coffee-table-01.png", "outdoor_table_01.png"],
        "name": "Coffee Table"
    },
    {
        "pattern": "garden_lantern_metal_01_*.jpg",
        "filenames": ["garden-lantern-metal-01.png", "garden_lantern_01.png"],
        "name": "Garden Lantern"
    },
    {
        "pattern": "garden_watering_can_01_*.jpg",
        "filenames": ["garden-watering-can-01.png", "watering_can_01.png"],
        "name": "Watering Can"
    },
    {
        "pattern": "indoor_rug_area_01_v2_*.jpg",
        "filenames": ["indoor-rug-area-01.png", "rug_01.png"],
        "name": "Indoor Rug"
    },
    {
        "pattern": "indoor_armchair_01_*.jpg",
        "filenames": ["indoor-armchair-01.png", "armchair_01.png"],
        "name": "Indoor Armchair"
    },
    {
        "pattern": "indoor_table_lamp_01_*.jpg",
        "filenames": ["indoor-table-lamp-01.png", "table_lamp_01.png"],
        "name": "Table Lamp"
    }
]

print("Initializing rembg session with u2net (full)...")
session = rembg.new_session("u2net")

for item in ASSET_CONFIGS:
    matches = glob.glob(os.path.join(BRAIN_DIR, item["pattern"]))
    if not matches:
        print(f"Warning: No source file found matching {item['pattern']}")
        continue
    
    src_path = matches[0]
    print(f"\nProcessing {item['name']} from {os.path.basename(src_path)}...")
    raw_img = Image.open(src_path).convert("RGB")
    
    # 1. Run rembg with u2net full model
    cutout = rembg.remove(raw_img, session=session)
    arr = np.array(cutout)
    
    # 2. De-fringe: remove white studio bleed on semi-transparent edge pixels
    alpha = arr[:, :, 3].astype(np.float32) / 255.0
    r = arr[:, :, 0].astype(np.float32)
    g = arr[:, :, 1].astype(np.float32)
    b = arr[:, :, 2].astype(np.float32)
    
    # Mathematical un-mixing of white background
    semi = (alpha > 0.04) & (alpha < 0.98)
    r[semi] = np.clip((r[semi] - (1.0 - alpha[semi]) * 255.0) / np.maximum(alpha[semi], 0.08), 0, 255)
    g[semi] = np.clip((g[semi] - (1.0 - alpha[semi]) * 255.0) / np.maximum(alpha[semi], 0.08), 0, 255)
    b[semi] = np.clip((b[semi] - (1.0 - alpha[semi]) * 255.0) / np.maximum(alpha[semi], 0.08), 0, 255)
    
    # Eliminate residual stray noise
    alpha[alpha < 0.06] = 0.0
    
    cleaned_arr = np.dstack([
        r.astype(np.uint8),
        g.astype(np.uint8),
        b.astype(np.uint8),
        (alpha * 255.0).astype(np.uint8)
    ])
    cleaned_img = Image.fromarray(cleaned_arr, mode="RGBA")
    
    # 3. Tight bounding box crop with minimal 4px margin
    bbox = cleaned_img.getbbox()
    if bbox:
        pad = 4
        w, h = cleaned_img.size
        bbox = (max(0, bbox[0]-pad), max(0, bbox[1]-pad), min(w, bbox[2]+pad), min(h, bbox[3]+pad))
        final_img = cleaned_img.crop(bbox)
    else:
        final_img = cleaned_img
        
    print(f"Final size: {final_img.size}")
    for fname in item["filenames"]:
        dest_path = os.path.join(DEST_DIR, fname)
        final_img.save(dest_path, "PNG", optimize=True)
        print(f" -> Saved {fname}")

print("\nAll 10 assets cleanly processed with u2net full!")
