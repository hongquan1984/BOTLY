import os
from PIL import Image, ImageFilter
import numpy as np
import scipy.ndimage as ndi

art_path = r"C:\Users\Admin\.gemini\antigravity\brain\abff8161-8d04-4588-8fd8-ca4619ccaf85\swiss_sheepskin_rug_1794158774567.jpg"
im = Image.open(art_path).convert("RGB")
arr = np.array(im, dtype=np.float32)

# Background is white/off-white
# Calculate difference from white
diff = 255.0 - np.minimum(np.minimum(arr[:, :, 0], arr[:, :, 1]), arr[:, :, 2])

# Binary background candidate: diff < 12 (very close to white)
bg_seed = diff < 12.0

# Connected components from the 4 corners to find true background
labeled, num_features = ndi.label(bg_seed)
corner_labels = {labeled[0, 0], labeled[0, -1], labeled[-1, 0], labeled[-1, -1]}

is_true_bg = np.isin(labeled, list(corner_labels))

# Alpha mask: 0 for true background, 255 for rug
# For pixels near the boundary (where diff is between 8 and 30), compute feathered alpha
alpha = np.where(is_true_bg, np.clip((diff - 6.0) / 20.0 * 255.0, 0, 255), 255.0)

# Unpremultiply white fringe so edges don't have white halo
# For pixels with alpha > 0, estimate true color if blended with white (255)
norm_alpha = alpha / 255.0
rgb_cleaned = np.copy(arr)
mask_edge = (norm_alpha > 0.05) & (norm_alpha < 0.98)
for c in range(3):
    channel = rgb_cleaned[:, :, c]
    # recovered = (observed - (1 - alpha)*255) / alpha
    recovered = np.where(mask_edge, (channel - (1.0 - norm_alpha) * 255.0) / np.maximum(norm_alpha, 0.05), channel)
    rgb_cleaned[:, :, c] = np.clip(recovered, 0, 255)

out_arr = np.dstack([rgb_cleaned.astype(np.uint8), alpha.astype(np.uint8)])
result = Image.fromarray(out_arr, mode="RGBA")

# Crop slightly to eliminate outer empty border while keeping natural rug margin
bbox = result.getbbox()
print("Rug bounding box:", bbox)
cropped = result.crop(bbox)
print("Cropped rug size:", cropped.size)

# Resize to standard natural size matching chalet bedroom (approx 650x370 or similar)
# Let's see aspect ratio:
aspect = cropped.width / cropped.height
print("Aspect ratio:", aspect)

# Save to destination paths:
# 1) d:\botly\public\healthclues\assets\home\items\bedroom_rug.png
# 2) d:\botly\App\.tmp\healthclues-owner-demo\app-build\public\healthclues\assets\home\items\bedroom_rug.png
p1 = r"D:\botly\public\healthclues\assets\home\items\bedroom_rug.png"
p2 = r"D:\botly\App\.tmp\healthclues-owner-demo\app-build\public\healthclues\assets\home\items\bedroom_rug.png"

cropped.save(p1, format="PNG")
print("Saved to", p1)
if os.path.exists(os.path.dirname(p2)):
    cropped.save(p2, format="PNG")
    print("Saved to", p2)
