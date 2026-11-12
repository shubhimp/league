import { createHash } from 'node:crypto';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME || process.env.VITE_CLOUDINARY_CLOUD_NAME || 'hanndfsz';
  const apiKey = process.env.CLOUDINARY_API_KEY || process.env.VITE_CLOUDINARY_API_KEY || '749185439125192';
  const apiSecret = process.env.CLOUDINARY_API_SECRET || '';

  if (!apiSecret || apiSecret.includes('PASTE_YOUR') || apiSecret.includes('<your_api_secret>')) {
    return res.status(400).json({
      configured: false,
      error: 'CLOUDINARY_API_SECRET is not set yet. Paste your Cloudinary API Secret into .env.local (local) or Vercel Env Vars.',
    });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const folder = String(body.folder || 'nerds-room-league').replace(/[^a-zA-Z0-9_/-]/g, '');
    const timestamp = Math.floor(Date.now() / 1000);

    // Cloudinary requires alphabetical sorting of signed parameters
    const paramsToSign = `folder=${folder}&timestamp=${timestamp}${apiSecret}`;
    const signature = createHash('sha1').update(paramsToSign).digest('hex');

    return res.status(200).json({
      configured: true,
      cloudName,
      apiKey,
      timestamp,
      folder,
      signature,
      uploadUrl: `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    });
  } catch (err: any) {
    return res.status(500).json({
      configured: false,
      error: err?.message || 'Failed to generate upload signature',
    });
  }
}
