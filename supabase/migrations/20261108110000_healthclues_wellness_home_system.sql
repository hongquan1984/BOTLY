-- HealthClues Swiss Alpine Chalet Wellness Home System
-- Supports multi-room 100% empty canvas, homography perspective warping, and per-player progress

CREATE TABLE IF NOT EXISTS healthclues_wellness_home_catalog (
  id VARCHAR(64) PRIMARY KEY,
  room VARCHAR(64) NOT NULL,
  name_vi VARCHAR(120) NOT NULL,
  name_en VARCHAR(120) NOT NULL,
  tag_vi VARCHAR(60) NOT NULL,
  tag_en VARCHAR(60) NOT NULL,
  desc_vi TEXT NOT NULL,
  desc_en TEXT NOT NULL,
  img_src VARCHAR(255) NOT NULL,
  is_starter BOOLEAN NOT NULL DEFAULT false,
  natural_width INTEGER NOT NULL,
  natural_height INTEGER NOT NULL,
  user_scale NUMERIC(5,2) NOT NULL DEFAULT 1.0,
  z_index INTEGER NOT NULL DEFAULT 100,
  corners JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS healthclues_wellness_home_player_state (
  user_id VARCHAR(120) PRIMARY KEY,
  unlocked_items JSONB NOT NULL DEFAULT '[]'::jsonb,
  active_room VARCHAR(64) NOT NULL DEFAULT 'scene_interior_wide',
  has_claimed_welcome BOOLEAN NOT NULL DEFAULT false,
  last_reward_claimed_at TIMESTAMPTZ NULL,
  day_night_override VARCHAR(10) NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE healthclues_wellness_home_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE healthclues_wellness_home_player_state ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'healthclues_wellness_home_catalog' AND policyname = 'Public read wellness home catalog'
  ) THEN
    CREATE POLICY "Public read wellness home catalog"
      ON healthclues_wellness_home_catalog FOR SELECT
      USING (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'healthclues_wellness_home_catalog' AND policyname = 'Service role full access catalog'
  ) THEN
    CREATE POLICY "Service role full access catalog"
      ON healthclues_wellness_home_catalog FOR ALL
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'healthclues_wellness_home_player_state' AND policyname = 'Player read own wellness home'
  ) THEN
    CREATE POLICY "Player read own wellness home"
      ON healthclues_wellness_home_player_state FOR SELECT
      USING (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'healthclues_wellness_home_player_state' AND policyname = 'Service role full access player state'
  ) THEN
    CREATE POLICY "Service role full access player state"
      ON healthclues_wellness_home_player_state FOR ALL
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

