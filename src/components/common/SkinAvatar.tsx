import { useState, useEffect, useCallback } from 'react';
import { invokeGetSkinHead, invokeRenderIsometricAvatar, invokeGetSkinModel, getCanonicalSkinUuid, ensureCanonicalSkinUuids } from '@/api/skin';
import { getErrorMessage } from '@/utils/errorUtils';

/** 皮肤头像组件 Props */
export interface SkinAvatarProps {
  uuid: string;
  size?: number;
  showHat?: boolean;
  className?: string;
  fallback?: string;
  avatarMode?: 'flat' | 'isometric';
  isSlim?: boolean;
}

/**
 * 皮肤头像组件。
 * 根据玩家 UUID 获取 Minecraft 皮肤头像，支持平面 / 等距两种渲染模式。
 */
export const SkinAvatar = ({
  uuid,
  size = 64,
  showHat = true,
  className,
  fallback,
  avatarMode = 'flat',
  isSlim: isSlimProp,
}: SkinAvatarProps) => {
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [_isSlim, setIsSlim] = useState<boolean | null>(isSlimProp ?? null);
  const [renderUuid, setRenderUuid] = useState<string>(uuid);

  // 降级为默认皮肤渲染时，使用 Steve/Alex 规范 UUID 统一缓存
  useEffect(() => {
    let cancelled = false;
    // uuid 变化时重置渲染目标与结果，避免残留上一个账户的头像
    setRenderUuid(uuid);
    setUrl(null);
    setError(null);

    const resolveUuid = async (slim: boolean) => {
      const canonical = getCanonicalSkinUuid(slim);
      if (canonical) {
        if (!cancelled) setRenderUuid(canonical);
        return;
      }
      await ensureCanonicalSkinUuids();
      const c = getCanonicalSkinUuid(slim);
      if (!cancelled && c) setRenderUuid(c);
    };

    if (isSlimProp !== undefined) {
      setIsSlim(isSlimProp);
      resolveUuid(isSlimProp);
      return;
    }
    invokeGetSkinModel(uuid).then((res) => {
      if (cancelled) return;
      const slim = res.model === 'slim';
      setIsSlim(slim);
      if (!res.from_api) resolveUuid(slim);
    }).catch(() => {});
    return () => { cancelled = true; };
  }, [uuid, isSlimProp]);

  const fetchAvatar = useCallback(async () => {
    if (!renderUuid) return;
    setLoading(true);
    setError(null);
    try {
      const fn = avatarMode === 'flat' ? invokeGetSkinHead : invokeRenderIsometricAvatar;
      const actualSize = avatarMode === 'flat' ? size : Math.max(size * 3, 256);
      const result = await fn({ uuid: renderUuid, size: actualSize, showHat });

      setUrl(result);
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, [renderUuid, size, showHat, avatarMode]);

  useEffect(() => {
    fetchAvatar();
    return () => {
      if (url) URL.revokeObjectURL(url);
    };
  }, [fetchAvatar]);

  if (loading) {
    return (
      <div
        className={className}
        style={{ width: size, height: size }}
        aria-label="加载中"
      />
    );
  }

  if (error || !url) {
    return fallback ? (
      <img
        src={fallback}
        alt="默认头像"
        className={className}
        style={{ width: size, height: size }}
      />
    ) : (
      <div
        className={className}
        style={{ width: size, height: size, background: 'var(--color-muted)' }}
        aria-label="头像加载失败"
      />
    );
  }

  return (
    <img
      src={url}
      alt="皮肤头像"
      className={className}
      style={{ width: size, height: size }}
    />
  );
};
