from PIL import Image
import numpy as np

im = Image.open(r"D:\botly\App\scratch\test_rug_transparent.png")
arr = np.array(im)
alpha = arr[:, :, 3]

# Check center region (around 688, 384)
center_alpha = alpha[350:450, 600:700]
print("Center alpha min:", np.min(center_alpha), "mean:", np.mean(center_alpha))

# If there is any hollow transparency inside, flood fill from outer borders is much better!
# Let's do flood fill from corners (0,0) so the interior of the rug is 100% solid alpha!
