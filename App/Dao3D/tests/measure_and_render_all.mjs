import { chromium } from "file:///D:/botly/App/word3d/node_modules/playwright-core/index.mjs";
import fs from "fs";

async function main() {
  const browser = await chromium.launch({
    headless: true,
    executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    args: ["--no-sandbox", "--disable-gpu-sandbox"],
  });
  const page = await browser.newPage();
  await page.goto("http://localhost:3355/");
  await page.waitForTimeout(1000);

  const catalog = [
    // 1. BUILDINGS
    { id: 'bld_starter_cottage', glb: 'fantasy_house_1.glb', targetW: 3.2, targetH: 2.8 },
    { id: 'bld_great_hall', glb: 'house_great_hall.glb', targetW: 5.2, targetH: 4.5 },
    { id: 'bld_general_store', glb: 'house_general_store.glb', targetW: 3.8, targetH: 3.4 },
    { id: 'bld_library_cottage', glb: 'house_library_cottage.glb', targetW: 3.6, targetH: 3.2 },
    { id: 'bld_stone_house', glb: 'model_stone_house_7483.glb', targetW: 3.8, targetH: 3.2 },
    { id: 'bld_fantasy_rest', glb: 'model_fantasy_house_9348.glb', targetW: 3.5, targetH: 3.0 },
    { id: 'bld_mill', glb: 'mill.glb', targetW: 3.2, targetH: 4.8 },
    { id: 'bld_bell_tower', glb: 'bell_tower.glb', targetW: 2.6, targetH: 5.2 },
    { id: 'bld_greenhouse', glb: 'greenhouse.glb', targetW: 3.4, targetH: 2.8 },
    { id: 'bld_blacksmith', glb: 'blacksmith.glb', targetW: 3.4, targetH: 2.8 },
    { id: 'bld_fantasy_inn', glb: 'fantasy_inn.glb', targetW: 4.2, targetH: 3.6 },
    { id: 'bld_fantasy_barracks', glb: 'fantasy_barracks.glb', targetW: 4.0, targetH: 3.5 },
    { id: 'bld_two_story_house', glb: 'two_story_house.glb', targetW: 3.6, targetH: 3.6 },
    { id: 'bld_fantasy_house_2', glb: 'fantasy_house_2.glb', targetW: 3.2, targetH: 3.0 },
    { id: 'bld_fantasy_house_3', glb: 'fantasy_house_3.glb', targetW: 3.2, targetH: 3.0 },
    { id: 'bld_gazebo', glb: 'gazebo.glb', targetW: 2.4, targetH: 2.5 },
    { id: 'bld_market_stand', glb: 'market_stand.glb', targetW: 2.2, targetH: 2.2 },

    // 2. LANDSCAPE & PROPS
    { id: 'prop_japanese_garden', glb: 'model_bridge_and_japanese_garden_2650.glb', targetW: 4.5, targetH: 2.2 },
    { id: 'prop_plaza_well', glb: 'well.glb', targetW: 1.6, targetH: 1.8 },
    { id: 'prop_park_bench', glb: 'prop_park_bench.glb', targetW: 1.6, targetH: 0.9 },
    { id: 'prop_oak_bench', glb: 'bench.glb', targetW: 1.5, targetH: 0.9 },
    { id: 'prop_bonfire', glb: 'bonfire.glb', targetW: 1.2, targetH: 0.8 },
    { id: 'prop_hand_cart', glb: 'cart.glb', targetW: 1.6, targetH: 1.0 },
    { id: 'prop_oak_barrel', glb: 'barrel.glb', targetW: 0.8, targetH: 1.0 },
    { id: 'prop_supply_crate', glb: 'crate.glb', targetW: 0.8, targetH: 0.8 },
    { id: 'prop_pine_fence', glb: 'fence.glb', targetW: 2.2, targetH: 1.0 },
    { id: 'prop_picket_fence', glb: 'prop_picket_fence.glb', targetW: 2.0, targetH: 0.9 },
    { id: 'prop_lantern_post', glb: 'Lantern_01.glb', targetW: 0.7, targetH: 2.2 },

    // 3. NATURE & FLORA
    { id: 'nat_momiji_maple', glb: 'tree_momiji_maple.glb', targetW: 3.6, targetH: 4.2 },
    { id: 'nat_lineside_oak', glb: 'tree_lineside_oak.glb', targetW: 3.8, targetH: 4.5 },
    { id: 'nat_shade_park_tree', glb: 'tree_shade_park.glb', targetW: 3.5, targetH: 4.0 },
    { id: 'nat_pine_sapling', glb: 'pine_sapling_small.glb', targetW: 1.4, targetH: 2.2 },
    { id: 'nat_alpine_pine', glb: 'tree_small_02.glb', targetW: 1.6, targetH: 2.6 },
    { id: 'nat_mums_pot', glb: 'plant_mums_flowerpot.glb', targetW: 1.0, targetH: 1.0 },
    { id: 'nat_library_pot', glb: 'plant_library_flowerpot.glb', targetW: 0.8, targetH: 1.1 },
    { id: 'nat_plaza_planter', glb: 'prop_plaza_planter.glb', targetW: 1.4, targetH: 0.9 },
    { id: 'nat_mulch_bed', glb: 'bed_mulch_tile.glb', targetW: 2.0, targetH: 0.3 },
    { id: 'nat_flower_gazania', glb: 'flower_gazania.glb', targetW: 1.0, targetH: 0.8 },
    { id: 'nat_moss_patch', glb: 'moss_patch.glb', targetW: 2.2, targetH: 0.2 },
    { id: 'nat_fern', glb: 'fern_02.glb', targetW: 1.2, targetH: 0.9 },
    { id: 'nat_acanthus_scatter', glb: 'grass_acanthus_scatter.glb', targetW: 1.4, targetH: 0.5 },
    { id: 'nat_lawn_tuft', glb: 'grass_lawn_tuft.glb', targetW: 1.0, targetH: 0.4 },
    { id: 'nat_grass_medium', glb: 'grass_medium_01.glb', targetW: 1.1, targetH: 0.5 },

    // 4. TERRAIN & WATER
    { id: 'ter_snowy_mountain', glb: 'model_snowy_mountain_-_terrain_1678.glb', targetW: 7.5, targetH: 5.5 },
    { id: 'ter_mossy_pond', glb: 'stream_pond_01.glb', targetW: 3.0, targetH: 0.5 },
    { id: 'ter_cascade_step', glb: 'stream_waterfall_step_01.glb', targetW: 2.6, targetH: 1.4 },
    { id: 'ter_stream_meander_s', glb: 'stream_meandering_s_01.glb', targetW: 2.8, targetH: 0.4 },
    { id: 'ter_stream_winding', glb: 'stream_winding_river_01.glb', targetW: 2.8, targetH: 0.4 },
    { id: 'ter_stream_bend_90', glb: 'stream_bend_90_01.glb', targetW: 2.4, targetH: 0.4 },
    { id: 'ter_stream_fork', glb: 'stream_fork_junction_01.glb', targetW: 2.6, targetH: 0.4 },
    { id: 'ter_stream_straight', glb: 'stream_straight_01.glb', targetW: 2.5, targetH: 0.4 },
    { id: 'ter_moss_boulder', glb: 'rock_moss_boulder.glb', targetW: 1.6, targetH: 1.2 },
    { id: 'ter_boulder_weathered', glb: 'boulder_01.glb', targetW: 1.4, targetH: 1.1 },

    // 5. COMPANIONS
    { id: 'char_fox', glb: 'Fox.glb', targetW: 1.1, targetH: 0.8 },
    { id: 'char_robot', glb: 'RobotExpressive.glb', targetW: 1.1, targetH: 1.5 },
    { id: 'char_knight', glb: 'Knight.glb', targetW: 1.0, targetH: 1.8 },
    { id: 'char_mage', glb: 'Mage.glb', targetW: 1.0, targetH: 1.8 },
    { id: 'char_rogue', glb: 'Rogue.glb', targetW: 1.0, targetH: 1.8 }
  ];

  const measurements = await page.evaluate(async (items) => {
    const THREE = await import("/node_modules/three/build/three.module.js");
    const { GLTFLoader } = await import("/node_modules/three/examples/jsm/loaders/GLTFLoader.js");
    const loader = new GLTFLoader();

    const results = [];
    for (const item of items) {
      try {
        const gltf = await new Promise((res, rej) => loader.load("/assets/models/" + item.glb, res, undefined, rej));
        const box = new THREE.Box3().setFromObject(gltf.scene);
        const sz = new THREE.Vector3();
        box.getSize(sz);
        const maxHoz = Math.max(sz.x, sz.z);
        const h = sz.y;

        // Calculate ideal uniform scale factor so model hits either target width or height
        const scaleW = item.targetW ? item.targetW / maxHoz : 1.0;
        const scaleH = item.targetH ? item.targetH / h : 1.0;
        // Take scale that fits best without exceeding bounds
        const idealScale = Math.min(scaleW, scaleH);

        results.push({
          id: item.id,
          glb: item.glb,
          rawX: +sz.x.toFixed(2),
          rawY: +sz.y.toFixed(2),
          rawZ: +sz.z.toFixed(2),
          idealScale: +idealScale.toFixed(4),
          finalW: +(maxHoz * idealScale).toFixed(2),
          finalH: +(h * idealScale).toFixed(2)
        });
      } catch (err) {
        results.push({ id: item.id, glb: item.glb, error: err.message });
      }
    }
    return results;
  }, catalog);

  console.log("Measurements and ideal scales:");
  measurements.forEach(m => {
    if (m.error) {
      console.log(`❌ ${m.id} (${m.glb}): ${m.error}`);
    } else {
      console.log(`✅ ${m.id} (${m.glb}): raw=[${m.rawX}, ${m.rawY}, ${m.rawZ}] => idealScale=${m.idealScale} -> final=[${m.finalW}m x ${m.finalH}m]`);
    }
  });

  await browser.close();
}

main().catch(console.error);
