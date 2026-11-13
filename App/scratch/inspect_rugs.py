from PIL import Image
import os

art_path = r"C:\Users\Admin\.gemini\antigravity\brain\abff8161-8d04-4588-8fd8-ca4619ccaf85\swiss_sheepskin_rug_1794158774567.jpg"
cur_path = r"D:\botly\public\healthclues\assets\home\items\bedroom_rug.png"

im_art = Image.open(art_path)
print(f"Artifact rug: size={im_art.size}, mode={im_art.mode}")

im_cur = Image.open(cur_path)
print(f"Current rug: size={im_cur.size}, mode={im_cur.mode}")
