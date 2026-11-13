from PIL import Image

ref = Image.open(r"C:\Users\Admin\.gemini\antigravity\brain\bf806726-5fdf-45f1-b574-a2b65a5fbf0f\ref_cards_crop.png").convert("RGBA")

# 1. Bowl
bowl = ref.crop((20, 62, 78, 155))
bowl.save(r"d:\botly\public\assets\game\ui\goal-icons\ref_card_food.png")
bowl.save(r"d:\botly\App\.tmp\healthclues-owner-demo\app-build-rpg-ui\public\assets\game\ui\goal-icons\ref_card_food.png")
print("Saved bowl:", bowl.size)

# 2. Shoes
shoes = ref.crop((337, 62, 400, 155))
shoes.save(r"d:\botly\public\assets\game\ui\goal-icons\ref_card_movement.png")
shoes.save(r"d:\botly\App\.tmp\healthclues-owner-demo\app-build-rpg-ui\public\assets\game\ui\goal-icons\ref_card_movement.png")
print("Saved shoes:", shoes.size)

# 3. Bottle
bottle = ref.crop((638, 62, 705, 155))
bottle.save(r"d:\botly\public\assets\game\ui\goal-icons\ref_card_hydration.png")
bottle.save(r"d:\botly\App\.tmp\healthclues-owner-demo\app-build-rpg-ui\public\assets\game\ui\goal-icons\ref_card_hydration.png")
print("Saved bottle:", bottle.size)
