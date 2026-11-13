import os
from PIL import Image, ImageFilter

def remove_parchment_bg(im, bg_color=(253, 241, 227), tolerance=30):
    im = im.convert("RGBA")
    w, h = im.size
    pixels = im.load()
    
    visited = set()
    queue = []
    for x in range(w):
        queue.append((x, 0))
        queue.append((x, h - 1))
    for y in range(h):
        queue.append((0, y))
        queue.append((w - 1, y))
        
    mask = Image.new("L", (w, h), 255)
    mask_pixels = mask.load()
    
    def is_match(r, g, b):
        dr = abs(r - bg_color[0])
        dg = abs(g - bg_color[1])
        db = abs(b - bg_color[2])
        # Also treat very light cream/off-white as background
        return (dr + dg + db) < tolerance * 3 or (r > 242 and g > 232 and b > 212)

    while queue:
        cx, cy = queue.pop(0)
        if (cx, cy) in visited:
            continue
        visited.add((cx, cy))
        if 0 <= cx < w and 0 <= cy < h:
            r, g, b, a = pixels[cx, cy]
            if is_match(r, g, b):
                mask_pixels[cx, cy] = 0
                for dx, dy in [(-1,0), (1,0), (0,-1), (0,1)]:
                    nx, ny = cx + dx, cy + dy
                    if 0 <= nx < w and 0 <= ny < h and (nx, ny) not in visited:
                        queue.append((nx, ny))
                        
    # 0.5px blur for smooth antialiased alpha
    mask = mask.filter(ImageFilter.GaussianBlur(radius=0.5))
    im.putalpha(mask)
    
    bbox = im.getbbox()
    if bbox:
        im = im.crop(bbox)
        
    return im

def main():
    master = Image.open('d:/botly/App/references/charactor.png')
    out_dir = "d:/botly/public/healthclues/assets/characters"
    os.makedirs(out_dir, exist_ok=True)
    
    # 1. Anna: from the bottom Idle frame 2 (completely clean, no checkmark or border)
    anna_crop = master.crop((205, 786, 296, 912))
    anna = remove_parchment_bg(anna_crop)
    anna.save(os.path.join(out_dir, "chibi-anna.png"))
    print("Anna saved:", anna.size)
    
    # 2. Mia: master coordinates: x = 174 to 284, y = 135 to 275
    mia_crop = master.crop((174, 135, 284, 275))
    mia = remove_parchment_bg(mia_crop)
    mia.save(os.path.join(out_dir, "chibi-mia.png"))
    print("Mia saved:", mia.size)
    
    # 3. Leo: blue cloak with beret: x = 294 to 404, y = 130 to 275
    leo_crop = master.crop((294, 130, 404, 275))
    leo = remove_parchment_bg(leo_crop)
    leo.save(os.path.join(out_dir, "chibi-leo.png"))
    print("Leo saved:", leo.size)
    
    # 4. Ben: navy cloak with glasses: x = 404 to 516, y = 130 to 275
    ben_crop = master.crop((404, 130, 516, 275))
    ben = remove_parchment_bg(ben_crop)
    ben.save(os.path.join(out_dir, "chibi-ben.png"))
    print("Ben saved:", ben.size)
    
    # 5. Lily: purple hair with flower: x = 58 to 170, y = 275 to 425
    lily_crop = master.crop((58, 275, 170, 425))
    lily = remove_parchment_bg(lily_crop)
    lily.save(os.path.join(out_dir, "chibi-lily.png"))
    print("Lily saved:", lily.size)

    # 6. Bonus Waving Anna, Heart Lily, Greeting Ben for emote bubble animations!
    anna_wave = master.crop((1190, 786, 1290, 912))
    remove_parchment_bg(anna_wave).save(os.path.join(out_dir, "chibi-anna-wave.png"))
    
    lily_heart = master.crop((1340, 775, 1445, 912))
    remove_parchment_bg(lily_heart).save(os.path.join(out_dir, "chibi-lily-heart.png"))
    
    ben_chao = master.crop((1500, 775, 1605, 912))
    remove_parchment_bg(ben_chao).save(os.path.join(out_dir, "chibi-ben-chao.png"))
    print("Emote sprites saved!")

if __name__ == "__main__":
    main()
