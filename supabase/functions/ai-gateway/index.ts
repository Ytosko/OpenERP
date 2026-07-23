// Supabase Edge Function: ai-gateway
// Proxies Gemini requests so the API key stays server-side (never in the JS bundle).
// Deploy:  supabase functions deploy ai-gateway
// Secret:  supabase secrets set GEMINI_API_KEY=your-key
// Optional: supabase secrets set GEMINI_MODEL=gemini-3.1-flash-lite

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  }

  const apiKey = Deno.env.get('GEMINI_API_KEY');
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'GEMINI_API_KEY secret is not set on this function' }), {
      status: 500,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  }

  let prompt: string;
  try {
    const body = await req.json();
    prompt = String(body?.prompt || '');
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
      status: 400,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  }

  if (!prompt.trim()) {
    return new Response(JSON.stringify({ error: 'prompt is required' }), {
      status: 400,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  }

  const model = Deno.env.get('GEMINI_MODEL') || 'gemini-3.1-flash-lite';
  const upstream = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
    }
  );

  if (!upstream.ok) {
    const detail = await upstream.text();
    return new Response(JSON.stringify({ error: `Gemini API error (${upstream.status})`, detail }), {
      status: 502,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  }

  const result = await upstream.json();
  const text: string =
    result?.candidates?.[0]?.content?.parts?.map((p: any) => p.text).join('') || '';

  return new Response(JSON.stringify({ text }), {
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  });
});
