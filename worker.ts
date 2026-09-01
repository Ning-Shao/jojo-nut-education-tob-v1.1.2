interface Env {
  ASSETS: { fetch(request: Request): Promise<Response> };
  GEMINI_API_KEY?: string;
}

const ALLOWED_MODELS = new Set(['gemini-3-flash-preview', 'gemini-2.5-flash']);
const MAX_BODY_BYTES = 200_000;

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), { status, headers: {
    'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
  }});
}

function normalizeContents(contents: unknown): unknown[] {
  if (typeof contents === 'string') return [{ role: 'user', parts: [{ text: contents }] }];
  if (Array.isArray(contents)) return contents;
  throw new Error('Invalid AI contents');
}

async function handleGenerate(request: Request, env: Env): Promise<Response> {
  if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405);
  const origin = request.headers.get('Origin');
  if (origin && origin !== new URL(request.url).origin) return json({ error: 'Cross-origin requests are not allowed' }, 403);
  if (!env.GEMINI_API_KEY) return json({ error: 'AI service is not configured' }, 503);
  if (Number(request.headers.get('Content-Length') || 0) > MAX_BODY_BYTES) return json({ error: 'Request is too large' }, 413);

  const raw = await request.text();
  if (new TextEncoder().encode(raw).byteLength > MAX_BODY_BYTES) return json({ error: 'Request is too large' }, 413);
  let input: { model?: unknown; contents?: unknown; config?: Record<string, unknown> };
  try { input = JSON.parse(raw); } catch { return json({ error: 'Invalid JSON body' }, 400); }
  if (typeof input.model !== 'string' || !ALLOWED_MODELS.has(input.model)) return json({ error: 'Model is not allowed' }, 400);

  let contents: unknown[];
  try { contents = normalizeContents(input.contents); }
  catch (error) { return json({ error: error instanceof Error ? error.message : 'Invalid AI contents' }, 400); }

  const config = input.config || {};
  const upstreamBody: Record<string, unknown> = { contents };
  const generationConfig: Record<string, unknown> = {};
  if (config.responseMimeType) generationConfig.responseMimeType = config.responseMimeType;
  if (config.responseSchema) generationConfig.responseSchema = config.responseSchema;
  if (Object.keys(generationConfig).length) upstreamBody.generationConfig = generationConfig;
  if (Array.isArray(config.tools)) upstreamBody.tools = config.tools;

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(input.model)}:generateContent`;
  const upstream = await fetch(endpoint, { method: 'POST', headers: {
    'Content-Type': 'application/json', 'x-goog-api-key': env.GEMINI_API_KEY,
  }, body: JSON.stringify(upstreamBody) });
  const result = await upstream.json() as any;
  if (!upstream.ok) {
    console.error('Gemini request failed', upstream.status, result?.error?.status);
    return json({ error: 'AI provider request failed' }, upstream.status >= 500 ? 502 : 400);
  }
  const text = result?.candidates?.[0]?.content?.parts?.map((part: { text?: string }) => part.text || '').join('') || '';
  return json({ text, candidates: result?.candidates || [] });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const path = new URL(request.url).pathname;
    if (path === '/api/ai/generate') return handleGenerate(request, env);
    if (path.startsWith('/api/')) return json({ error: 'Not found' }, 404);
    return env.ASSETS.fetch(request);
  },
};
