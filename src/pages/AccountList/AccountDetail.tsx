// TODO: 测试一下如果登录了已经登录了的正版账户，会怎么样？

import { useState, useEffect, useCallback, useRef } from "react";
import { UserPlus, Trash2, LogIn, Star, ExternalLink, Copy, X, Loader2 } from "lucide-react";
import { useAuthStore } from "@/stores/authStore";
import { useAccountSelectionStore } from "@/stores/accountSelectionStore";
import { useDeviceCodeLogin } from "@/hooks/useDeviceCodeLogin";
import { SkinAvatar, ConfirmPopup, useNotification, Page, PageSection, SettingsPanel, EmptyState } from "@/components/common";
import Popup from "@/components/Popup";
import { logger } from "@/helper/logger";
import { AccountType, startDeviceCode, type DeviceCodeResponse } from "@/api";
import { openUrl } from "@/helper/rustInvoke";
import { Selector } from "@/components/common/Selector";
import { getErrorMessage } from "@/utils/errorUtils";

const AccountDetail = () => {
  const { selectedUuid, selectAccount, clearSelection, showAddPopup, closeAddPopup, openAddPopup } = useAccountSelectionStore();
  const {
    accounts,
    currentAccount,
    deleteAccount,
    addAccount,
  } = useAuthStore();
  const { error: notifyError } = useNotification();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [addName, setAddName] = useState("");
  const [addType, setAddType] = useState<AccountType>(AccountType.Offline);
  const [adding, setAdding] = useState(false);

  // 无选中时自动选中 currentAccount 或第一个账户
  useEffect(() => {
    if (!selectedUuid && accounts.length > 0) {
      selectAccount(currentAccount?.uuid ?? accounts[0].uuid);
    }
  }, [accounts, currentAccount, selectedUuid]);

  const account = selectedUuid
    ? accounts.find(a => a.uuid === selectedUuid)
    : currentAccount;

  const isCurrent = account?.uuid === currentAccount?.uuid;

  const handleAddAccount = async () => {
    if (!addName.trim()) return;
    setAdding(true);
    try {
      await addAccount(addName.trim(), addType);
      closeAddPopup();
      setAddName("");
    } catch (e) {
      notifyError("添加失败", getErrorMessage(e));
    } finally {
      setAdding(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!account) return;
    try {
      await deleteAccount(account.uuid);
      clearSelection();
      setShowDeleteConfirm(false);
    } catch (e) {
      logger.error("删除账户失败", e);
    }
  };

  const formatTime = (t: string | null) => {
    if (!t) return "从未登录";
    try {
      return new Date(t).toLocaleString("zh-CN", {
        year: "numeric", month: "2-digit", day: "2-digit",
        hour: "2-digit", minute: "2-digit",
      });
    } catch { return t; }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "microsoft": return "Microsoft 账户";
      case "offline": return "离线账户";
      case "third-party": return "第三方账户";
      default: return type;
    }
  };

  if (!account) {
    return (
      <Page>
        <EmptyState
          title="在侧边栏选择一个账户，或添加一个新账户"
          action={{ label: "添加账户", onClick: () => openAddPopup() }}
          className="p-6"
        />

        <AddAccountPopup
          isOpen={showAddPopup}
          onClose={closeAddPopup}
          addName={addName}
          setAddName={setAddName}
          addType={addType}
          setAddType={setAddType}
          adding={adding}
          onConfirm={handleAddAccount}
        />
      </Page>
    );
  }

  return (
    <Page className="p-6 max-w-2xl mx-auto">
      <PageSection>
          {/* 账户信息 */}
          <SettingsPanel label="账户信息">
            <SettingsPanel.Item noPadding>
              <div className="px-4 py-4 flex items-center gap-4">
                <SkinAvatar uuid={account.uuid} avatarMode="isometric" size={64} />
                <div className="flex items-center gap-2">
                  {isCurrent && <Star className="w-4 h-4 text-amber-400 fill-amber-400" />}
                  <h1 className="text-base font-medium text-text-primary">{account.name}</h1>
                  <span className="text-xs text-text-secondary">{getTypeLabel(account.account_type)}</span>
                </div>
              </div>
            </SettingsPanel.Item>

            <SettingsPanel.Item>
              <SettingsPanel.Row label="UUID">
                <span className="text-xs font-mono text-text-primary">{account.uuid}</span>
              </SettingsPanel.Row>
            </SettingsPanel.Item>

            <SettingsPanel.Item>
              <SettingsPanel.Row label="创建时间">
                <span className="text-xs text-text-primary">{formatTime(account.create_time)}</span>
              </SettingsPanel.Row>
            </SettingsPanel.Item>

            <SettingsPanel.Item>
              <SettingsPanel.Row label="上次登录">
                <span className="text-xs text-text-primary">{formatTime(account.last_login_time)}</span>
              </SettingsPanel.Row>
            </SettingsPanel.Item>
          </SettingsPanel>
        </PageSection>

        <PageSection>
          {/* 操作 */}
          <SettingsPanel label="操作">
            <SettingsPanel.Item>
              <SettingsPanel.Row label="删除账户">
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 text-xs font-medium hover:bg-red-500/20 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  删除
                </button>
              </SettingsPanel.Row>
            </SettingsPanel.Item>
          </SettingsPanel>
        </PageSection>

        {/* 删除确认 */}
        <ConfirmPopup
          isOpen={showDeleteConfirm}
          title="确认删除"
          message={`确定要删除 ${account?.name} 吗？此操作不可撤销。`}
          confirmText="删除"
          cancelText="取消"
          confirmType="danger"
          showIcon
          iconType="warning"
          onConfirm={handleDeleteAccount}
          onCancel={() => setShowDeleteConfirm(false)}
          onClose={() => setShowDeleteConfirm(false)}
        />

      {/* 添加弹窗 */}
      <AddAccountPopup
        isOpen={showAddPopup}
        onClose={closeAddPopup}
        addName={addName}
        setAddName={setAddName}
        addType={addType}
        setAddType={setAddType}
        adding={adding}
        onConfirm={handleAddAccount}
      />
    </Page>
  );
};

