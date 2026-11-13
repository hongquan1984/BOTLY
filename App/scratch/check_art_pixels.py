from PIL import Image

art_path = r"C:\Users\Admin\.gemini\antigravity\brain\abff8161-8d04-4588-8fd8-ca4619ccaf85\swiss_sheepskin_rug_1794158774567.jpg"
im = Image.open(art_path)
w, h = im.size

print("Corner (0,0):", im.getpixel((0, 0)))
print("Corner (w-1,0):", im.getpixel((w-1, 0)))
print("Corner (0,h-1):", im.getpixel((0, h-1)))
print("Corner (w-1,h-1):", im.getpixel((w-1, h-1)))
print("Top-middle (w//2, 10):", im.getpixel((w//2, 10)))
print("Center (w//2, h//2):", im.getpixel((w//2, h//2)))
