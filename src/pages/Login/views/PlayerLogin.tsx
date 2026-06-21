import { useState, useEffect, useCallback } from "react";
import { LogIn, Pencil, Trash2, Pin } from "lucide-react";
import { UserPlus } from "lucide-react";
import { IconButton } from "@/components/common";
import ContextMenu, { useContextMenu, ContextMenuItemData } from "@/components/common/ContextMenu"
import { useNotification } from "@/components/common/NotificationProvider";
import { AccountCard } from "../components/AccountCard";

interface PlayerLoginProps {
  accounts: ReturnType<typeof import("../hooks/useLoginFlow").useLoginFlow>["accounts"];
  onLogin: (uuid: string) => Promise<void>;
  onDeleteAccount: (uuid: string) => Promise<void>;
  onNavigate: (view: import("../hooks/useLoginFlow").LoginView) => void;
}

export function PlayerLogin({ accounts, onLogin, onDeleteAccount, onNavigate }: PlayerLoginProps) {
  const [selectedUuid, setSelectedUuid] = useState<string | null>(
    accounts[0]?.uuid ?? null
  );
  const [loggingIn, setLoggingIn] = useState(false);
  const { error: notifyError, success: notifySuccess } = useNotification();

  const [contextMenu, setContextMenu] = useState<{
    visible: boolean;
    position: { x: number; y: number };
    targetUuid: string | null;
  }>({
    visible: false,
    position: { x: 0, y: 0 },
    targetUuid: null,
  });

  useEffect(() => {
    if (!selectedUuid && accounts.length > 0) {
      setSelectedUuid(accounts[0].uuid);
    }
  }, [accounts, selectedUuid]);

  const handleLogin = useCallback(async (uuid?: string) => {
    const targetUuid = uuid ?? selectedUuid;
    if (!targetUuid) return;
    setLoggingIn(true);
    try {
      await onLogin(targetUuid);
    } catch (e) {
      notifyError("登录失败", e instanceof Error ? e.message : "未知错误");
      setLoggingIn(false);
    }
  }, [selectedUuid, onLogin, notifyError]);

  const handleContextMenu = useCallback((e: React.MouseEvent, uuid: string) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({
      visible: true,
      position: { x: e.clientX, y: e.clientY },
      targetUuid: uuid,
    });
  }, []);

  const handleMenuAction = useCallback(async (actionId: string) => {
    const uuid = contextMenu.targetUuid;
    if (!uuid) return;

    switch (actionId) {
      case "login":
        await handleLogin(uuid);
        break;
      case "edit":
        onNavigate("player-add");
        break;
      case "delete":
        try {
          await onDeleteAccount(uuid);
          if (selectedUuid === uuid) {
            setSelectedUuid(accounts.find(a => a.uuid !== uuid)?.uuid ?? null);
          }
          notifySuccess("删除成功", "账户已移除");
        } catch (e) {
          notifyError("删除失败", e instanceof Error ? e.message : "未知错误");
        }
        break;
      case "pin":
        notifyError("置顶功能开发中", "");
        break;
    }
  }, [contextMenu.targetUuid, handleLogin, onNavigate, onDeleteAccount, notifyError, selectedUuid, accounts]);

  const menuItems: ContextMenuItemData[] = [
    { id: "login", label: "登录", icon: LogIn },
    { id: "edit", label: "编辑", icon: Pencil },
    { id: "pin", label: "置顶", icon: Pin },
    { id: "divider-delete", label: "", divider: true },
    { id: "delete", label: "删除", icon: Trash2, danger: true },
  ];

  return (
    <div className="space-y-4">
      <h2 className="text-base font-semibold text-[var(--color-text-primary)]">
        点击进入账号
      </h2>

      <div className="flex flex-wrap gap-3 justify-center py-2 max-h-56 overflow-y-auto scrollbar-hide relative">
        {accounts.map((acc) => (
          <AccountCard
            key={acc.uuid}
            account={acc}
            isSelected={selectedUuid === acc.uuid}
            onClick={() => handleLogin(acc.uuid)}
            onContextMenu={(e) => handleContextMenu(e, acc.uuid)}
          />
        ))}
        {accounts.length === 0 && (
          <div className="text-center py-8 text-[var(--color-text-secondary)] text-sm w-full">
            暂无账户，请添加
          </div>
        )}
      </div>

      <ContextMenu
        items={menuItems}
        position={contextMenu.position}
        visible={contextMenu.visible}
        onClose={() => setContextMenu((prev) => ({ ...prev, visible: false }))}
        onItemClick={handleMenuAction}
      />

      <button
        onClick={() => onNavigate("player-add")}
        className="w-full py-2.5 rounded-xl border border-[var(--color-border)] 
          text-[var(--color-text-secondary)] text-sm font-medium
          hover:border-[var(--color-primary)]/40 hover:text-[var(--color-primary)]
          hover:bg-[var(--color-primary)]/5
          transition-all duration-200 
          flex items-center justify-center gap-2 cursor-pointer"
      >
        <UserPlus className="w-4 h-4" />
        <span>添加账户</span>
      </button>
    </div>
  );
}