interface AddAccountPopupProps {
  isOpen: boolean;
  onClose: () => void;
  addName: string;
  setAddName: (v: string) => void;
  addType: AccountType;
  setAddType: (v: AccountType) => void;
  adding: boolean;
  onConfirm: () => void;
}

const AddAccountPopup = ({
  isOpen, onClose, addName, setAddName, addType, setAddType, adding, onConfirm,
}: AddAccountPopupProps) => {
  const { codePhase, loginPhase, progressMsg, showCode, cancel, reset } = useDeviceCodeLogin(onClose);

  useEffect(() => {
    reset();
  }, [isOpen, addType, reset]);

  const handleClose = useCallback(() => {
    cancel();
    onClose();
  }, [cancel, onClose]);

  return (
    <Popup isOpen={isOpen} onClose={handleClose} contentClassName="flex items-center justify-center" title="添加账户">
      <div className="p-1 space-y-4 w-90 text-center">
        {loginPhase === "completing" ? (
          <div className="flex flex-col items-center gap-3 py-6">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
            <p className="text-sm text-text-secondary">{progressMsg}</p>
          </div>
        ) : (
          <>
            {!codePhase && (
              <Selector
                options={[
                  { value: AccountType.Offline, label: "离线" },
                  { value: AccountType.Microsoft, label: "微软" },
                  { value: AccountType.ThirdParty, label: "第三方" },
                ]}
                value={addType}
                onChange={setAddType}
                className="w-full"
              />
            )}

            {addType === AccountType.Offline && (
              <AddOffline addName={addName} setAddName={setAddName} adding={adding} onConfirm={onConfirm} />
            )}
            {addType === AccountType.Microsoft && (
              <AddMicrosoft onClose={handleClose} onCodeSuccess={showCode} codePhase={codePhase} />
            )}
            {addType === AccountType.ThirdParty && (
              <AddThirdparty addName={addName} setAddName={setAddName} adding={adding} onConfirm={onConfirm} />
            )}
          </>
        )}
      </div>
    </Popup>
  );
};

// ── AddOffline ──

interface AddOfflineProps {
  addName: string;
  setAddName: (v: string) => void;
  adding: boolean;
  onConfirm: () => void;
}

