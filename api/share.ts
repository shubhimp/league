function escapeHtml(str: string): string {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function optimizeOgImageUrl(rawUrl: string): string {
  const url = rawUrl || 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1200&q=80';
  if (url.includes('res.cloudinary.com') && url.includes('/upload/') && !url.includes('/w_1200')) {
    return url.replace('/upload/', '/upload/w_1200,h_630,c_fill,g_auto,q_auto,f_jpg/');
  }
  return url;
}

export default async function handler(req: any, res: any) {
  const slug = String(req.query?.slug || req.query?.event || '').trim();
  const secret = String(req.query?.secret || req.query?.access || '').trim();

  const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://zjlatiflzqssrnzvsmhv.supabase.co';
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_srr8vcA4OFoECer8u6mMTQ_eAaNvgAt';

  let title = 'Nerds Room League — Host & Join Multi-Round Hackathons';
  let description = 'Discover flagship hackathons, ideathons, workshops, digital QR passes, and multi-round developer sprints.';
  let imageUrl = 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1200&q=80';
  let canonicalUrl = slug
    ? `https://league.nerdsroom.org/e/${encodeURIComponent(slug)}`
    : 'https://league.nerdsroom.org';

  if (slug) {
    try {
      const dbRes = await fetch(
        `${supabaseUrl}/rest/v1/league_events?slug=eq.${encodeURIComponent(slug)}&select=slug,title,tagline,description,cover_url,organizer_name,location,start_time&limit=1`,
        {
          headers: {
            apikey: supabaseKey,
            Authorization: `Bearer ${supabaseKey}`,
          },
        }
      );

      if (dbRes.ok) {
        const rows = await dbRes.json();
        if (Array.isArray(rows) && rows.length > 0) {
          const evt = rows[0];
          const dateLabel = evt.start_time
            ? new Date(evt.start_time).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
            : '';
          title = `${evt.title} | Nerds Room League`;
          description = [
            evt.tagline || evt.description,
            evt.organizer_name ? `Hosted by ${evt.organizer_name}` : '',
            dateLabel,
            evt.location,
          ]
            .filter(Boolean)
            .join(' • ')
            .slice(0, 220);
          imageUrl = optimizeOgImageUrl(evt.cover_url);
        }
      }
    } catch {
      // Fallback to default brand OG metadata
    }
  }

  const redirectTarget = slug
    ? `/?event=${encodeURIComponent(slug)}${secret ? `&secret=${encodeURIComponent(secret)}` : ''}`
    : '/';

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}" />

  <!-- OpenGraph / WhatsApp / LinkedIn / Discord Pre-image -->
  <meta property="og:type" content="website" />
  <meta property="og:site_name" content="Nerds Room League" />
  <meta property="og:url" content="${escapeHtml(canonicalUrl)}" />
  <meta property="og:title" content="${escapeHtml(title)}" />
  <meta property="og:description" content="${escapeHtml(description)}" />
  <meta property="og:image" content="${escapeHtml(imageUrl)}" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />

  <!-- Twitter / X Card -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${escapeHtml(title)}" />
  <meta name="twitter:description" content="${escapeHtml(description)}" />
  <meta name="twitter:image" content="${escapeHtml(imageUrl)}" />

  <meta http-equiv="refresh" content="0;url=${escapeHtml(redirectTarget)}" />
  <script>window.location.replace(${JSON.stringify(redirectTarget)});</script>
</head>
<body style="font-family:sans-serif;padding:40px;text-align:center;">
  <p>Redirecting to <a href="${escapeHtml(redirectTarget)}">${escapeHtml(title)}</a>...</p>
</body>
</html>`;

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');
  return res.status(200).send(html);
}
