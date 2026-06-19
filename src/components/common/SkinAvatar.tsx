import { useState, useEffect, useCallback } from 'react';
import { invokeGetSkinHead, invokeRenderIsometricAvatar } from '@/api/skin';

export interface SkinAvatarProps {
  uuid: string;
  size?: number;
  showHat?: boolean;
  className?: string;
  fallback?: string;
  avatarMode?: 'flat' | 'isometric';
}

export const SkinAvatar = ({
  uuid,
  size = 64,
  showHat = true,
  className,
  fallback,
  avatarMode = 'flat',
}: SkinAvatarProps) => {
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAvatar = useCallback(async () => {
    if (!uuid) return;
    setLoading(true);
    setError(null);
    try {
      const fn = avatarMode === 'flat' ? invokeGetSkinHead : invokeRenderIsometricAvatar;
      const actualSize = avatarMode === 'flat' ? size : Math.max(size * 3, 256);
      const result = await fn({ uuid, size: actualSize, showHat });
      setUrl(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : '获取头像失败');
    } finally {
      setLoading(false);
    }
  }, [uuid, size, showHat, avatarMode]);

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
