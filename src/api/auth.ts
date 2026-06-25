import { client } from '@/server/client.gen';
import { postAuthRefresh } from '@/server/sdk.gen';

let accessToken: string | null = null;
let refreshToken: string | null = null;
let refreshPromise: Promise<boolean> | null = null;

/**
 * 获取当前访问令牌
 * @returns 访问令牌字符串，未登录返回 null
 */
export function getAccessToken(): string | null {
  return accessToken;
}

/**
 * 获取当前刷新令牌
 * @returns 刷新令牌字符串，未登录返回 null
 */
export function getRefreshToken(): string | null {
  return refreshToken;
}

/**
 * 设置访问令牌和刷新令牌
 * @param access 访问令牌
 * @param refresh 刷新令牌
 */
export function setTokens(access: string, refresh: string): void {
  accessToken = access;
  refreshToken = refresh;
}

/** 清除所有令牌（退出登录） */
export function clearTokens(): void {
  accessToken = null;
  refreshToken = null;
}

/**
 * 设置服务端基础 URL
 * @param url 服务端地址
 */
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

/**
 * 设置认证拦截器（自动附加 Bearer Token，401 时自动刷新）
 * 需在应用初始化时调用一次
 */
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

/**
 * 初始化认证状态（尝试用刷新令牌恢复会话）
 * @returns 是否成功获取有效令牌
 */
export async function initAuth(): Promise<boolean> {
  if (accessToken) return true;
  if (!refreshToken) return false;
  return ensureValidToken();
}
