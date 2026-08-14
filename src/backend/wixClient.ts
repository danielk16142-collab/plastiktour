// Admin (client-credentials) access to the connected Wix Headless project.
// See: https://dev.wix.com/docs/go-headless/authentication/admin/make-admin-api-calls-with-client-credentials

const WIX_API_BASE = 'https://www.wixapis.com';

const CLIENT_ID = process.env.WIX_CLIENT_ID ?? '';
const CLIENT_SECRET = process.env.WIX_CLIENT_SECRET ?? '';
const SITE_ID = process.env.WIX_SITE_ID ?? '';

let cachedToken: { value: string; expiresAt: number } | null = null;

async function getAccessToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 30_000) {
    return cachedToken.value;
  }

  const res = await fetch(`${WIX_API_BASE}/oauth2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      grant_type: 'client_credentials',
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
    }),
  });

  if (!res.ok) {
    throw new Error(`Wix token exchange failed: ${res.status} ${await res.text()}`);
  }

  const data = (await res.json()) as { access_token: string; expires_in: number };
  cachedToken = { value: data.access_token, expiresAt: Date.now() + data.expires_in * 1000 };
  return cachedToken.value;
}

export async function wixAdminRequest<T = unknown>(
  method: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE',
  path: string,
  body?: unknown
): Promise<T> {
  const accessToken = await getAccessToken();

  const res = await fetch(`${WIX_API_BASE}${path}`, {
    method,
    headers: {
      Authorization: accessToken,
      'wix-site-id': SITE_ID,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    throw new Error(`Wix API ${method} ${path} failed: ${res.status} ${await res.text()}`);
  }

  return res.json() as Promise<T>;
}