const AddOffline = ({ addName, setAddName, adding, onConfirm }: AddOfflineProps) => {
  const [disabledInput, setDisabledInput] = useState(false);

  useEffect(() => {
    setDisabledInput(!addName.trim() || adding);
  }, [addName]);

  return (
    <>
      <input
        value={addName}
        onChange={(e) => setAddName(e.target.value)}
        placeholder="游戏名称（1-16 字符）"
        maxLength={16}
        className="w-full px-3 py-2 rounded-lg mb-2
        bg-surface-hover border border-(--color-border)
        text-primary text-sm placeholder-text-secondary/50
        focus:ring-1 focus:ring-(--color-primary)
        "
      />
      <button
        onClick={onConfirm}
        disabled={disabledInput}
        className={`
          flex items-center justify-center gap-1.5
          w-full py-2 rounded-(--radius-sm)
          bg-(--color-primary)
          hover:bg-(--color-primary-hover) hover:text-(--color-text-primary) 
          active:bg-primary-active
          text-(--color-text-primary) text-sm font-light
          transition-colors
          disabled:opacity/50
          disabled:text-(--color-text-disabled)
          disabled:cursor-not-allowed
          focus:outline-none focus:border-(--color-primary)/50
          focus:ring-1 focus:ring-(--color-primary)/20`
        }
      >
        {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
        <span>{adding ? "添加中..." : "添加"}</span>
      </button>
    </>
  )
};

// ── AddMicrosoft ──

interface AddMicrosoftProps {
  onClose: () => void;
  onCodeSuccess: (v: DeviceCodeResponse) => void;
  codePhase: boolean;
}

const AddMicrosoft = ({ onClose, onCodeSuccess, codePhase }: AddMicrosoftProps) => {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const { error: notifyError, success: notifySuccess } = useNotification();
  const mountedRef = useRef(true);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const handleLogin = async () => {
    setLoading(true);
    try {
      const result = await startDeviceCode();
      if (!mountedRef.current) return;
      setCode(result.userCode);
      await navigator.clipboard.writeText(result.userCode);
      if (!mountedRef.current) return;
      openUrl(result.url);
      onCodeSuccess(result);
    } catch (e) {
      if (!mountedRef.current) return;
      notifyError("获取设备码失败", getErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      notifySuccess("复制成功", "验证码已复制到剪贴板");
    } catch {
      notifyError("复制失败", "无法访问剪贴板");
    }
  };

  const handleReopen = () => {
    openUrl("https://microsoft.com/devicelogin");
  };

  if (codePhase) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-text-secondary leading-relaxed">
          登录网页将自动开启，请在网页中输入{" "}
          <span className="text-primary font-mono font-bold text-base tracking-widest select-all">
            {code}
          </span>
          {" "}（已自动复制）。
        </p>
        <div className="flex gap-2">
          <button
            onClick={handleReopen}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-surface-hover text-text-primary text-sm font-medium hover:bg-border transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            重新打开网页
          </button>
          <button
            onClick={handleCopy}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-primary/10 text-primary text-sm font-medium hover:bg-primary/20 transition-colors"
          >
            <Copy className="w-4 h-4" />
            复制代码
          </button>
        </div>
        <button
          onClick={onClose}
          className="flex items-center justify-center gap-1.5 py-2 rounded-lg bg-red-500/10 text-red-400 text-sm font-medium hover:bg-red-500/20 transition-colors w-full"
        >
          <X className="w-4 h-4" />
          取消
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-text-secondary leading-relaxed">
        点击登录按钮后将自动开启登录网页，进入登录流程
      </p>
      <button
        onClick={() => openUrl("https://www.minecraft.net/zh-hans/store/minecraft-deluxe-collection")}
        className="flex items-center justify-center gap-1.5 text-xs 
          text-primary hover:underline mx-auto font-light text-(--color-secondary)"
      >
        <ExternalLink className="w-3.5 h-3.5" />
        购买 Minecraft
      </button>
      <button
        onClick={handleLogin}
        disabled={loading}
        className="w-full py-2 rounded-lg bg-gradient-to-r from-primary to-primary/90 font-light
          bg-(--color-primary) hover:bg-(--color-primary-hover) 
          disabled:opacity-50 transition-all text-sm
          flex items-center justify-center gap-2"
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogIn className="w-4 h-4" />}
        <span>{loading ? "获取中..." : "登录"}</span>
      </button>
    </div>
  );
};

// ── AddThirdparty ──

interface AddThirdpartyProps {
  addName: string;
  setAddName: (v: string) => void;
  adding: boolean;
  onConfirm: () => void;
}

const AddThirdparty = ({ }: AddThirdpartyProps) => (
  <>
    <h1>暂无... 开发中...</h1>
  </>
);

export default AccountDetail;
