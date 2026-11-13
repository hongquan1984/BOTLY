import os
import glob
from PIL import Image, ImageFilter
import numpy as np
from collections import deque

BRAIN_DIR = r"C:\Users\Admin\.gemini\antigravity\brain\685e195b-af4b-4fee-8d91-49c1fcd4597d"
DEST_DIR = r"D:\botly\App\prototypes\wellness-home\assets\items"

os.makedirs(DEST_DIR, exist_ok=True)

# Map prefix to output name
ASSET_MAP = {
    "garden_pot_terracotta_01": "garden-pot-terracotta-01.png",
    "garden_chair_wood_01": "garden-chair-wood-01.png",
    "garden_bench_wood_01": "garden-bench-wood-01.png",
    "garden_lantern_metal_01": "garden-lantern-metal-01.png",
    "garden_watering_can_01": "garden-watering-can-01.png",
    "indoor_armchair_01": "indoor-armchair-01.png",
    "indoor_plant_pot_01": "indoor-plant-pot-01.png",
    "indoor_coffee_table_01": "indoor-coffee-table-01.png",
    "indoor_table_lamp_01": "indoor-table-lamp-01.png",
    "indoor_rug_area_01": "indoor-rug-area-01.png"
}

def process_file(src_path, dest_filename):
    print(f"Processing {os.path.basename(src_path)} -> {dest_filename}...")
    img = Image.open(src_path).convert('RGB')
    arr = np.array(img, dtype=np.int32)
    h, w, _ = arr.shape

    # Euclidean distance from pure white (255, 255, 255)
    dist_white = np.sqrt(np.sum((255 - arr) ** 2, axis=2))

    # Background mask via BFS from image borders
    bg_mask = np.zeros((h, w), dtype=bool)
    q = deque()
    
    # Seed outer border
    border_threshold = 42
    for x in range(w):
        if dist_white[0, x] < border_threshold:
            bg_mask[0, x] = True
            q.append((0, x))
        if dist_white[h-1, x] < border_threshold:
            bg_mask[h-1, x] = True
            q.append((h-1, x))
    for y in range(h):
        if dist_white[y, 0] < border_threshold:
            bg_mask[y, 0] = True
            q.append((y, 0))
        if dist_white[y, w-1] < border_threshold:
            bg_mask[y, w-1] = True
            q.append((y, w-1))

    flood_threshold = 36
    while q:
        y, x = q.popleft()
        for dy, dx in [(-1, 0), (1, 0), (0, -1), (0, 1)]:
            ny, nx = y + dy, x + dx
            if 0 <= ny < h and 0 <= nx < w and not bg_mask[ny, nx]:
                if dist_white[ny, nx] < flood_threshold:
                    bg_mask[ny, nx] = True
                    q.append((ny, nx))

    # Foreground alpha
    alpha = np.where(bg_mask, 0, 255).astype(np.uint8)

    # Detect contact shadow in lower 35% of image:
    # Shadow pixels are near grayscale, not pure white, but outside main object
    r, g, b = arr[:, :, 0], arr[:, :, 1], arr[:, :, 2]
    is_gray = (np.abs(r - g) < 20) & (np.abs(g - b) < 20)
    brightness = (r + g + b) / 3.0
    
    # Shadow alpha formula: darker shadow -> higher alpha, max ~180
    shadow_alpha = np.clip((250 - brightness) * 1.6, 0, 180).astype(np.uint8)
    
    # Apply shadow only in lower half where bg_mask was true
    lower_half = np.zeros((h, w), dtype=bool)
    lower_half[int(h * 0.5):, :] = True
    
    has_shadow = bg_mask & lower_half & is_gray & (brightness < 240) & (brightness > 40)
    
    # Combine: keep shadow alpha
    final_alpha = np.where(has_shadow, shadow_alpha, alpha)

    # Edge anti-aliasing
    alpha_img = Image.fromarray(final_alpha).filter(ImageFilter.GaussianBlur(radius=0.9))

    out = img.convert('RGBA')
    out.putalpha(alpha_img)

    # Tight crop
    bbox = out.getbbox()
    if bbox:
        pad = 12
        bbox = (max(0, bbox[0]-pad), max(0, bbox[1]-pad), min(w, bbox[2]+pad), min(h, bbox[3]+pad))
        out = out.crop(bbox)

    dest_path = os.path.join(DEST_DIR, dest_filename)
    out.save(dest_path, "PNG")
    print(f"  [OK] Saved {dest_filename} ({out.width}x{out.height})")

def main():
    files = glob.glob(os.path.join(BRAIN_DIR, "*.jpg"))
    for prefix, dest_name in ASSET_MAP.items():
        matching = [f for f in files if os.path.basename(f).startswith(prefix)]
        if matching:
            # pick latest
            matching.sort(key=os.path.getmtime, reverse=True)
            process_file(matching[0], dest_name)
        else:
            print(f"  Waiting for {prefix}...")

if __name__ == "__main__":
    main()
