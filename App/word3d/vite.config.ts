import { defineConfig, Plugin } from 'vite';
import fs from 'fs';
import path from 'path';

function worldSyncPlugin(): Plugin {
  return {
    name: 'world-sync-api',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.method === 'POST' && (req.url === '/_api/backup-layout' || req.url === '/_api/save-layout')) {
          let body = '';
          req.on('data', (chunk) => {
            body += chunk;
          });
          req.on('end', () => {
            try {
              const data = JSON.parse(body);
              const layoutPath = path.resolve(__dirname, 'public/data/cozy_village_layout.json');
              const publicBackupPath = path.resolve(__dirname, 'public/data/cozy_village_backup.json');
              const backupPath = path.resolve(__dirname, 'src/data/cozy_village_backup.json');
              fs.mkdirSync(path.dirname(layoutPath), { recursive: true });
              fs.mkdirSync(path.dirname(backupPath), { recursive: true });
              fs.writeFileSync(layoutPath, JSON.stringify(data, null, 2), 'utf8');
              fs.writeFileSync(publicBackupPath, JSON.stringify(data, null, 2), 'utf8');
              fs.writeFileSync(backupPath, JSON.stringify(data, null, 2), 'utf8');
              // Also generate synced World Manifest
              try {
                const manifestDir = path.resolve(__dirname, 'public/worlds');
                fs.mkdirSync(manifestDir, { recursive: true });
                const manifestPath = path.join(manifestDir, 'cozy_village_manifest.json');
                
                const blds: any[] = [];
                const envs: any[] = [];
                
                (Array.isArray(data) ? data : []).forEach((item: any, idx: number) => {
                  const isBld = item.hasFunction || item.landmarkId || item.type === 'cottage' || item.type === 'waterWheel' || item.type === 'well' || (item.name || '').toLowerCase().includes('hall') || (item.name || '').toLowerCase().includes('house') || (item.name || '').toLowerCase().includes('shop');
                  const transform = {
                    position: item.position || [0, 0, 0],
                    rotation: item.rotation || [0, 0, 0],
                    scale: item.scale || [1, 1, 1],
                  };

                  if (isBld) {
                    blds.push({
                      buildingInstanceId: item.buildingInstanceId || `bld_${idx + 1}`,
                      name: item.name,
                      displayName: {
                        vi: item.displayNameVi || item.name || 'Công trình',
                        en: item.displayNameEn || item.name || 'Building',
                      },
                      type: item.type || 'cottage',
                      assetUrl: item.assetUrl,
                      templateType: item.templateType,
                      modelStorageKey: item.modelStorageKey,
                      transform,
                      hasFunction: !!item.hasFunction,
                      landmarkId: item.landmarkId,
                      actionId: item.actionId,
                      iconId: item.iconId || '🏡',
                      enabled: item.enabled !== false,
                      interaction: {
                        mode: item.interactionMode || 'walk_then_enter',
                        anchorLocal: item.interactionAnchorLocal || [0, 0, 2.5],
                        labelAnchorLocal: item.labelAnchorLocal || [0, 3.8, 0],
                        radius: item.interactionRadius || 2.5,
                      },
                    });
                  } else {
                    envs.push({
                      name: item.name,
                      type: item.type,
                      assetUrl: item.assetUrl,
                      templateType: item.templateType,
                      modelStorageKey: item.modelStorageKey,
                      transform,
                      isCustomSpawn: item.isCustomSpawn,
                      isColorBlended: item.isColorBlended,
                    });
                  }
                });

                const manifest = {
                  schemaVersion: 2,
                  worldId: 'cozy_fantasy_village',
                  worldName: 'Làng Nổi Cozy Fantasy',
                  version: '2.0.0',
                  updatedAt: new Date().toISOString(),
                  allowlistActions: [
                    'OPEN_HERBAL_GARDEN',
                    'OPEN_CLOUD_THERAPY',
                    'OPEN_KNOWLEDGE_LIBRARY',
                    'OPEN_JOURNEY_HOUSE',
                    'OPEN_TASK_SQUARE',
                    'OPEN_VILLAGE_SQUARE',
                  ],
                  buildings: blds,
                  environmentObjects: envs,
                };
                fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf8');
                console.log(`[WorldSync] Auto-generated World Manifest v2.0.0! Buildings: ${blds.length}, Env: ${envs.length}`);
              } catch (mErr: any) {
                console.warn('[WorldSync] Could not auto-generate manifest:', mErr.message);
              }
              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ ok: true, count: Array.isArray(data) ? data.length : 1 }));
            } catch (e: any) {
              console.error('[WorldSync] Backup parse error:', e.message);
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: e.message }));
            }
          });
          return;
        }

        if (req.method === 'POST' && req.url === '/_api/save-manifest') {
          let body = '';
          req.on('data', (chunk) => {
            body += chunk;
          });
          req.on('end', () => {
            try {
              const data = JSON.parse(body);
              const manifestDir = path.resolve(__dirname, 'public/worlds');
              fs.mkdirSync(manifestDir, { recursive: true });
              const manifestPath = path.join(manifestDir, 'cozy_village_manifest.json');
              fs.writeFileSync(manifestPath, JSON.stringify(data, null, 2), 'utf8');
              console.log('[WorldSync] Saved world manifest successfully! Version:', data.version);
              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ ok: true, version: data.version }));
            } catch (e: any) {
              console.error('[WorldSync] Manifest save error:', e.message);
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: e.message }));
            }
          });
          return;
        }

        if (req.method === 'POST' && req.url?.startsWith('/_api/save-custom-model')) {
          const urlObj = new URL(req.url, 'http://localhost:5173');
          const key = urlObj.searchParams.get('key');
          if (key) {
            const chunks: Buffer[] = [];
            req.on('data', (chunk) => chunks.push(chunk));
            req.on('end', () => {
              const buffer = Buffer.concat(chunks);
              const customDir = path.resolve(__dirname, 'public/assets-custom');
              fs.mkdirSync(customDir, { recursive: true });
              const safeKey = key.replace(/[^a-zA-Z0-9_\-]/g, '_');
              fs.writeFileSync(path.join(customDir, `${safeKey}.glb`), buffer);
              console.log(`[WorldSync] Custom model saved to disk: ${safeKey}.glb (${buffer.length} bytes)`);
              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ ok: true, path: `/assets-custom/${safeKey}.glb` }));
            });
            return;
          }
        }

        next();
      });
    },
  };
}

export default defineConfig({
  plugins: [worldSyncPlugin()],
  esbuild: {
    jsx: 'automatic',
  },
  server: {
    port: 5173,
    host: true,
    watch: {
      ignored: [
        '**/src/data/**',
        '**/public/**',
        '**/*.json',
        '**/*.glb',
      ],
    },
  },
  preview: {
    port: 5173,
    host: true,
  },
  build: {
    target: 'esnext',
    chunkSizeWarningLimit: 1600,
  },
});
