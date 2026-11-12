export default async function handler(_req: any, res: any) {
  const start = Date.now();
  const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://zjlatiflzqssrnzvsmhv.supabase.co';
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_srr8vcA4OFoECer8u6mMTQ_eAaNvgAt';

  let dbConnected = false;
  let schemaReady = false;

  try {
    const dbRes = await fetch(`${supabaseUrl}/rest/v1/league_events?select=id&limit=1`, {
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
      },
    });
    dbConnected = true;
    schemaReady = dbRes.ok;
  } catch {
    dbConnected = false;
  }

  return res.status(200).json({
    status: 'online',
    platform: 'Vercel Edge + Supabase PostgreSQL',
    supabaseUrl,
    dbConnected,
    schemaReady,
    cloudinaryConfigured: Boolean(
      process.env.CLOUDINARY_API_SECRET &&
      !process.env.CLOUDINARY_API_SECRET.includes('PASTE_YOUR')
    ),
    latencyMs: Date.now() - start,
  });
}
