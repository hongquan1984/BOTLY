import fs from 'node:fs/promises';
import path from 'node:path';

export const dirs = (root) => Object.fromEntries(['state','tasks/pending','tasks/active','tasks/completed','tasks/blocked','reports','evidence','logs'].map(x => [x, path.join(root, x)]));
export async function ensureLayout(root) { for (const d of Object.values(dirs(root))) await fs.mkdir(d, {recursive:true}); }
export async function atomicJson(file, value) { await fs.mkdir(path.dirname(file), {recursive:true}); const tmp = `${file}.${process.pid}.${Date.now()}.tmp`; await fs.writeFile(tmp, JSON.stringify(value, null, 2)+'\n', 'utf8'); await fs.rename(tmp, file); }
export async function readJson(file, fallback = null) { try { return JSON.parse((await fs.readFile(file,'utf8')).replace(/^\uFEFF/,'')); } catch (e) { if (e.code === 'ENOENT') return fallback; throw e; } }
export async function acquireLock(root) {
  const file = path.join(root,'state','orchestrator.lock'); await fs.mkdir(path.dirname(file),{recursive:true});
  try { const h = await fs.open(file,'wx'); await h.writeFile(JSON.stringify({pid:process.pid,startedAt:new Date().toISOString()})); await h.close(); return async()=>{await fs.rm(file,{force:true});}; }
  catch(e) { if (e.code !== 'EEXIST') throw e; let record; try { record=JSON.parse(await fs.readFile(file,'utf8')); } catch {} if(record?.pid) { try { process.kill(record.pid,0); throw new Error(`Đã có Manager chạy (PID ${record.pid})`); } catch(x) { if(x.message.startsWith('Đã có')) throw x; if(x.code!=='ESRCH')throw new Error('Không thể xác minh PID Manager; lock được giữ nguyên.'); } const current=await fs.readFile(file,'utf8').catch(()=>null);if(current===JSON.stringify(record)){await fs.rm(file,{force:true});return acquireLock(root);} } throw new Error('Lock Manager tồn tại nhưng metadata không hợp lệ; cần kiểm tra trước khi xóa.'); }
}
