import { defineConfig, loadEnv, Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { createHash, timingSafeEqual } from 'node:crypto';
import type { IncomingMessage, ServerResponse } from 'node:http';

function readJsonBody(req: IncomingMessage): Promise<Record<string, any>> {
  return new Promise((resolve) => {
    let raw = '';
    req.on('data', (chunk) => {
      raw += chunk;
    });
    req.on('end', () => {
      try {
        resolve(JSON.parse(raw || '{}'));
      } catch {
        resolve({});
      }
    });
  });
}

function safeCompare(a: string, b: string): boolean {
  const hashA = createHash('sha256').update(a).digest();
  const hashB = createHash('sha256').update(b).digest();
  return timingSafeEqual(hashA, hashB);
}

function localApiDevPlugin(env: Record<string, string>): Plugin {
  return {
    name: 'nerds-local-api-middleware',
    configureServer(server) {
      server.middlewares.use(async (req: IncomingMessage, res: ServerResponse, next) => {
        const url = (req.url || '').split('?')[0];

        if (url === '/api/health') {
          const supabaseUrl = env.VITE_SUPABASE_URL || 'https://zjlatiflzqssrnzvsmhv.supabase.co';
          const supabaseKey = env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_srr8vcA4OFoECer8u6mMTQ_eAaNvgAt';
          let schemaReady = false;
          try {
            const dbRes = await fetch(`${supabaseUrl}/rest/v1/league_events?select=id&limit=1`, {
              headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` },
            });
            schemaReady = dbRes.ok;
          } catch {
            schemaReady = false;
          }

          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.end(
            JSON.stringify({
              status: 'online',
              platform: 'Local Vite + Supabase PostgreSQL',
              schemaReady,
              cloudinaryConfigured: Boolean(
                env.CLOUDINARY_API_SECRET && !env.CLOUDINARY_API_SECRET.includes('PASTE_YOUR')
              ),
            })
          );
          return;
        }

        if (url === '/api/admin-verify' && req.method === 'POST') {
          const body = await readJsonBody(req);
          const adminId = String(body.adminId || '').trim();
          const passcode = String(body.passcode || '').trim();
          const expectedId = (env.MASTER_ADMIN_ID || '').trim();
          const expectedPass = (env.MASTER_ADMIN_PASS || '').trim();

          res.setHeader('Content-Type', 'application/json');
          if (!expectedId || !expectedPass) {
            res.statusCode = 500;
            res.end(JSON.stringify({ authenticated: false, error: 'Missing MASTER_ADMIN_ID / MASTER_ADMIN_PASS in .env.local' }));
            return;
          }

          if (!safeCompare(adminId, expectedId) || !safeCompare(passcode, expectedPass)) {
            res.statusCode = 401;
            res.end(JSON.stringify({ authenticated: false, error: 'Invalid Master Admin ID or Passcode.' }));
            return;
          }

          const token = createHash('sha256')
            .update(`${expectedId}:${expectedPass}:nerds-league-core`)
            .digest('hex');

          res.statusCode = 200;
          res.end(
            JSON.stringify({
              authenticated: true,
              token,
              admin: {
                id: 'usr_admin_01',
                name: 'Aditya (Master Admin)',
                email: expectedId,
                role: 'master_admin',
                avatarUrl: 'https://api.dicebear.com/7.x/notionists/svg?seed=AdityaNR',
                githubHandle: 'nerds-root',
                college: 'Nerds Room Core Team',
              },
            })
          );
          return;
        }

        if (url === '/api/cloudinary-sign' && req.method === 'POST') {
          const body = await readJsonBody(req);
          const cloudName = env.CLOUDINARY_CLOUD_NAME || env.VITE_CLOUDINARY_CLOUD_NAME || 'hanndfsz';
          const apiKey = env.CLOUDINARY_API_KEY || env.VITE_CLOUDINARY_API_KEY || '749185439125192';
          const apiSecret = env.CLOUDINARY_API_SECRET || '';
          const unsignedPreset = env.CLOUDINARY_UPLOAD_PRESET || env.VITE_CLOUDINARY_UPLOAD_PRESET || '';
          const folder = String(body.folder || 'nerds-room-league').replace(/[^a-zA-Z0-9_/-]/g, '');
          const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;

          res.setHeader('Content-Type', 'application/json');
          if (unsignedPreset) {
            res.statusCode = 200;
            res.end(
              JSON.stringify({
                configured: true,
                mode: 'unsigned',
                cloudName,
                folder,
                uploadPreset: unsignedPreset,
                uploadUrl,
              })
            );
            return;
          }

          if (!apiSecret || apiSecret.includes('PASTE_YOUR') || apiSecret.includes('<your_api_secret>')) {
            res.statusCode = 400;
            res.end(
              JSON.stringify({
                configured: false,
                error: 'Paste your Cloudinary API Secret in .env.local to upload files directly (or paste an image URL below).',
              })
            );
            return;
          }

          const timestamp = Math.floor(Date.now() / 1000);
          const signature = createHash('sha1')
            .update(`folder=${folder}&timestamp=${timestamp}${apiSecret}`)
            .digest('hex');

          res.statusCode = 200;
          res.end(
            JSON.stringify({
              configured: true,
              mode: 'signed',
              cloudName,
              apiKey,
              timestamp,
              folder,
              signature,
              uploadUrl,
            })
          );
          return;
        }

        next();
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react(), localApiDevPlugin(env)],
    server: {
      port: 3030,
      host: true,
    },
  };
});
