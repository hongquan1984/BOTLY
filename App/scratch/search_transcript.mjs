import fs from 'fs';
import readline from 'readline';

async function searchTranscript() {
  const fileStream = fs.createReadStream('C:/Users/Admin/.gemini/antigravity/brain/abff8161-8d04-4588-8fd8-ca4619ccaf85/.system_generated/logs/transcript.jsonl');
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

  for await (const line of rl) {
    if (line.includes('swiss_sheepskin_rug') || line.includes('bedroom_rug')) {
      const obj = JSON.parse(line);
      console.log(`Step ${obj.step_index}: ${obj.source} - ${obj.type}`);
      if (obj.content) console.log(obj.content.substring(0, 300));
    }
  }
}

searchTranscript();
