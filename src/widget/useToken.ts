export type TokenResult = { token: string; url: string; room?: string };

const ENDPOINT = import.meta.env.VITE_TOKEN_ENDPOINT as string | undefined;
const AGENT_NAME = import.meta.env.VITE_AGENT_NAME as string | undefined;

function randomId() {
  return 'web-' + Math.random().toString(36).slice(2, 10);
}

export function parseTokenResponse(data: unknown): TokenResult {
  const d = data as Record<string, unknown>;
  const payload = (d?.data as Record<string, unknown>) ?? d;
  const token = payload?.token ?? d?.participantToken ?? d?.accessToken;
  const url = payload?.url ?? d?.serverUrl ?? d?.livekitUrl ?? import.meta.env.VITE_LIVEKIT_URL;
  const room = (payload?.room ?? d?.room) as string | undefined;
  if (typeof token !== 'string' || typeof url !== 'string') {
    throw new Error('Token endpoint response missing token/url');
  }
  return { token, url, room };
}

export async function fetchToken(
  agent_name?: string,
  id?: string,
): Promise<TokenResult> {
  if (!ENDPOINT) throw new Error('VITE_TOKEN_ENDPOINT is not set');
  const body = {
    agent_name: agent_name ?? AGENT_NAME ?? 'voice-agent',
    //id: id ?? randomId(),
  };
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', accept: 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Token request failed: ${res.status}`);
  return parseTokenResponse(await res.json());
}