-- Seed the 10 Swiss Alpine Chalet Master Blueprint Items
INSERT INTO healthclues_wellness_home_catalog (
  id, room, name_vi, name_en, tag_vi, tag_en, desc_vi, desc_en, img_src, is_starter, natural_width, natural_height, user_scale, z_index, corners
) VALUES
(
  'sofa_luxury',
  'scene_interior_wide',
  'Bộ Sofa Thụy Sĩ Sang Trọng',
  'Luxury Swiss Chalet Sofa',
  'Phòng Khách',
  'Living Room',
  'Món quà tân gia sang trọng, êm ái ngắm toàn cảnh tuyết trắng dãy Alps.',
  'A luxurious welcoming gift, soft Italian leather overlooking snowy Alps peaks.',
  '/healthclues/assets/home/items/sofa_luxury.png',
  true,
  340, 184, 1.10, 734,
  '{"tl": [24.31, 63.8], "tr": [62.04, 63.8], "br": [62.31, 94.18], "bl": [24.31, 93.26]}'::jsonb
),
(
  'piano_grand',
  'scene_interior_wide',
  'Đàn Grand Piano Cổ Điển',
  'Classic Grand Piano',
  'Phòng Khách',
  'Living Room',
  'Đàn dương cầm gỗ bóng bẩy, tấu lên những bản nhạc tuyết rơi êm dịu.',
  'Polished concert grand piano playing peaceful winter melodies.',
  '/healthclues/assets/home/items/piano_grand.png',
  false,
  340, 365, 0.40, 908,
  '{"tl": [61.13, 49.79], "tr": [76.85, 49.79], "br": [76.85, 74.45], "bl": [61.13, 74.45]}'::jsonb
),
(
  'painting_fireplace',
  'scene_interior_wide',
  'Tranh Dãy Alps Uốn Góc Lò Sưởi',
  'Matterhorn Chimney Wall Art',
  'Phòng Khách',
  'Living Room',
  'Bức tranh danh họa dãy Alps gắn hoàn hảo trên trụ lò sưởi đá nguyên khối.',
  'Masterpiece Alps oil painting aligned on stone fireplace mantle.',
  '/healthclues/assets/home/items/painting_fireplace.png',
  false,
  307, 420, 0.40, 906,
  '{"tl": [13.56, 8.63], "tr": [25.94, 8.63], "br": [26.03, 36.72], "bl": [13.56, 33.09]}'::jsonb
),
(
  'table_coffee',
  'scene_interior_wide',
  'Bàn Trà Gỗ Sồi Thụy Sĩ',
  'Alpine Oak Coffee Table',
  'Phòng Khách',
  'Living Room',
  'Bàn trà mộc mạc phong cách Alpine để thưởng thức trà thảo mộc ấm.',
  'Rustic oak coffee table perfect for enjoying warm herbal teas.',
  '/healthclues/assets/home/items/table_coffee.png',
  false,
  280, 160, 0.80, 850,
  '{"tl": [36.0, 72.0], "tr": [52.0, 72.0], "br": [52.0, 88.0], "bl": [36.0, 88.0]}'::jsonb
),
(
  'plant_pot_alps',
  'scene_interior_wide',
  'Chậu Cây Xanh Alpine',
  'Alpine Evergreen Planter',
  'Phòng Khách',
  'Living Room',
  'Chậu cây thanh lọc không khí tươi mát từ sườn núi Matterhorn.',
  'Air-purifying evergreen foliage straight from Matterhorn pine trails.',
  '/healthclues/assets/home/items/plant_pot_alps.png',
  false,
  340, 357, 0.22, 1001,
  '{"tl": [22.0, 68.0], "tr": [30.0, 68.0], "br": [30.0, 84.0], "bl": [22.0, 84.0]}'::jsonb
),
(
  'luxury_chalet_bed',
  'scene_bedroom',
  'Giường Ngủ Minimalist Gỗ Sồi',
  'Minimalist Oak Chalet Bed',
  'Phòng Ngủ',
  'Bedroom',
  'Giường ngủ cao cấp đệm êm ái, mang lại giấc ngủ sâu phục hồi năng lượng.',
  'Premium ergonomic natural wooden bed for deep restorative sleep.',
  '/healthclues/assets/home/items/luxury_chalet_bed.png',
  false,
  700, 450, 0.95, 600,
  '{"tl": [32.0, 48.0], "tr": [72.0, 48.0], "br": [72.0, 86.0], "bl": [32.0, 86.0]}'::jsonb
),
(
  'bedside_lamp',
  'scene_bedroom',
  'Đèn Ngủ Tinh Dầu Ấm Cúng',
  'Aroma Warm Glow Lamp',
  'Phòng Ngủ',
  'Bedroom',
  'Ánh sáng vàng ấm 2700K dịu mắt kích hoạt hormone ngủ tự nhiên Melatonin.',
  'Warm 2700K circadian glow supporting natural melatonin sleep onset.',
  '/healthclues/assets/home/items/bedside_lamp.png',
  false,
  120, 220, 0.45, 700,
  '{"tl": [22.0, 52.0], "tr": [30.0, 52.0], "br": [30.0, 72.0], "bl": [22.0, 72.0]}'::jsonb
),
(
  'bedroom_rug',
  'scene_bedroom',
  'Thảm Lông Cừu Thụy Sĩ',
  'Swiss Fleece Bedroom Rug',
  'Phòng Ngủ',
  'Bedroom',
  'Thảm lông mềm mại giữ ấm đôi chân mỗi buổi sáng bước xuống giường.',
  'Plush insulating fleece rug keeping feet warm in cool mountain mornings.',
  '/healthclues/assets/home/items/bedroom_rug.png',
  false,
  600, 300, 1.05, 200,
  '{"tl": [24.0, 68.0], "tr": [80.0, 68.0], "br": [80.0, 93.0], "bl": [24.0, 93.0]}'::jsonb
),
(
  'painting_bedroom',
  'scene_bedroom',
  'Tranh Núi Alps Ban Mai',
  'Alpine Sunrise Perspective Canvas',
  'Phòng Ngủ',
  'Bedroom',
  'Tranh phong cảnh thiên nhiên thanh bình, tạo cảm giác thư thái trước khi ngủ.',
  'Tranquil sunrise perspective canvas fostering evening calmness.',
  '/healthclues/assets/home/items/painting_bedroom.png',
  false,
  600, 420, 1.00, 210,
  '{"tl": [78.98, 27.83], "tr": [93.28, 21.84], "br": [94.12, 69.0], "bl": [78.14, 60.09]}'::jsonb
),
(
  'bedside_armchair',
  'scene_bedroom',
  'Ghế Bành Thư Giãn Đọc Sách',
  'Chalet Reading Armchair',
  'Phòng Ngủ',
  'Bedroom',
  'Góc đọc sách tĩnh lặng ngắm sao trời bên khung cửa sổ phòng ngủ.',
  'Quiet reading nook beside the bedroom window under starlit skies.',
  '/healthclues/assets/home/items/bedside_armchair.png',
  false,
  240, 260, 0.65, 550,
  '{"tl": [12.0, 55.0], "tr": [26.0, 55.0], "br": [26.0, 80.0], "bl": [12.0, 80.0]}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  name_vi = EXCLUDED.name_vi,
  name_en = EXCLUDED.name_en,
  desc_vi = EXCLUDED.desc_vi,
  desc_en = EXCLUDED.desc_en,
  img_src = EXCLUDED.img_src,
  is_starter = EXCLUDED.is_starter,
  user_scale = EXCLUDED.user_scale,
  z_index = EXCLUDED.z_index,
  corners = EXCLUDED.corners;
