import os
from PIL import Image, ImageFilter

def extract_character(im, box, bg_color=(253, 241, 227), tolerance=22):
    # Crop with padding
    crop = im.crop(box).convert("RGBA")
    w, h = crop.size
    
    # Simple floodfill from corners / borders to mark background
    visited = set()
    queue = []
    
    # Add border pixels to queue
    for x in range(w):
        queue.append((x, 0))
        queue.append((x, h - 1))
    for y in range(h):
        queue.append((0, y))
        queue.append((w - 1, y))
        
    def is_bg(r, g, b):
        dr = abs(r - bg_color[0])
        dg = abs(g - bg_color[1])
        db = abs(b - bg_color[2])
        return (dr + dg + db) < tolerance * 3
        
    pixels = crop.load()
    mask = Image.new("L", (w, h), 255)
    mask_pixels = mask.load()
    
    while queue:
        cx, cy = queue.pop(0)
        if (cx, cy) in visited:
            continue
        visited.add((cx, cy))
        
        if 0 <= cx < w and 0 <= cy < h:
            r, g, b, a = pixels[cx, cy]
            if is_bg(r, g, b):
                mask_pixels[cx, cy] = 0
                for dx, dy in [(-1,0), (1,0), (0,-1), (0,1)]:
                    nx, ny = cx + dx, cy + dy
                    if 0 <= nx < w and 0 <= ny < h and (nx, ny) not in visited:
                        queue.append((nx, ny))
                        
    # Smooth the mask slightly for antialiasing
    mask = mask.filter(ImageFilter.GaussianBlur(radius=0.5))
    crop.putalpha(mask)
    
    # Auto-crop bounding box of non-empty alpha
    bbox = crop.getbbox()
    if bbox:
        crop = crop.crop(bbox)
        
    return crop

def main():
    p = Image.open('d:/botly/public/characters/test_panel.png')
    
    # Coordinates inside test_panel (500x490)
    # Anna: Row 0, Col 0 (without the green checkmark if possible)
    # Note: Row 0 Col 0 had a checkmark in upper left, let's check its bounds or clean it
    characters = {
        "anna": (20, 15, 130, 145),   # Row 0, Col 0 (Green cloak)
        "mia": (145, 10, 255, 145),   # Row 0, Col 1 (Cream cloak)
        "leo": (265, 10, 375, 145),   # Row 0, Col 2 (Deep blue / beret)
        "ben": (375, 10, 485, 145),   # Row 0, Col 3 (Navy cloak with glasses)
        "lily": (20, 155, 130, 290),  # Row 1, Col 0 (Purple hair and cloak)
    }
    
    out_dir = "d:/botly/public/healthclues/assets/characters"
    os.makedirs(out_dir, exist_ok=True)
    
    for name, box in characters.items():
        extracted = extract_character(p, box)
        out_path = os.path.join(out_dir, f"chibi-{name}.png")
        extracted.save(out_path)
        print(f"Saved {name}: size {extracted.size} to {out_path}")

if __name__ == "__main__":
    main()
