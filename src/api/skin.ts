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
