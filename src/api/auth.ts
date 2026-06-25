import { client } from '@/server/client.gen';
import { postAuthRefresh } from '@/server/sdk.gen';

let accessToken: string | null = null;
let refreshToken: string | null = null;
let refreshPromise: Promise<boolean> | null = null;

export function getAccessToken(): string | null {
  return accessToken;
}

export function getRefreshToken(): string | null {
  return refreshToken;
}

export function setTokens(access: string, refresh: string): void {
  accessToken = access;
  refreshToken = refresh;
}

export function clearTokens(): void {
  accessToken = null;
  refreshToken = null;
}

export function setServerBaseUrl(url: string): void {
  client.setConfig({ baseUrl: url });
}

async function doRefresh(): Promise<boolean> {
  if (!refreshToken) return false;
  try {
    const { data } = await postAuthRefresh({
      body: { refresh_token: refreshToken },
      auth: () => '',
    });
    if (!data) return false;
    accessToken = data.access_token ?? '';
    refreshToken = data.refresh_token ?? '';
    return true;
  } catch {
    return false;
  }
}

async function ensureValidToken(): Promise<boolean> {
  if (accessToken) return true;
  if (!refreshToken) return false;
  if (refreshPromise) return refreshPromise;
  refreshPromise = doRefresh().finally(() => { refreshPromise = null; });
  return refreshPromise;
}

export function setupAuthInterceptor(): void {
  client.setConfig({
    auth: () => (accessToken ? `Bearer ${accessToken}` : ''),
  });

  client.interceptors.response.use(async (response, _request, options) => {
    if (response.status === 401) {
      const refreshed = await ensureValidToken();
      if (refreshed) {
        const newToken = accessToken ? `Bearer ${accessToken}` : '';
        options.auth = () => newToken;
        const headers = new Headers(response.headers);
        headers.set('Authorization', newToken);
        return fetch(response.url, {
          method: options.method,
          headers,
          body: options.body as BodyInit | undefined,
        });
      }
    }
    return response;
  });
}

export async function initAuth(): Promise<boolean> {
  if (accessToken) return true;
  if (!refreshToken) return false;
  return ensureValidToken();
}
