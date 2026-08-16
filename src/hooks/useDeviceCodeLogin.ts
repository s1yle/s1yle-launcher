import { useState, useEffect, useCallback, useRef } from 'react';
import { listen } from '@tauri-apps/api/event';
import { cancelDeviceCode, pollAndCompleteLogin, type DeviceCodeResponse } from '@/api';
import type { LoginProgressEvent } from '@/api/types/account';
import { useAuthStore } from '@/stores/authStore';
import { useNotification } from '@/components/common/NotificationProvider';
import { getErrorMessage } from '@/utils/errorUtils';
import { logger } from '@/helper/logger';

/**
 * 微软设备码登录状态机 hook。
 *
 * 状态流转：idle → showing-code（展示设备码）→ polling（轮询授权）→ completing（已授权，认证入库中）。
 * 负责启动/取消设备码轮询、监听 login-progress 事件、成功后刷新账户列表并关闭弹窗。
 *
 * @param onClose - 登录成功后的关闭回调（由弹窗提供）
 * @returns 展示设备码、轮询阶段、进度文案及 showCode/cancel/reset 控制方法
 */
export function useDeviceCodeLogin(onClose: () => void) {
  const { error: notifyError, success: notifySuccess } = useNotification();
  const [codePhase, setCodePhase] = useState(false);
  const [code, setCode] = useState<DeviceCodeResponse>();
  const [loginPhase, setLoginPhase] = useState<'polling' | 'completing'>('polling');
  const [progressMsg, setProgressMsg] = useState('正在等待用户授权...');
  const pollingRef = useRef(false);
  const onCloseRef = useRef(onClose);
  const notifyErrorRef = useRef(notifyError);
  const notifySuccessRef = useRef(notifySuccess);
  onCloseRef.current = onClose;
  notifyErrorRef.current = notifyError;
  notifySuccessRef.current = notifySuccess;

  const cancelPolling = useCallback(() => {
    if (pollingRef.current) {
      pollingRef.current = false;
      cancelDeviceCode().catch((e) => logger.error('取消登录流程失败', e));
    }
  }, []);

  const reset = useCallback(() => {
    cancelPolling();
    setCodePhase(false);
    setCode(undefined);
    setLoginPhase('polling');
  }, [cancelPolling]);

  // 监听 login-progress 事件，authorized 阶段切到 completing，其余更新进度文案
  useEffect(() => {
    let unlisten: (() => void) | undefined;
    let active = true;
    listen<LoginProgressEvent>('login-progress', (e) => {
      if (!active) return;
      const { step, message } = e.payload;
      if (step === 'authorized') {
        setLoginPhase('completing');
      }
      setProgressMsg(message);
    }).then((fn) => {
      if (active) unlisten = fn;
      else fn();
    });
    return () => {
      active = false;
      unlisten?.();
    };
  }, []);

  // 卸载时取消进行中的轮询
  useEffect(() => {
    return () => {
      cancelPolling();
    };
  }, [cancelPolling]);

  // 展示设备码（由 AddMicrosoft 在获取到设备码后调用），随后触发轮询
  const showCode = useCallback((deviceCode: DeviceCodeResponse) => {
    setCodePhase(true);
    setCode(deviceCode);
  }, []);

  // 拿到设备码后启动 pollAndCompleteLogin，成功刷新账户并关闭，失败重置
  useEffect(() => {
    if (!code) return;
    if (pollingRef.current) return;
    let active = true;
    pollingRef.current = true;
    setLoginPhase('polling');
    setProgressMsg('正在等待用户授权...');

    pollAndCompleteLogin()
      .then((info) => {
        if (!active) return;
        logger.info('Microsoft 账户添加成功', info);
        notifySuccessRef.current('登录成功', `Microsoft 账户 ${info.name} 已添加`);
        useAuthStore.getState().loadAccounts();
        onCloseRef.current();
      })
      .catch((e) => {
        if (!active) return;
        logger.error('登录流程失败', e);
        pollingRef.current = false;
        setLoginPhase('polling');
        setCodePhase(false);
        setCode(undefined);
        notifyErrorRef.current('登录失败', getErrorMessage(e));
      });

    return () => {
      active = false;
    };
  }, [code]);

  return { codePhase, loginPhase, progressMsg, showCode, cancel: cancelPolling, reset };
}
