import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { User, UserPlus, Trash2, LogIn, Star, Server, Loader2, UserMinus } from "lucide-react";
import { useAccountStore } from "@/stores/accountStore";
import { useAdminStore } from "@/stores/adminStore";
import { useLoadingAction } from "@/hooks/useLoadingAction";
import { LoadingSurface } from "@/components/common";
import Popup from "@/components/Popup";
import { logger } from "@/helper/logger";

const AccountList = () => {
  const navigate = useNavigate();
  const {
    accounts,
    currentAccount,
    loadAccounts,
    setCurrentAccount,
    deleteAccount,
  } = useAccountStore();
  const {
    session: adminSession,
    isLoggedIn: adminLoggedIn,
    logout: adminLogout,
    bindPlayer,
    unbindPlayer,
  } = useAdminStore();

  const [showAddPopup, setShowAddPopup] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [addName, setAddName] = useState("");
  const [addType, setAddType] = useState<"microsoft" | "offline">("offline");
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState("");

  const loadAccountsAction = useLoadingAction({
    key: "account:list",
    action: async () => {
      await loadAccounts();
    },
  });

  useEffect(() => {
    loadAccountsAction();
  }, []);

  const handleAddAccount = async () => {
    if (!addName.trim()) return;
    setAdding(true);
    setAddError("");
    try {
      await useAccountStore.getState().addAccount(addName.trim(), addType);
      setShowAddPopup(false);
      setAddName("");
      setAddError("");
    } catch (e) {
      setAddError(e instanceof Error ? e.message : "添加失败");
    } finally {
      setAdding(false);
    }
  };

  const handleDeleteAccount = async (uuid: string) => {
    try {
      await deleteAccount(uuid);
      setShowDeleteConfirm(null);
    } catch (e) {
      logger.error("删除账户失败", e);
    }
  };

  const handleSetCurrent = async (uuid: string) => {
    try {
      await setCurrentAccount(uuid);
      await loadAccounts();
    } catch (e) {
      logger.error("设置当前账户失败", e);
    }
  };

  const handleBindPlayer = async () => {
    if (!adminSession || !currentAccount) return;
    try {
      await bindPlayer(currentAccount.uuid);
      logger.info("玩家绑定成功");
    } catch (e) {
      logger.error("绑定失败", e);
    }
  };

  const handleUnbindPlayer = async () => {
    if (!adminSession || !currentAccount) return;
    try {
      await unbindPlayer(currentAccount.uuid);
      logger.info("解绑成功");
    } catch (e) {
      logger.error("解绑失败", e);
    }
  };

  const isCurrentBound = adminSession?.bound_player_uuids.includes(currentAccount?.uuid ?? "");
  const formatTime = (t: string | null) => {
    if (!t) return "从未登录";
    try {
      return new Date(t).toLocaleString("zh-CN", {
        year: "numeric", month: "2-digit", day: "2-digit",
        hour: "2-digit", minute: "2-digit",
      });
    } catch { return t; }
  };

  return (
    <div className="p-4 space-y-4">
      <LoadingSurface loadingKey="account:list" skeleton="list" skeletonCount={4}>
        {/* 当前账户 */}
        <div className="p-4 rounded-xl bg-[var(--color-surface-hover)] border border-[var(--color-border)]">
          <h3 className="text-xs font-medium text-[var(--color-text-secondary)] mb-3 uppercase tracking-wider">
            当前账户
          </h3>
          {currentAccount ? (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--color-primary)]/80 to-[var(--color-primary)] flex items-center justify-center text-white font-semibold">
                {currentAccount.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1">
                <div className="font-medium text-[var(--color-text-primary)]">
                  {currentAccount.name}
                </div>
                <div className="text-xs text-[var(--color-text-secondary)]">
                  {currentAccount.account_type === "microsoft" ? "Microsoft 账户" : "离线账户"}
                  {isCurrentBound && " · 已绑定服主"}
                </div>
              </div>
              {adminLoggedIn && (
                <button
                  onClick={isCurrentBound ? handleUnbindPlayer : handleBindPlayer}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    isCurrentBound
                      ? "bg-red-500/10 text-red-400 hover:bg-red-500/20"
                      : "bg-purple-500/10 text-purple-400 hover:bg-purple-500/20"
                  }`}
                >
                  {isCurrentBound ? "解绑服主" : "绑定服主"}
                </button>
              )}
            </div>
          ) : (
            <div className="text-sm text-[var(--color-text-secondary)]">未选择账户</div>
          )}
        </div>

        {/* 账户列表 */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wider">
              账户列表 ({accounts.length})
            </h3>
            <button
              onClick={() => setShowAddPopup(true)}
              className="flex items-center gap-1 text-xs text-[var(--color-primary)] hover:text-[var(--color-primary)]/80 transition-colors"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>添加账户</span>
            </button>
          </div>

          <div className="space-y-2">
            {accounts.map((acc) => (
              <div
                key={acc.uuid}
                className={`p-3 rounded-lg border transition-all duration-200 flex items-center gap-3 ${
                  currentAccount?.uuid === acc.uuid
                    ? "bg-[var(--color-primary)]/5 border-[var(--color-primary)]/30"
                    : "bg-[var(--color-surface-hover)] border-[var(--color-border)] hover:border-[var(--color-primary)]/30"
                }`}
              >
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[var(--color-primary)]/80 to-[var(--color-primary)] flex items-center justify-center text-white font-semibold text-sm">
                  {acc.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-[var(--color-text-primary)] text-sm truncate">
                    {acc.name}
                  </div>
                  <div className="text-[11px] text-[var(--color-text-secondary)]">
                    {acc.account_type === "microsoft" ? "Microsoft" : "离线"}
                    {" · "}上次 {formatTime(acc.last_login_time)}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {currentAccount?.uuid !== acc.uuid && (
                    <button
                      onClick={() => handleSetCurrent(acc.uuid)}
                      className="p-1.5 rounded-lg hover:bg-[var(--color-primary)]/10 text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] transition-colors"
                      title="切换到此账户"
                    >
                      <LogIn className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button
                    onClick={() => setShowDeleteConfirm(acc.uuid)}
                    className="p-1.5 rounded-lg hover:bg-red-500/10 text-[var(--color-text-secondary)] hover:text-red-400 transition-colors"
                    title="删除账户"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
            {accounts.length === 0 && (
              <div className="text-center py-8 text-[var(--color-text-secondary)]">
                <User className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">暂无账户</p>
                <button
                  onClick={() => setShowAddPopup(true)}
                  className="mt-2 text-xs text-[var(--color-primary)] hover:underline"
                >
                  添加第一个账户
                </button>
              </div>
            )}
          </div>
        </div>

        {/* 服主信息 */}
        {adminLoggedIn && adminSession && (
          <div className="p-4 rounded-xl bg-purple-500/5 border border-purple-500/20">
            <div className="flex items-center gap-2 mb-2">
              <Server className="w-4 h-4 text-purple-400" />
              <h3 className="text-xs font-medium text-purple-400 uppercase tracking-wider">
                服主账号
              </h3>
            </div>
            <div className="flex items-center justify-between">
              <div className="text-sm text-[var(--color-text-primary)]">
                {adminSession.email}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-[var(--color-text-secondary)]">
                  已绑定 {adminSession.bound_player_uuids.length} 个玩家
                </span>
                <button
                  onClick={() => adminLogout()}
                  className="text-xs text-red-400 hover:text-red-300 transition-colors"
                >
                  退出
                </button>
              </div>
            </div>
          </div>
        )}
      </LoadingSurface>

      {/* TODO: 改为ConfirmPopup组件 */}
      {/* 添加弹出层 */}
      <Popup isOpen={showAddPopup} onClose={() => { setShowAddPopup(false); setAddError(""); }}>
        <div className="p-6 space-y-4 w-80">
          <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">添加账户</h2>
          {addError && (
            <div className="p-2.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
              {addError}
            </div>
          )}
          <input
            value={addName}
            onChange={(e) => setAddName(e.target.value)}
            placeholder="游戏名称（1-16 字符）"
            maxLength={16}
            className="w-full px-3 py-2 rounded-lg bg-[var(--color-surface-hover)] border border-[var(--color-border)]
              text-[var(--color-text-primary)] text-sm placeholder-[var(--color-text-secondary)]/50
              focus:outline-none focus:border-[var(--color-primary)]/50 focus:ring-1 focus:ring-[var(--color-primary)]/20"
          />
          <div className="flex gap-2">
            <button
              onClick={() => setAddType("offline")}
              className={`flex-1 py-2 rounded-lg text-sm border transition-all ${
                addType === "offline"
                  ? "bg-[var(--color-primary)]/10 border-[var(--color-primary)] text-[var(--color-primary)]"
                  : "bg-[var(--color-surface-hover)] border-[var(--color-border)] text-[var(--color-text-secondary)]"
              }`}
            >
              离线
            </button>
            <button
              onClick={() => setAddType("microsoft")}
              className={`flex-1 py-2 rounded-lg text-sm border transition-all ${
                addType === "microsoft"
                  ? "bg-[var(--color-primary)]/10 border-[var(--color-primary)] text-[var(--color-primary)]"
                  : "bg-[var(--color-surface-hover)] border-[var(--color-border)] text-[var(--color-text-secondary)]"
              }`}
            >
              Microsoft
            </button>
          </div>
          <button
            onClick={handleAddAccount}
            disabled={!addName.trim() || adding}
            className="w-full py-2 rounded-lg bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary)]/90 text-white font-medium
              hover:from-[var(--color-primary)]/90 hover:to-[var(--color-primary)]/80 disabled:opacity-50 transition-all text-sm flex items-center justify-center gap-2"
          >
            {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
            <span>{adding ? "添加中..." : "添加"}</span>
          </button>
        </div>
      </Popup>

      {/* 删除确认 */}
      <Popup isOpen={!!showDeleteConfirm} onClose={() => setShowDeleteConfirm(null)}>
        <div className="p-6 space-y-4 w-72">
          <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">确认删除</h2>
          <p className="text-sm text-[var(--color-text-secondary)]">
            确定要删除此账户吗？此操作不可撤销。
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setShowDeleteConfirm(null)}
              className="flex-1 py-2 rounded-lg bg-[var(--color-surface-hover)] text-[var(--color-text-secondary)] text-sm hover:bg-[var(--color-border)] transition-colors"
            >
              取消
            </button>
            <button
              onClick={() => showDeleteConfirm && handleDeleteAccount(showDeleteConfirm)}
              className="flex-1 py-2 rounded-lg bg-red-500/10 text-red-400 text-sm hover:bg-red-500/20 transition-colors"
            >
              删除
            </button>
          </div>
        </div>
      </Popup>
    </div>
  );
};

export default AccountList;
