import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import fs from 'fs';

// Node test for GLTF bounding box
console.log('Testing two_story_house.glb file size...');
const stats = fs.statSync('glb_public/assets/models/village/two_story_house.glb');
console.log('File size:', stats.size, 'bytes');
