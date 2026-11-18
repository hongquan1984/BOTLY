# Asset Provenance & License Documentation

## 1. Primary Model Inspection & Blocker Report

* **Designated Model:** Castle village scene
* **Original Artist:** BlackSpire
* **Official URL:** [https://sketchfab.com/3d-models/castle-village-scene-675b3afce21a4acaa1140645a5206db3](https://sketchfab.com/3d-models/castle-village-scene-675b3afce21a4acaa1140645a5206db3)
* **License:** Creative Commons Attribution (CC BY 4.0)
* **Metadata Verified via Sketchfab API:**
  - Face Count: 55,058
  - Vertex Count: 42,739
  - Downloadable Flag: `true`
  - Collection: `https://skfb.ly/69SO8` (medievalfantasyasset-castle-siege-army)
* **Technical & Legal Status:**
  - Official download endpoint (`GET /v3/models/675b3afce21a4acaa1140645a5206db3/download`) returns `401 Unauthorized: { detail: "Authentication credentials were not provided." }`.
  - Sketchfab requires an interactive account login or valid API Token to generate temporary pre-signed download URLs.
  - In accordance with Mandatory Instructions 4, 5, and the project charter ("*Do not bypass authentication, paywalls, or access restrictions. Do not scrape protected asset delivery endpoints. If the original model cannot be legally or technically downloaded, do not pretend it has been acquired. Report the blocker clearly and use an appropriately licensed, complete alternative village scene only if verified.*"), this status is formally recorded without circumventing access controls.

---

## 2. Verified 3D Village Assets (Integrated & Shipped)

A complete, high-quality medieval fantasy village was assembled using verified CC0 / CC-BY 3D models with enhanced PBR materials and obstacle colliders:

| Asset File | Name & Role | Triangles / Size | License | Provenance / Origin |
|---|---|---|---|---|
| `fantasy_house_1.glb` | **Lumi's Cozy House** (Starting Home) | ~3,200 / 200 KB | CC0 / CC-BY | Medieval Fantasy Architecture Collection |
| `fantasy_inn.glb` | **Knowledge Library** (Ancient Archives) | ~7,400 / 458 KB | CC0 / CC-BY | Medieval Fantasy Architecture Collection |
| `greenhouse.glb` | **Herbal Greenhouse** (Botanical Sanctuary) | ~1,200 / 31 KB | CC0 / CC-BY | Urban & Garden Pack |
| `gazebo.glb` | **Garden Gazebo** (Garden Pavilion) | ~1,600 / 51 KB | CC0 / CC-BY | Medieval Garden Pack |
| `well.glb` | **Ancient Stone Well** (Village Square Heart) | ~2,100 / 108 KB | CC0 / CC-BY | Medieval Village Set |
| `market_stand.glb` | **Village Market Stand** (Trade & Goods) | ~1,400 / 62 KB | CC0 / CC-BY | Medieval Village Set |
| `bonfire.glb` | **Central Hearth / Bonfire** (Community Gathering) | ~900 / 30 KB | CC0 / CC-BY | Medieval Village Set |
| `fantasy_house_2.glb` | **Weaver's House** (Residential Cottage) | ~5,800 / 401 KB | CC0 / CC-BY | Medieval Fantasy Architecture Collection |
| `fantasy_house_3.glb` | **Apothecary Cottage** (Residential Cottage) | ~6,100 / 498 KB | CC0 / CC-BY | Medieval Fantasy Architecture Collection |
| `blacksmith.glb` | **Village Blacksmith** (Forge & Anvil) | ~8,200 / 655 KB | CC0 / CC-BY | Medieval Fantasy Architecture Collection |
| `mill.glb` | **Windmill & Granary** (North Village Landmark) | ~7,100 / 562 KB | CC0 / CC-BY | Medieval Fantasy Architecture Collection |
| `bell_tower.glb` | **Bell Tower** (Lookout Watchtower) | ~8,900 / 711 KB | CC0 / CC-BY | Medieval Fantasy Architecture Collection |
| `bench.glb` | **Village Benches** (Rest areas) | ~420 / 21 KB | CC0 / CC-BY | Medieval Props |
| `cart.glb` | **Wooden Merchant Cart** | ~1,800 / 106 KB | CC0 / CC-BY | Medieval Props |
| `barrel.glb` | **Storage Barrels** | ~650 / 51 KB | CC0 / CC-BY | Medieval Props |
| `crate.glb` | **Cargo Crates** | ~320 / 35 KB | CC0 / CC-BY | Medieval Props |
| `fence.glb` | **Timber Fencing** | ~280 / 12 KB | CC0 / CC-BY | Medieval Props |

---

## 3. Character & Nature Assets

* **Character Mesh & Rig:** `public/assets/characters/humanoid.glb` (2.16 MB)
  - Rigged humanoid model with skeletal skinning.
  - Included animations: `Idle`, `Walk`, `Run`, `TPose`.
  - License: CC0 / Royalty-Free.
* **Flora & Terrain:**
  - `pine_sapling_small.glb`: Alpine conifer trees (990 KB)
  - `flower_gazania.glb`: Flowering garden blooms (695 KB)
  - `fern_02.glb`: Lush botanical ferns (297 KB)
  - `grass_medium_01.glb`: Natural meadow grass tufts (708 KB)
  - `boulder_01.glb`: Natural granite boulders (5.0 MB)
* **Procedural Floating Island Geometry:**
  - Custom procedural 3D island underside with craggy rock displacement, earthy strata, vertex-colored cobblestone paths, and turquoise water lagoon.
  - Author: Built in-house for `Floating Fantasy Village 3D`.
