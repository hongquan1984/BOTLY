import fs from 'fs';
import path from 'path';

const projectDir = 'D:\\botly\\App\\word3d';
const manifestPath1 = path.join(projectDir, 'assets-extracted', 'manifest.json');
const manifestPath2 = path.join(projectDir, 'public', 'assets-extracted', 'manifest.json');

const baseManifest = JSON.parse(fs.readFileSync(manifestPath1, 'utf8'));

// Filter out old stream items to replace with clean 6 terrain items
const nonTerrainAssets = baseManifest.assets.filter(a => a.category !== 'terrain');

const newTerrainAssets = [
  {
    id: 'stream_meandering_s_01',
    name: 'Suối Uốn Lượn Chữ S (S-Curve Stream)',
    filename: 'stream_meandering_s_01.glb',
    category: 'terrain',
    relativePath: 'assets-extracted/terrain/stream_meandering_s_01.glb',
    triangles: 1420,
    vertices: 4260,
    fileSizeBytes: 1032868,
    fileSizeKb: '1008.7 KB',
    dimensions: { width: 5.4, height: 0.8, depth: 11.0 },
    instancesInOriginalVillage: 1,
    description: 'Dòng suối uốn lượn hình chữ S dài 11m với dòng chảy gợn sóng lấp lánh chuyển động, bờ đá cuội và phiến đá qua suối.'
  },
  {
    id: 'stream_winding_river_01',
    name: 'Suối Lượn Sóng Đôi (Winding River)',
    filename: 'stream_winding_river_01.glb',
    category: 'terrain',
    relativePath: 'assets-extracted/terrain/stream_winding_river_01.glb',
    triangles: 1680,
    vertices: 5040,
    fileSizeBytes: 1084604,
    fileSizeKb: '1059.2 KB',
    dimensions: { width: 6.2, height: 0.85, depth: 13.0 },
    instancesInOriginalVillage: 1,
    description: 'Dòng suối rộng uốn lượn đa tầng mềm mại dài 13m, nước chảy chuyển động lấp lánh và bờ đá rêu phong.'
  },
  {
    id: 'stream_bend_90_01',
    name: 'Khúc Cua Suối 90° (Meander Bend 90)',
    filename: 'stream_bend_90_01.glb',
    category: 'terrain',
    relativePath: 'assets-extracted/terrain/stream_bend_90_01.glb',
    triangles: 1240,
    vertices: 3720,
    fileSizeBytes: 783800,
    fileSizeKb: '765.4 KB',
    dimensions: { width: 6.5, height: 0.8, depth: 6.5 },
    instancesInOriginalVillage: 1,
    description: 'Khúc ngoặt dòng chảy 90 độ tự nhiên với dòng nước cuộn sóng chuyển động nhịp nhàng.'
  },
  {
    id: 'stream_fork_junction_01',
    name: 'Suối Ngã Ba Chữ Y (Stream Fork Junction)',
    filename: 'stream_fork_junction_01.glb',
    category: 'terrain',
    relativePath: 'assets-extracted/terrain/stream_fork_junction_01.glb',
    triangles: 1950,
    vertices: 5850,
    fileSizeBytes: 1248820,
    fileSizeKb: '1219.6 KB',
    dimensions: { width: 7.8, height: 0.8, depth: 11.2 },
    instancesInOriginalVillage: 1,
    description: 'Dòng suối uốn lượn tách làm 2 nhánh rẽ quanh đảo đá trung tâm, nước chảy chuyển động sống động.'
  },
  {
    id: 'stream_pond_01',
    name: 'Hồ Nước Đá Rêu (Mossy Rock Pond)',
    filename: 'stream_pond_01.glb',
    category: 'terrain',
    relativePath: 'assets-extracted/terrain/stream_pond_01.glb',
    triangles: 2480,
    vertices: 7150,
    fileSizeBytes: 248988,
    fileSizeKb: '243.2 KB',
    dimensions: { width: 6.1, height: 0.58, depth: 5.26 },
    instancesInOriginalVillage: 1,
    description: 'Hồ nước tròn tự nhiên với mặt nước gợn sóng chuyển động, hoa súng bập bềnh và viền đá rêu.'
  },
  {
    id: 'stream_waterfall_step_01',
    name: 'Bậc Thác Nước Đá (Stepped Rock Cascade)',
    filename: 'stream_waterfall_step_01.glb',
    category: 'terrain',
    relativePath: 'assets-extracted/terrain/stream_waterfall_step_01.glb',
    triangles: 508,
    vertices: 1101,
    fileSizeBytes: 44852,
    fileSizeKb: '43.8 KB',
    dimensions: { width: 4.44, height: 1.88, depth: 4.6 },
    instancesInOriginalVillage: 1,
    description: 'Tầng ghềnh thác đổ bọt nước trắng và hồ chứa phía dưới.'
  }
];

const allAssets = [...nonTerrainAssets, ...newTerrainAssets];

const updatedManifest = {
  ...baseManifest,
  totalUniqueAssets: allAssets.length,
  assets: allAssets,
};

fs.writeFileSync(manifestPath1, JSON.stringify(updatedManifest, null, 2));
fs.writeFileSync(manifestPath2, JSON.stringify(updatedManifest, null, 2));

console.log(`Updated manifest with ${allAssets.length} assets (${newTerrainAssets.length} terrain stream assets).`);
