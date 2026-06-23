import { InvokeOptions } from "@tauri-apps/api/core";
import { invokeRust } from "./client";
import { logger } from "@/helper/logger";

async function pngBytesToUrl(bytes: number[]): Promise<string> {
  const blob = new Blob([new Uint8Array(bytes)], { type: 'image/png' });
  return URL.createObjectURL(blob);
}

export interface SkinAvatarOptions {
  uuid: string;
  size?: number;
  showHat?: boolean;
}

export const invokeRenderAvatar = async (
  options: SkinAvatarOptions,
  opts?: InvokeOptions
): Promise<string> => {
  logger.info('渲染皮肤头像', options);
  const result: number[] = await invokeRust("render_avatar", {
    uuid: options.uuid,
    size: options.size ?? 128,
    showHat: options.showHat ?? true,
  }, opts);
  return pngBytesToUrl(result);
};

export const invokeGetSkinHead = async (
  options: SkinAvatarOptions,
  opts?: InvokeOptions
): Promise<string> => {
  logger.info('获取平面头像', options);
  const result: number[] = await invokeRust("get_skin_head", {
    uuid: options.uuid,
    size: options.size ?? 64,
    showHat: options.showHat ?? true,
  }, opts);
  return pngBytesToUrl(result);
};

export const invokeRenderIsometricAvatar = async (
  options: SkinAvatarOptions,
  opts?: InvokeOptions
): Promise<string> => {
  logger.info('渲染斜二测3D头像', options);
  const result: number[] = await invokeRust("render_isometric_avatar_cmd", {
    uuid: options.uuid,
    size: options.size ?? 256,
    showHat: options.showHat ?? true,
  }, opts);
  return pngBytesToUrl(result);
};

export const invokeGetSkinCape = async (
  uuid: string,
  opts?: InvokeOptions
): Promise<string | null> => {
  logger.info('获取披风', { uuid });
  const result: number[] | null = await invokeRust("get_skin_cape", { uuid }, opts);
  if (!result) return null;
  return pngBytesToUrl(result);
};

export interface SkinModelResponse {
  model: string;
  from_api: boolean;
}

export const invokeGetSkinModel = async (
  uuid: string,
  opts?: InvokeOptions
): Promise<SkinModelResponse> => {
  logger.info('获取皮肤模型', { uuid });
  return await invokeRust("get_skin_model", { uuid }, opts);
};

export interface MinecraftUserProfile {
  id: string;
  name: string;
  legacy?: boolean;
  demo?: boolean;
}

export const invokeGetUuidByUsername = async (
  username: string,
  opts?: InvokeOptions
): Promise<MinecraftUserProfile> => {
  logger.info('通过名称获取UUID', { username });
  return await invokeRust("get_uuid_by_username", { username }, opts);
};

export const invokeGetUuidsByUsernames = async (
  usernames: string[],
  opts?: InvokeOptions
): Promise<MinecraftUserProfile[]> => {
  logger.info('批量获取UUID', { count: usernames.length });
  return await invokeRust("get_uuids_by_usernames", { usernames }, opts);
};

let canonicalUuids: { steve: string; alex: string } | null = null;
let canonicalPromise: Promise<{ steve: string; alex: string } | null> | null = null;

export async function ensureCanonicalSkinUuids(): Promise<{ steve: string; alex: string } | null> {
  if (canonicalUuids) return canonicalUuids;
  if (canonicalPromise) return canonicalPromise;
  canonicalPromise = (async () => {
    try {
      const [steve, alex] = await Promise.all([
        invokeGetUuidByUsername('Steve'),
        invokeGetUuidByUsername('Alex'),
      ]);
      const result = { steve: steve.id, alex: alex.id };
      canonicalUuids = result;
      return result;
    } catch {
      return null;
    }
  })();
  return canonicalPromise;
}

export function getCanonicalSkinUuid(isSlim: boolean): string | null {
  if (!canonicalUuids) return null;
  return isSlim ? canonicalUuids.alex : canonicalUuids.steve;
}
