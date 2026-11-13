from PIL import Image

ref = Image.open(r"C:\Users\Admin\.gemini\antigravity\brain\bf806726-5fdf-45f1-b574-a2b65a5fbf0f\ref_cards_crop.png")
print("ref size:", ref.size)

# Let's inspect where the cards are:
# ref is about 980x200 or similar
# Card 1 has the bowl on the left
# Card 2 has the sneakers on the left
# Card 3 has the water bottle on the left
