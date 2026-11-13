from PIL import Image
import numpy as np

art_path = r"C:\Users\Admin\.gemini\antigravity\brain\abff8161-8d04-4588-8fd8-ca4619ccaf85\swiss_sheepskin_rug_1794158774567.jpg"
im = Image.open(art_path).convert("RGBA")
data = np.array(im)

# Flood fill or background extraction
# Background is near white: r > 240, g > 240, b > 240
# Calculate alpha with soft feathering
diff = 255.0 - np.minimum(np.minimum(data[:, :, 0], data[:, :, 1]), data[:, :, 2])
# When all channels are >= 245, it's background
# Soft transition between 10 (almost white) and 25 (rug edge)
alpha = np.clip((diff - 8.0) / 18.0 * 255.0, 0, 255).astype(np.uint8)

data[:, :, 3] = alpha
result = Image.fromarray(data, mode="RGBA")

# Find bounding box of non-zero alpha
bbox = result.getbbox()
print("Bbox:", bbox)

# Save test result
out_test = r"D:\botly\App\scratch\test_rug_transparent.png"
result.save(out_test)
print("Saved transparent test rug")
