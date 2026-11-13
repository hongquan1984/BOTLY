import fs from 'fs';
import readline from 'readline';

async function checkSubagentMsg() {
  const fileStream = fs.createReadStream('C:/Users/Admin/.gemini/antigravity/brain/abff8161-8d04-4588-8fd8-ca4619ccaf85/.system_generated/logs/transcript.jsonl');
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

  for await (const line of rl) {
    if (line.includes('4fcea81c-6e98-4cb4-9c2c-097b62354bf7')) {
      const obj = JSON.parse(line);
      console.log(`Step ${obj.step_index}: ${obj.source} - ${obj.type}`);
      if (obj.content) console.log(obj.content);
    }
  }
}

checkSubagentMsg();
