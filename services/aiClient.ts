export const Type = {
  ARRAY: 'ARRAY', OBJECT: 'OBJECT', STRING: 'STRING', NUMBER: 'NUMBER',
  INTEGER: 'INTEGER', BOOLEAN: 'BOOLEAN',
} as const;

type GenerateContentRequest = { model: string; contents: unknown; config?: Record<string, unknown> };
export type GenerateContentResponse = {
  text?: string;
  candidates?: Array<{ groundingMetadata?: { groundingChunks?: unknown[] } }>;
};

async function generateContent(request: GenerateContentRequest): Promise<GenerateContentResponse> {
  const response = await fetch('/api/ai/generate', {
    method: 'POST', credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(request),
  });
  const payload = await response.json().catch(() => null) as (GenerateContentResponse & { error?: string }) | null;
  if (!response.ok) throw new Error(payload?.error || `AI request failed (${response.status})`);
  return payload || {};
}

// UI-compatible wrapper: provider credentials and SDK stay on the server.
export class GoogleGenAI {
  readonly models = { generateContent };
}
