import { useState, useEffect, useCallback } from 'react';
import { invokeGetSkinHead, invokeRenderIsometricAvatar } from '@/api/skin';

/** useSkinAvatar 的配置选项 */
interface UseSkinAvatarOptions {
  uuid: string;
  size?: number;
  showHat?: boolean;
}

/**
 * 皮肤头像 hook - 获取 Minecraft 玩家皮肤的 2D 头像
 * @param options - 配置选项
 * @param options.uuid - 玩家 UUID
 * @param options.size - 头像尺寸，默认 64
 * @param options.showHat - 是否显示帽子层，默认 true
 * @returns 包含头像 URL、加载状态、错误信息和刷新方法的对象
 */
export const useSkinAvatar = (options: UseSkinAvatarOptions) => {
  const { uuid, size = 64, showHat = true } = options;
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAvatar = useCallback(async () => {
    if (!uuid) return;
    setLoading(true);
    setError(null);
    try {
      const result = await invokeGetSkinHead({ uuid, size, showHat });
      setUrl(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : '获取头像失败');
    } finally {
      setLoading(false);
    }
  }, [uuid, size, showHat]);

  useEffect(() => {
    fetchAvatar();
    return () => {
      if (url) URL.revokeObjectURL(url);
    };
  }, [fetchAvatar]);

  return { url, loading, error, refetch: fetchAvatar };
};

/** useSkinIsometric 的配置选项 */
interface UseSkinIsometricOptions {
  uuid: string;
  size?: number;
  showHat?: boolean;
}

/**
 * 3D 等距皮肤 hook - 获取 Minecraft 玩家皮肤的 3D 等距渲染
 * @param options - 配置选项
 * @param options.uuid - 玩家 UUID
 * @param options.size - 渲染尺寸，默认 256
 * @param options.showHat - 是否显示帽子层，默认 true
 * @returns 包含渲染 URL、加载状态、错误信息和刷新方法的对象
 */
export const useSkinIsometric = (options: UseSkinIsometricOptions) => {
  const { uuid, size = 256, showHat = true } = options;
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchIsometric = useCallback(async () => {
    if (!uuid) return;
    setLoading(true);
    setError(null);
    try {
      const result = await invokeRenderIsometricAvatar({ uuid, size, showHat });
      setUrl(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : '获取3D头像失败');
    } finally {
      setLoading(false);
    }
  }, [uuid, size, showHat]);

  useEffect(() => {
    fetchIsometric();
    return () => {
      if (url) URL.revokeObjectURL(url);
    };
  }, [fetchIsometric]);

  return { url, loading, error, refetch: fetchIsometric };
};
