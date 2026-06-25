import { InvokeOptions } from "@tauri-apps/api/core";
import { invokeRust } from "./client";
import { logger } from "@/helper/logger";

async function pngBytesToUrl(bytes: number[]): Promise<string> {
  const blob = new Blob([new Uint8Array(bytes)], { type: 'image/png' });
  return URL.createObjectURL(blob);
}

/** 皮肤头像渲染选项 */
export interface SkinAvatarOptions {
  /** 玩家 UUID */
  uuid: string;
  /** 渲染尺寸（默认 128） */
  size?: number;
  /** 是否显示帽子层（默认 true） */
  showHat?: boolean;
}

/**
 * 渲染 3D 皮肤头像
 * @param options 渲染选项
 * @param opts Tauri invoke 选项
 * @returns 头像图片的 Object URL
 */
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

/**
 * 获取平面皮肤头像（2D 正面）
 * @param options 渲染选项
 * @param opts Tauri invoke 选项
 * @returns 头像图片的 Object URL
 */
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

/**
 * 渲染斜二测 3D 头像
 * @param options 渲染选项
 * @param opts Tauri invoke 选项
 * @returns 头像图片的 Object URL
 */
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

/**
 * 获取玩家披风图片
 * @param uuid 玩家 UUID
 * @param opts Tauri invoke 选项
 * @returns 披风图片的 Object URL，无披风返回 null
 */
export const invokeGetSkinCape = async (
  uuid: string,
  opts?: InvokeOptions
): Promise<string | null> => {
  logger.info('获取披风', { uuid });
  const result: number[] | null = await invokeRust("get_skin_cape", { uuid }, opts);
  if (!result) return null;
  return pngBytesToUrl(result);
};

/** 皮肤模型信息 */
export interface SkinModelResponse {
  /** 模型类型（如 "default" / "slim"） */
  model: string;
  /** 是否来自 Mojang API */
  from_api: boolean;
}

/**
 * 获取玩家皮肤模型类型
 * @param uuid 玩家 UUID
 * @param opts Tauri invoke 选项
 * @returns 皮肤模型信息
 */
export const invokeGetSkinModel = async (
  uuid: string,
  opts?: InvokeOptions
): Promise<SkinModelResponse> => {
  logger.info('获取皮肤模型', { uuid });
  return await invokeRust("get_skin_model", { uuid }, opts);
};

/** Minecraft 用户资料 */
export interface MinecraftUserProfile {
  /** 玩家 UUID */
  id: string;
  /** 玩家名称 */
  name: string;
  /** 是否为旧版（legacy）账户 */
  legacy?: boolean;
  /** 是否为演示版账户 */
  demo?: boolean;
}

/**
 * 通过玩家名称获取 UUID 和资料
 * @param username 玩家名称
 * @param opts Tauri invoke 选项
 * @returns 玩家资料
 */
export const invokeGetUuidByUsername = async (
  username: string,
  opts?: InvokeOptions
): Promise<MinecraftUserProfile> => {
  logger.info('通过名称获取UUID', { username });
  return await invokeRust("get_uuid_by_username", { username }, opts);
};

/**
 * 批量通过玩家名称获取 UUID
 * @param usernames 玩家名称数组
 * @param opts Tauri invoke 选项
 * @returns 玩家资料列表
 */
export const invokeGetUuidsByUsernames = async (
  usernames: string[],
  opts?: InvokeOptions
): Promise<MinecraftUserProfile[]> => {
  logger.info('批量获取UUID', { count: usernames.length });
  return await invokeRust("get_uuids_by_usernames", { usernames }, opts);
};

let canonicalUuids: { steve: string; alex: string } | null = null;
let canonicalPromise: Promise<{ steve: string; alex: string } | null> | null = null;

/**
 * 确保已获取 Steve 和 Alex 的规范 UUID（懒加载缓存）
 * @returns Steve 和 Alex 的 UUID 对象，失败返回 null
 */
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

/**
 * 获取规范皮肤 UUID（根据模型类型返回 Steve 或 Alex 的 UUID）
 * @param isSlim 是否为纤细模型（Alex）
 * @returns UUID 字符串，未初始化返回 null
 */
export function getCanonicalSkinUuid(isSlim: boolean): string | null {
  if (!canonicalUuids) return null;
  return isSlim ? canonicalUuids.alex : canonicalUuids.steve;
}
