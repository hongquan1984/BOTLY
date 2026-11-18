import fs from 'fs';

const items = JSON.parse(fs.readFileSync('d:/botly/App/word3d/public/data/cozy_village_layout.json', 'utf8'));
console.log('Total items in layout:', items.length);

const buildings = [];
items.forEach((item, index) => {
  const name = item.name || '';
  const type = item.type || '';
  const bldId = item.buildingInstanceId || '';
  const model = item.model || item.modelPath || item.glb || '';
  
  if (bldId || type.includes('bld') || type.includes('building') || name.toLowerCase().includes('shop') || name.toLowerCase().includes('hall') || name.toLowerCase().includes('house') || name.toLowerCase().includes('inn') || name.toLowerCase().includes('mill') || name.toLowerCase().includes('watermill') || name.toLowerCase().includes('chalet') || item.hasFunction) {
    buildings.push({
      index,
      name,
      type,
      buildingInstanceId: bldId,
      landmarkId: item.landmarkId,
      actionId: item.actionId,
      model,
      position: item.position,
      hasFunction: item.hasFunction
    });
  }
});

console.log(JSON.stringify(buildings, null, 2));
