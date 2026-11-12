import { createHash, timingSafeEqual } from 'node:crypto';

function safeCompare(a: string, b: string): boolean {
  const hashA = createHash('sha256').update(a).digest();
  const hashB = createHash('sha256').update(b).digest();
  return timingSafeEqual(hashA, hashB);
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const adminId = String(body.adminId || '').trim();
    const passcode = String(body.passcode || '').trim();

    const expectedId = (process.env.MASTER_ADMIN_ID || '').trim();
    const expectedPass = (process.env.MASTER_ADMIN_PASS || '').trim();

    if (!expectedId || !expectedPass) {
      return res.status(500).json({
        authenticated: false,
        error: 'Server Master Admin environment variables (MASTER_ADMIN_ID / MASTER_ADMIN_PASS) are not configured.',
      });
    }

    const idMatches = safeCompare(adminId, expectedId);
    const passMatches = safeCompare(passcode, expectedPass);

    if (!idMatches || !passMatches) {
      return res.status(401).json({
        authenticated: false,
        error: 'Invalid Master Admin ID or Passcode. Access denied.',
      });
    }

    const sessionToken = createHash('sha256')
      .update(`${expectedId}:${expectedPass}:nerds-league-core`)
      .digest('hex');

    return res.status(200).json({
      authenticated: true,
      token: sessionToken,
      admin: {
        id: 'usr_admin_01',
        name: 'Aditya (Master Admin)',
        email: expectedId,
        role: 'master_admin',
        avatarUrl: 'https://api.dicebear.com/7.x/notionists/svg?seed=AdityaNR',
        githubHandle: 'nerds-root',
        college: 'Nerds Room Core Team',
      },
    });
  } catch (err: any) {
    return res.status(400).json({
      authenticated: false,
      error: err?.message || 'Verification failed',
    });
  }
}
