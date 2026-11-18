import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const backupFile = path.resolve(__dirname, '../src/data/cozy_village_backup.json');
const manifestDir = path.resolve(__dirname, '../public/worlds');
const manifestFile = path.join(manifestDir, 'cozy_village_manifest.json');

const rawData = JSON.parse(fs.readFileSync(backupFile, 'utf8'));

// Identify buildings vs environment objects
const buildingKeywords = ['shop', 'hall', 'bookshop', 'house', 'waterwheel', 'well', 'cottage'];

const buildings = [];
const environmentObjects = [];

rawData.forEach((item, index) => {
  const nameLower = (item.name || '').toLowerCase();
  const typeLower = (item.type || '').toLowerCase();
  
  const isBuilding =
    typeLower === 'cottage' ||
    typeLower === 'waterwheel' ||
    typeLower === 'well' ||
    nameLower.includes('shop') ||
    nameLower.includes('hall') ||
    nameLower.includes('bookshop') ||
    nameLower.includes('fantasy_house') ||
    nameLower.includes('stone_house');

  let assetUrl = item.assetUrl;
  if (!assetUrl && item.modelStorageKey) {
    // If exported to assets-custom, point to it
    const customPath = `/assets-custom/${item.modelStorageKey}.glb`;
    if (fs.existsSync(path.resolve(__dirname, '../public' + customPath))) {
      assetUrl = customPath;
    }
  }

  const transform = {
    position: item.position || [0, 0, 0],
    rotation: item.rotation || [0, 0, 0],
    scale: item.scale || [1, 1, 1],
  };

  if (isBuilding) {
    let buildingInstanceId = `bld_${index + 1}`;
    let hasFunction = false;
    let landmarkId = undefined;
    let actionId = undefined;
    let displayName = { vi: item.name || 'Ngôi Nhà', en: item.name || 'Building' };
    let anchorLocal = [0, 0, 2.5]; // 2.5m in front of building door

    if (nameLower.includes('potion') || nameLower.includes('lumi')) {
      buildingInstanceId = 'bld_potion_shop';
      hasFunction = true;
      landmarkId = 'herbal_garden';
      actionId = 'OPEN_HERBAL_GARDEN';
      displayName = { vi: 'Vườn Thảo Mộc', en: 'Herbal Garden' };
      anchorLocal = [0, 0, 2.8];
    } else if (nameLower.includes('waterwheel') || nameLower.includes('guồng nước') || nameLower.includes('watermill')) {
      buildingInstanceId = 'bld_watermill';
      hasFunction = true;
      landmarkId = 'cloud_therapy';
      actionId = 'OPEN_CLOUD_THERAPY';
      displayName = { vi: 'Nhà Thư Giãn Mây', en: 'Cloud Therapy House' };
      anchorLocal = [0, 0, 3.0];
    } else if (nameLower.includes('bookshop') || nameLower.includes('arcane') || nameLower.includes('library')) {
      buildingInstanceId = 'bld_bookshop';
      hasFunction = true;
      landmarkId = 'knowledge_library';
      actionId = 'OPEN_KNOWLEDGE_LIBRARY';
      displayName = { vi: 'Thư Viện Tri Thức', en: 'Knowledge Library' };
      anchorLocal = [0, 0, 2.5];
    } else if (nameLower.includes('great hall') || nameLower.includes('sinh hoạt')) {
      buildingInstanceId = 'bld_great_hall';
      hasFunction = true;
      landmarkId = 'journey_house';
      actionId = 'OPEN_JOURNEY_HOUSE';
      displayName = { vi: 'Nhà Hành Trình', en: 'Journey House' };
      anchorLocal = [0, 0, 3.2];
    } else if (nameLower.includes('well') || nameLower.includes('giếng')) {
      buildingInstanceId = 'bld_plaza_well';
      hasFunction = true;
      landmarkId = 'village_square';
      actionId = 'OPEN_VILLAGE_SQUARE';
      displayName = { vi: 'Quảng Trường Làng', en: 'Village Square' };
      anchorLocal = [0, 0, 2.0];
    } else if (nameLower.includes('fantasy_house')) {
      buildingInstanceId = 'bld_fantasy_cottage';
      displayName = { vi: 'Nhà Nghỉ Chân', en: 'Rest Cottage' };
    } else if (nameLower.includes('stone_house')) {
      buildingInstanceId = 'bld_stone_cottage';
      displayName = { vi: 'Nhà Đá Cổ', en: 'Stone Cottage' };
    }

    buildings.push({
      buildingInstanceId,
      name: item.name || buildingInstanceId,
      displayName,
      type: item.type || 'cottage',
      assetUrl,
      templateType: item.templateType,
      modelStorageKey: item.modelStorageKey,
      transform,
      hasFunction,
      landmarkId,
      actionId,
      interaction: {
        mode: 'walk_then_open',
        anchorLocal,
        radius: 2.0,
      },
    });
  } else {
    environmentObjects.push({
      name: item.name,
      type: item.type,
      assetUrl,
      templateType: item.templateType,
      modelStorageKey: item.modelStorageKey,
      transform,
      isCustomSpawn: item.isCustomSpawn,
      isColorBlended: item.isColorBlended,
    });
  }
});

const contentString = JSON.stringify({ buildings, environmentObjects });
const contentHash = crypto.createHash('sha256').update(contentString).digest('hex').substring(0, 16);

const manifest = {
  schemaVersion: 1,
  worldId: 'cozy_fantasy_village',
  worldName: 'Làng Nổi Cozy Fantasy',
  version: '1.2.0',
  contentHash,
  updatedAt: new Date().toISOString(),
  allowlistActions: [
    'OPEN_HERBAL_GARDEN',
    'OPEN_CLOUD_THERAPY',
    'OPEN_KNOWLEDGE_LIBRARY',
    'OPEN_JOURNEY_HOUSE',
    'OPEN_VILLAGE_SQUARE',
  ],
  buildings,
  environmentObjects,
};

fs.mkdirSync(manifestDir, { recursive: true });
fs.writeFileSync(manifestFile, JSON.stringify(manifest, null, 2), 'utf8');
console.log(`Generated World Manifest: ${manifestFile}`);
console.log(`Buildings count: ${buildings.length}`);
console.log(`Environment objects count: ${environmentObjects.length}`);
console.log(`Content Hash: ${contentHash}`);
