export interface SpeechVoice {
  id: string;
  name: string;
  description?: string;
  previewUrl?: string;
}

// ── Hardcoded voice catalogs ─────────────────────────────────────────

const OPENAI_VOICES: SpeechVoice[] = [
  { id: "alloy", name: "Alloy", description: "Neutral and balanced" },
  { id: "ash", name: "Ash", description: "Warm and confident" },
  { id: "ballad", name: "Ballad", description: "Soft and gentle" },
  { id: "coral", name: "Coral", description: "Clear and approachable" },
  { id: "echo", name: "Echo", description: "Smooth and articulate" },
  { id: "fable", name: "Fable", description: "Expressive and dynamic" },
  { id: "nova", name: "Nova", description: "Friendly and upbeat" },
  { id: "onyx", name: "Onyx", description: "Deep and authoritative" },
  { id: "sage", name: "Sage", description: "Calm and measured" },
  { id: "shimmer", name: "Shimmer", description: "Bright and energetic" },
  { id: "verse", name: "Verse", description: "Versatile and adaptive" },
];

const GEMINI_VOICES: SpeechVoice[] = [
  { id: "Zephyr", name: "Zephyr", description: "Bright" },
  { id: "Puck", name: "Puck", description: "Upbeat" },
  { id: "Charon", name: "Charon", description: "Informative" },
  { id: "Kore", name: "Kore", description: "Firm" },
  { id: "Fenrir", name: "Fenrir", description: "Excitable" },
  { id: "Leda", name: "Leda", description: "Youthful" },
  { id: "Orus", name: "Orus", description: "Firm" },
  { id: "Aoede", name: "Aoede", description: "Breezy" },
];

const GROQ_VOICES: SpeechVoice[] = [
  { id: "Arista-PlayAI", name: "Arista", description: "Female, American" },
  { id: "Atlas-PlayAI", name: "Atlas", description: "Male, American" },
  { id: "Basil-PlayAI", name: "Basil", description: "Male, British" },
  { id: "Briggs-PlayAI", name: "Briggs", description: "Male, American" },
  { id: "Calista-PlayAI", name: "Calista", description: "Female, American" },
  { id: "Celeste-PlayAI", name: "Celeste", description: "Female, American" },
  { id: "Clover-PlayAI", name: "Clover", description: "Female, American" },
  { id: "Daphne-PlayAI", name: "Daphne", description: "Female, British" },
  { id: "Emery-PlayAI", name: "Emery", description: "Female, American" },
  { id: "Fritz-PlayAI", name: "Fritz", description: "Male, American" },
  { id: "Gail-PlayAI", name: "Gail", description: "Female, American" },
  { id: "Indigo-PlayAI", name: "Indigo", description: "Female, American" },
  { id: "Mamaw-PlayAI", name: "Mamaw", description: "Female, American" },
  { id: "Mason-PlayAI", name: "Mason", description: "Male, American" },
  { id: "Mikail-PlayAI", name: "Mikail", description: "Male, American" },
  { id: "Nyx-PlayAI", name: "Nyx", description: "Female, American" },
  { id: "Oscar-PlayAI", name: "Oscar", description: "Male, British" },
  { id: "Quinn-PlayAI", name: "Quinn", description: "Male, Irish" },
  { id: "Thunder-PlayAI", name: "Thunder", description: "Male, American" },
  { id: "Wagner-PlayAI", name: "Wagner", description: "Male, American" },
];

const STATIC_VOICES: Record<string, SpeechVoice[]> = {
  openai: OPENAI_VOICES,
  google_ai: GEMINI_VOICES,
  groq: GROQ_VOICES,
};

// ── Dynamic voice fetchers ───────────────────────────────────────────

async function fetchElevenLabsVoices(apiKey: string): Promise<SpeechVoice[]> {
  const res = await fetch("https://api.elevenlabs.io/v1/voices", {
    headers: { "xi-api-key": apiKey },
  });
  if (!res.ok) throw new Error(`ElevenLabs API returned ${res.status}`);
  const body = (await res.json()) as {
    voices: {
      voice_id: string;
      name: string;
      description?: string;
      preview_url?: string;
      labels?: Record<string, string>;
    }[];
  };
  return body.voices.map((v) => ({
    id: v.voice_id,
    name: v.name,
    description: v.description || formatLabels(v.labels) || undefined,
    previewUrl: v.preview_url || undefined,
  }));
}

function formatLabels(labels?: Record<string, string>): string | undefined {
  if (!labels) return undefined;
  const parts = [
    labels.accent,
    labels.age,
    labels.gender,
    labels.use_case,
  ].filter(Boolean);
  return parts.length > 0 ? parts.join(", ") : undefined;
}

async function fetchMiniMaxVoices(apiKey: string): Promise<SpeechVoice[]> {
  const res = await fetch("https://api.minimaxi.chat/v1/tts/voices", {
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  if (!res.ok) throw new Error(`MiniMax API returned ${res.status}`);
  const body = (await res.json()) as {
    voices?: { voice_id: string; name: string; type?: string }[];
  };
  return (body.voices ?? []).map((v) => ({
    id: v.voice_id,
    name: v.name,
    description: v.type || undefined,
  }));
}

const DYNAMIC_FETCHERS: Record<
  string,
  (apiKey: string) => Promise<SpeechVoice[]>
> = {
  elevenlabs: fetchElevenLabsVoices,
  minimax: fetchMiniMaxVoices,
};

// ── Public API ───────────────────────────────────────────────────────

/**
 * List available speech voices for a provider.
 * Returns a hardcoded list for providers with known voice sets,
 * or fetches dynamically from the provider API when an apiKey is provided.
 */
export async function listProviderVoices(
  providerId: string,
  apiKey?: string,
): Promise<SpeechVoice[]> {
  if (STATIC_VOICES[providerId]) {
    return STATIC_VOICES[providerId];
  }

  const fetcher = DYNAMIC_FETCHERS[providerId];
  if (!fetcher || !apiKey) return [];

  return fetcher(apiKey);
}
