import { useState, useEffect, useCallback } from 'react';
import { invokeGetSkinHead, invokeRenderIsometricAvatar } from '@/api/skin';

interface UseSkinAvatarOptions {
  uuid: string;
  size?: number;
  showHat?: boolean;
}

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

interface UseSkinIsometricOptions {
  uuid: string;
  size?: number;
  showHat?: boolean;
}

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
