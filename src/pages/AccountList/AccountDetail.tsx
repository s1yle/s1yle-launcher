import { useState, useEffect, useCallback } from "react";
import { UserPlus, Trash2, LogIn, Star, Server, Loader2, User, Crown, Unlink, Link2, Mail, LogOut, ExternalLink, Copy, X } from "lucide-react";
import { useAuthStore } from "@/stores/authStore";
import { useAdminStore } from "@/stores/adminStore";
import { useAccountSelectionStore } from "@/stores/accountSelectionStore";
import { useLoadingAction } from "@/hooks/useLoadingAction";
import { LoadingSurface, Reveal, SkinAvatar, ConfirmPopup, useNotification, Animated } from "@/components/common";
import Popup from "@/components/Popup";
import { logger } from "@/helper/logger";
import { AccountType } from "@/api";
import { invokeMicrosoftDeviceCode } from "@/api/account";
import { openUrl } from "@/helper/rustInvoke";
import { Selector } from "@/components/common/Selector";

const AccountDetail = () => {
  const { selectedUuid, selectAccount, clearSelection, showAddPopup, closeAddPopup, openAddPopup } = useAccountSelectionStore();
  const {
    accounts,
    currentAccount,
    loadAccounts,
    setCurrentAccount,
    deleteAccount,
    addAccount,
  } = useAuthStore();
  const {
    session: adminSession,
    isLoggedIn: adminLoggedIn,
    logout: adminLogout,
    bindPlayer,
    unbindPlayer,
  } = useAdminStore();

  const { error: notifyError } = useNotification();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [addName, setAddName] = useState("");
  const [addType, setAddType] = useState<AccountType>(AccountType.Offline);
  const [adding, setAdding] = useState(false);

  const loadAccountsAction = useLoadingAction({
    key: "account:list",
    action: async () => {
      await loadAccounts();
    },
  });

  useEffect(() => {
    loadAccountsAction();
  }, []);

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
  const isBound = account ? adminSession?.bound_player_uuids.includes(account.uuid) : false;

  const handleAddAccount = async () => {
    if (!addName.trim()) return;
    setAdding(true);
    try {
      await addAccount(addName.trim(), addType);
      closeAddPopup();
      setAddName("");
    } catch (e) {
      notifyError("添加失败", e instanceof Error ? e.message : "未知错误");
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

  const handleSetCurrent = async () => {
    if (!account) return;
    try {
      await setCurrentAccount(account.uuid);
      await loadAccounts();
    } catch (e) {
      logger.error("设置当前账户失败", e);
    }
  };

  const handleBind = async () => {
    if (!adminSession || !account) return;
    try {
      await bindPlayer(account.uuid);
    } catch (e) {
      logger.error("绑定失败", e);
    }
  };

  const handleUnbind = async () => {
    if (!adminSession || !account) return;
    try {
      await unbindPlayer(account.uuid);
    } catch (e) {
      logger.error("解绑失败", e);
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
      case "thrid-party": return "第三方账户";
      default: return type;
    }
  };

  if (!account) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-[400px] text-center">
        <style>{`button{cursor:pointer}`}</style>
        <User className="w-16 h-16 text-[var(--color-text-secondary)]/20 mb-4" />
        <p className="text-[var(--color-text-secondary)] text-sm mb-6">
          在侧边栏选择一个账户，或添加一个新账户
        </p>
        <button
          onClick={() => openAddPopup()}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--color-primary)]/10 text-[var(--color-primary)] text-sm hover:bg-[var(--color-primary)]/20 transition-colors"
        >
          <UserPlus className="w-4 h-4" />
          添加账户
        </button>

        <AddAccountPopup
          isOpen={showAddPopup}
          onClose={() => closeAddPopup()}
          addName={addName}
          setAddName={setAddName}
          addType={addType}
          setAddType={setAddType}
          adding={adding}
          onConfirm={handleAddAccount}
        />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <style>{`button{cursor:pointer}`}</style>
      <LoadingSurface loadingKey="account:list" skeleton="card" skeletonCount={1}>
        {/* 头像 & 名称 */}
        <Reveal direction="up" distance={16} duration={0.4}>
          <div className="flex flex-col items-center py-8">
            <div className="w-28 h-28 mb-4">
              <SkinAvatar uuid={account.uuid} avatarMode="isometric" size={112} />
            </div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-[var(--color-text-primary)]">
                {account.name}
              </h1>
              {isCurrent && (
                <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
              )}
            </div>
            <span className="text-sm text-[var(--color-text-secondary)] mt-1">
              {getTypeLabel(account.account_type)}
            </span>
          </div>
        </Reveal>

        {/* 信息卡片 */}
        <Reveal direction="up" distance={16} duration={0.4} delay={0.1}>
          <InfoCard
            items={[
              { label: "UUID", value: account.uuid, mono: true },
              { label: "创建时间", value: formatTime(account.create_time) },
              { label: "上次登录", value: formatTime(account.last_login_time) },
            ]}
          />
        </Reveal>

        {/* 服主关联 */}
        <Reveal direction="up" distance={16} duration={0.4} delay={0.2}>
          <div className="rounded-xl bg-[var(--color-surface-hover)] border border-[var(--color-border)] p-4">
            <div className="flex items-center gap-2 mb-3">
              <Server className="w-4 h-4 text-purple-400" />
              <h3 className="text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wider">
                服主关联
              </h3>
            </div>

            {!adminLoggedIn ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)]">
                  <Unlink className="w-4 h-4" />
                  <span>未关联服主账号</span>
                </div>
                <span className="text-xs text-[var(--color-text-tertiary)]">
                  点击顶部导航切换服主身份
                </span>
              </div>
            ) : isBound ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm">
                  <Crown className="w-4 h-4 text-amber-400" />
                  <span className="text-[var(--color-text-primary)]">
                    已绑定至 <span className="text-purple-400">{adminSession?.email}</span>
                  </span>
                </div>
                <button
                  onClick={handleUnbind}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 text-xs font-medium hover:bg-red-500/20 transition-colors"
                >
                  <Link2 className="w-3.5 h-3.5" />
                  解绑
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)]">
                  <Link2 className="w-4 h-4" />
                  <span>此玩家尚未绑定</span>
                </div>
                <button
                  onClick={handleBind}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-500/10 text-purple-400 text-xs font-medium hover:bg-purple-500/20 transition-colors"
                >
                  <Crown className="w-3.5 h-3.5" />
                  绑定到服主
                </button>
              </div>
            )}

            {adminLoggedIn && (
              <div className="mt-3 pt-3 border-t border-[var(--color-border)] flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-[var(--color-text-secondary)]">
                  <Mail className="w-3.5 h-3.5" />
                  {adminSession?.email}
                </div>
                <button
                  onClick={() => adminLogout()}
                  className="flex items-center gap-1 text-xs text-red-400 hover:text-red-300 transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  退出
                </button>
              </div>
            )}
          </div>
        </Reveal>

        {/* 操作区 */}
        <Reveal direction="up" distance={16} duration={0.4} delay={0.3}>
          <div className="flex items-center gap-3">
            {!isCurrent && (
              <button
                onClick={handleSetCurrent}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg bg-[var(--color-primary)]/10 text-[var(--color-primary)] text-sm font-medium hover:bg-[var(--color-primary)]/20 transition-colors"
              >
                <Star className="w-4 h-4" />
                设为当前
              </button>
            )}
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className={`${isCurrent ? "flex-1" : ""} flex items-center justify-center gap-2 px-1.5 py-2.5 rounded-lg bg-red-500/10 text-red-400 text-sm font-medium hover:bg-red-500/20 transition-colors`}
            >
              <Trash2 className="w-4 h-4" />
              删除
            </button>
          </div>
        </Reveal>
      </LoadingSurface>

      {/* 添加弹窗 */}
      <AddAccountPopup
        isOpen={showAddPopup}
        onClose={() => closeAddPopup()}
        addName={addName}
        setAddName={setAddName}
        addType={addType}
        setAddType={setAddType}
        adding={adding}
        onConfirm={handleAddAccount}
      />

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
    </div>
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
  const [codePhase, setCodePhase] = useState(false);

  useEffect(() => {
    setCodePhase(false);
  }, [isOpen, addType]);

  return (
    <Popup isOpen={isOpen} onClose={onClose} contentClassName="flex items-center justify-center" title="添加账户">
      <div className="p-1 space-y-4 w-80 text-center">
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

        <Animated stagger={0.08}>
          {addType === AccountType.Offline && (
            <Animated.Item>
              <AddOffline addName={addName} setAddName={setAddName} adding={adding} onConfirm={onConfirm} />
            </Animated.Item>
          )}
          {addType === AccountType.Microsoft && (
            <Animated.Item>
              <AddMicrosoft onClose={onClose} onCodePhase={setCodePhase} />
            </Animated.Item>
          )}
          {addType === AccountType.ThirdParty && (
            <Animated.Item>
              <AddThirdparty addName={addName} setAddName={setAddName} adding={adding} onConfirm={onConfirm} />
            </Animated.Item>
          )}
        </Animated>
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

const AddOffline = ({ addName, setAddName, adding, onConfirm }: AddOfflineProps) => (
  <>
    <input
      value={addName}
      onChange={(e) => setAddName(e.target.value)}
      placeholder="游戏名称（1-16 字符）"
      maxLength={16}
      className="w-full px-3 py-2 rounded-lg mb-2
        bg-[var(--color-surface-hover)] border border-[var(--color-border)]
        text-[var(--color-text-primary)] text-sm placeholder-[var(--color-text-secondary)]/50
        focus:outline-none focus:border-[var(--color-primary)]/50 
        focus:ring-1 focus:ring-[var(--color-primary)]/20"
    />
    <button
      onClick={onConfirm}
      disabled={!addName.trim() || adding}
      className="w-full py-2 rounded-lg bg-gradient-to-r 
        from-[var(--color-primary)] to-[var(--color-primary)]/90 text-white font-medium
        hover:from-[var(--color-primary)]/90 hover:to-[var(--color-primary)]/80 
        disabled:opacity-50 transition-all text-sm flex items-center justify-center gap-2"
    >
      {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
      <span>{adding ? "添加中..." : "添加"}</span>
    </button>
  </>
);

// ── AddMicrosoft ──

interface AddMicrosoftProps {
  onClose: () => void;
  onCodePhase: (v: boolean) => void;
}

const AddMicrosoft = ({ onClose, onCodePhase }: AddMicrosoftProps) => {
  const [phase, setPhase] = useState<"info" | "code">("info");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const { error: notifyError, success: notifySuccess } = useNotification();

  const handleLogin = async () => {
    setLoading(true);
    try {
      const result = await invokeMicrosoftDeviceCode();
      setCode(result.user_code);
      await navigator.clipboard.writeText(result.user_code);
      openUrl(result.verification_uri);
      setPhase("code");
      onCodePhase(true);
    } catch (e) {
      notifyError("获取设备码失败", e instanceof Error ? e.message : "未知错误");
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

  if (phase === "code") {
    return (
      <div className="space-y-4">
        <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
          登录网页将自动开启，请在网页中输入{" "}
          <span className="text-[var(--color-primary)] font-mono font-bold text-base tracking-widest select-all">
            {code}
          </span>
          {" "}（已自动复制）。
        </p>
        <div className="flex gap-2">
          <button
            onClick={handleReopen}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-[var(--color-surface-hover)] text-[var(--color-text-primary)] text-sm font-medium hover:bg-[var(--color-border)] transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            重新打开网页
          </button>
          <button
            onClick={handleCopy}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-[var(--color-primary)]/10 text-[var(--color-primary)] text-sm font-medium hover:bg-[var(--color-primary)]/20 transition-colors"
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
      <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
        点击登录按钮后将自动开启登录网页，进入登录流程。
      </p>
      <button
        onClick={() => openUrl("https://www.minecraft.net/zh-hans/store/minecraft-deluxe-collection")}
        className="flex items-center justify-center gap-1.5 text-xs text-[var(--color-primary)] hover:underline mx-auto"
      >
        <ExternalLink className="w-3.5 h-3.5" />
        购买 Minecraft
      </button>
      <button
        onClick={handleLogin}
        disabled={loading}
        className="w-full py-2 rounded-lg bg-gradient-to-r from-purple-500 to-purple-600 text-white font-medium
          hover:from-purple-600 hover:to-purple-700 disabled:opacity-50 transition-all text-sm
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

const AddThirdparty = ({ addName, setAddName, adding, onConfirm }: AddThirdpartyProps) => (
  <>
    <h1>暂无... 开发中...</h1>
  </>
);

interface InfoCardItem {
  label: string;
  value: string;
  mono?: boolean;
}

const InfoCard = ({ items }: { items: InfoCardItem[] }) => (
  <div className="rounded-xl bg-[var(--color-surface-hover)] border border-[var(--color-border)] divide-y divide-[var(--color-border)]">
    {items.map((item) => (
      <div key={item.label} className="flex items-center justify-between px-4 py-3">
        <span className="text-xs text-[var(--color-text-secondary)]">{item.label}</span>
        <span className={`text-xs text-[var(--color-text-primary)] ${item.mono ? "font-mono" : ""}`}>
          {item.value}
        </span>
      </div>
    ))}
  </div>
);

export default AccountDetail;
