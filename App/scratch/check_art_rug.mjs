import fs from 'fs';

const p1 = 'C:/Users/Admin/.gemini/antigravity/brain/abff8161-8d04-4588-8fd8-ca4619ccaf85/swiss_sheepskin_rug_1794158774567.jpg';
if (fs.existsSync(p1)) {
  const stat = fs.statSync(p1);
  console.log('Artifact rug size:', stat.size);
} else {
  console.log('Artifact rug does not exist');
}
