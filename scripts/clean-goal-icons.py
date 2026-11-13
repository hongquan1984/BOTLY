import os
from PIL import Image

folder = r"d:\botly\public\assets\game\ui\goal-icons"
dest_folder = r"d:\botly\App\.tmp\healthclues-owner-demo\app-build-rpg-ui\public\assets\game\ui\goal-icons"

files = ["ref_card_food.png", "ref_card_movement.png", "ref_card_hydration.png"]

for fname in files:
    fpath = os.path.join(folder, fname)
    if not os.path.exists(fpath):
        continue
    img = Image.open(fpath).convert("RGBA")
    w, h = img.size
    print(f"{fname}: {w}x{h}")
    
    # We want to remove the border in the top-left and feather the background.
    # The background is approximately (14, 40, 30).
    # Let's inspect pixels:
    pixels = img.load()
    
    # If pixel is near the border curve (x < 15 and y < 15) or matches the background dark teal/green, reduce alpha
    for y in range(h):
        for x in range(w):
            r, g, b, a = pixels[x, y]
            # Detect the golden border in the top-left margin
            if (x < 14 or y < 10) and (r > 60 and g > 60):
                pixels[x, y] = (0, 0, 0, 0)
                continue
            
            # Check distance from dark green card background ~ (14, 42, 31)
            # If it's pure background (not part of the subject which has brighter colors or distinct hues)
            dist_bg = ((r - 14)**2 + (g - 42)**2 + (b - 31)**2)**0.5
            if dist_bg < 18:
                pixels[x, y] = (0, 0, 0, 0)
            elif dist_bg < 32:
                # Feather alpha
                factor = (dist_bg - 18) / 14.0
                pixels[x, y] = (r, g, b, int(a * factor))

    img.save(fpath)
    if os.path.exists(dest_folder):
        img.save(os.path.join(dest_folder, fname))
    print(f"Cleaned {fname}")
