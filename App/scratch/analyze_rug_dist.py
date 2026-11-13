from PIL import Image, ImageFilter
import numpy as np

art_path = r"C:\Users\Admin\.gemini\antigravity\brain\abff8161-8d04-4588-8fd8-ca4619ccaf85\swiss_sheepskin_rug_1794158774567.jpg"
im = Image.open(art_path).convert("RGBA")
arr = np.array(im, dtype=np.float32)

r, g, b, a = arr[:, :, 0], arr[:, :, 1], arr[:, :, 2], arr[:, :, 3]

# The background is white (r > 245, g > 245, b > 245).
# Let's inspect max and min colors of the rug
# Distance from white (255, 255, 255)
dist_from_white = np.sqrt((255 - r)**2 + (255 - g)**2 + (255 - b)**2)

print("Dist from white percentiles: min, 10, 50, 90, max")
print(np.percentile(dist_from_white, [0, 10, 50, 90, 100]))
