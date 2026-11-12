import { createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

const COOKIE_NAME = 'nr_google_oauth';
const COOKIE_MAX_AGE_SECONDS = 600;

interface OAuthContextPayload {
  state: string;
  rawNonce: string;
  nextPath: string;
  iat: number;
}

function resolveCanonicalOrigin(req: any): string {
  const rawHost = String(req.headers['x-forwarded-host'] || req.headers.host || '')
    .split(',')[0]
    .trim()
    .toLowerCase();
  const rawProto = String(req.headers['x-forwarded-proto'] || 'https')
    .split(',')[0]
    .trim()
    .toLowerCase();
  const proto = rawProto === 'http' ? 'http' : 'https';

  const isAllowedHost =
    rawHost === 'league.nerdsroom.org' ||
    rawHost.endsWith('.nerdsroom.org') ||
    rawHost.endsWith('.vercel.app') ||
    rawHost.startsWith('localhost:') ||
    rawHost === 'localhost' ||
    rawHost.startsWith('127.0.0.1:');

  if (isAllowedHost && rawHost) {
    return `${proto}://${rawHost}`;
  }
  return 'https://league.nerdsroom.org';
}

function sanitizeNextPath(rawNext: unknown): string {
  const val = String(rawNext || '/').trim();
  if (!val.startsWith('/') || val.startsWith('//') || val.includes('\\')) {
    return '/';
  }
  return val;
}

function parseCookies(cookieHeader: string | undefined): Record<string, string> {
  const result: Record<string, string> = {};
  if (!cookieHeader) return result;
  for (const part of cookieHeader.split(';')) {
    const idx = part.indexOf('=');
    if (idx === -1) continue;
    const key = part.slice(0, idx).trim();
    const val = part.slice(idx + 1).trim();
    if (key) result[key] = decodeURIComponent(val);
  }
  return result;
}

function signPayload(payload: OAuthContextPayload, secret: string): string {
  const encoded = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = createHmac('sha256', secret).update(encoded).digest('base64url');
  return `${encoded}.${sig}`;
}

function verifyPayload(cookieVal: string | undefined, secret: string): OAuthContextPayload | null {
  if (!cookieVal) return null;
  const parts = cookieVal.split('.');
  if (parts.length !== 2) return null;
  const [encoded, sig] = parts;
  if (!encoded || !sig) return null;

  const expectedSig = createHmac('sha256', secret).update(encoded).digest('base64url');
  const sigBuf = Buffer.from(sig);
  const expectedBuf = Buffer.from(expectedSig);
  if (sigBuf.length !== expectedBuf.length || !timingSafeEqual(sigBuf, expectedBuf)) {
    return null;
  }

  try {
    const parsed = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8')) as OAuthContextPayload;
    if (!parsed.state || !parsed.rawNonce || typeof parsed.iat !== 'number') {
      return null;
    }
    if (Date.now() - parsed.iat > COOKIE_MAX_AGE_SECONDS * 1000) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function redirectWithError(res: any, origin: string, message: string) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Location', `${origin}/?error=${encodeURIComponent(message)}`);
  return res.status(302).end();
}

export default async function handler(req: any, res: any) {
  res.setHeader('Cache-Control', 'no-store');

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const clientId = (process.env.GOOGLE_CLIENT_ID || process.env.VITE_GOOGLE_CLIENT_ID || '').trim();
  const clientSecret = (process.env.GOOGLE_CLIENT_SECRET || '').trim();
  const configured = Boolean(
    clientId &&
      clientSecret &&
      !clientId.includes('PASTE_YOUR') &&
      !clientSecret.includes('PASTE_YOUR')
  );

  if (req.query?.check === '1') {
    return res.status(200).json({ enabled: configured });
  }

  const origin = resolveCanonicalOrigin(req);
  const redirectUri = `${origin}/api/google-auth`;
  const isHttps = origin.startsWith('https://');
  const secureFlag = isHttps ? '; Secure' : '';

  if (!configured) {
    return redirectWithError(
      res,
      origin,
      'Custom Google OAuth is not configured on this server yet.'
    );
  }

  // Handle Google callback (?error=... or ?code=...)
  if (req.query?.error || req.query?.code) {
    // Clear OAuth state cookie immediately
    res.setHeader(
      'Set-Cookie',
      `${COOKIE_NAME}=; HttpOnly; Path=/api/google-auth; SameSite=Lax; Max-Age=0${secureFlag}`
    );

    if (req.query?.error) {
      const desc = String(req.query.error_description || req.query.error || 'Google sign-in cancelled.');
      return redirectWithError(res, origin, desc);
    }

    const cookies = parseCookies(req.headers.cookie);
    const ctx = verifyPayload(cookies[COOKIE_NAME], clientSecret);
    const returnedState = String(req.query?.state || '');

    if (!ctx || !returnedState) {
      return redirectWithError(res, origin, 'Google login session expired. Please try again.');
    }

    const stateBufA = Buffer.from(returnedState);
    const stateBufB = Buffer.from(ctx.state);
    if (stateBufA.length !== stateBufB.length || !timingSafeEqual(stateBufA, stateBufB)) {
      return redirectWithError(res, origin, 'Invalid OAuth security state. Please try again.');
    }

    try {
      // 1. Exchange Google authorization code for OIDC ID token
      const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          code: String(req.query.code),
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: redirectUri,
          grant_type: 'authorization_code',
        }).toString(),
      });

      const tokenJson = (await tokenRes.json().catch(() => ({}))) as Record<string, any>;
      if (!tokenRes.ok || !tokenJson.id_token) {
        const msg = tokenJson.error_description || tokenJson.error || 'Failed to exchange Google sign-in code.';
        return redirectWithError(res, origin, String(msg));
      }

      // 2. Trade Google ID token for a genuine Supabase session
      const supabaseUrl = (process.env.VITE_SUPABASE_URL || 'https://zjlatiflzqssrnzvsmhv.supabase.co').replace(
        /\/+$/,
        ''
      );
      const supabaseAnonKey =
        process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_srr8vcA4OFoECer8u6mMTQ_eAaNvgAt';

      const sbRes = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=id_token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: supabaseAnonKey,
          Authorization: `Bearer ${supabaseAnonKey}`,
        },
        body: JSON.stringify({
          provider: 'google',
          id_token: tokenJson.id_token,
          access_token: tokenJson.access_token || undefined,
          nonce: ctx.rawNonce,
        }),
      });

      const sbData = (await sbRes.json().catch(() => ({}))) as Record<string, any>;
      if (!sbRes.ok || !sbData.access_token || !sbData.refresh_token) {
        const sbErr =
          sbData.error_description ||
          sbData.msg ||
          sbData.error ||
          'Unable to complete Supabase sign-in with Google ID token.';
        return redirectWithError(res, origin, String(sbErr));
      }

      const targetPath = sanitizeNextPath(ctx.nextPath);
      const hash = new URLSearchParams({
        access_token: String(sbData.access_token),
        refresh_token: String(sbData.refresh_token),
        expires_in: String(sbData.expires_in || 3600),
        token_type: String(sbData.token_type || 'bearer'),
      }).toString();

      res.setHeader('Location', `${origin}${targetPath}#${hash}`);
      return res.status(302).end();
    } catch (err: any) {
      return redirectWithError(res, origin, err?.message || 'Google authentication failed.');
    }
  }

  // Start Google OAuth via our own domain (league.nerdsroom.org/api/google-auth)
  const state = randomBytes(24).toString('hex');
  const rawNonce = randomBytes(24).toString('hex');
  const hashedNonce = createHash('sha256').update(rawNonce).digest('hex');
  const nextPath = sanitizeNextPath(req.query?.next);

  const cookieVal = signPayload({ state, rawNonce, nextPath, iat: Date.now() }, clientSecret);
  res.setHeader(
    'Set-Cookie',
    `${COOKIE_NAME}=${encodeURIComponent(
      cookieVal
    )}; HttpOnly; Path=/api/google-auth; SameSite=Lax; Max-Age=${COOKIE_MAX_AGE_SECONDS}${secureFlag}`
  );

  const authParams = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'openid email profile',
    state,
    nonce: hashedNonce,
    prompt: 'select_account',
  });

  res.setHeader('Location', `https://accounts.google.com/o/oauth2/v2/auth?${authParams.toString()}`);
  return res.status(302).end();
}
