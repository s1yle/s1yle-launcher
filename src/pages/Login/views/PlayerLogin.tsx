import { useState, useEffect, useCallback, useMemo } from "react";
import { LogIn, Pencil, Trash2, Pin, PinOff } from "lucide-react";
import { UserPlus } from "lucide-react";
import ContextMenu, { ContextMenuItemData } from "@/components/common/ContextMenu"
import { useNotification } from "@/components/common/NotificationProvider";
import { AccountCard } from "../components/AccountCard";

interface PlayerLoginProps {
  accounts: ReturnType<typeof import("../hooks/useLoginFlow").useLoginFlow>["accounts"];
  onLogin: (uuid: string) => Promise<void>;
  onDeleteAccount: (uuid: string) => Promise<void>;
  onNavigate: (view: import("../hooks/useLoginFlow").LoginView) => void;
}

const PINNED_KEY = "wecraft:pinned_uuids";

// pinned
function loadPinned(): string[] {
  try {
    const raw = localStorage.getItem(PINNED_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {}
  return [];
}
function savePinned(uuids: string[]) {
  try {
    if (uuids.length > 0) localStorage.setItem(PINNED_KEY, JSON.stringify(uuids));
    else localStorage.removeItem(PINNED_KEY);
  } catch {}
}

export function PlayerLogin({ accounts, onLogin, onDeleteAccount, onNavigate }: PlayerLoginProps) {
  const [selectedUuid, setSelectedUuid] = useState<string | null>(null);
  const [markedUuid, setMarkedUuid] = useState<string | null>(null);
  const [pinnedUuids, setPinnedUuids] = useState<string[]>(loadPinned);
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

  const sortedAccounts = useMemo(() => {
    if (pinnedUuids.length === 0) return accounts;
    const pinned = pinnedUuids
      .map(id => accounts.find(a => a.uuid === id))
      .filter(Boolean) as typeof accounts;
    const pinnedIds = new Set(pinned.map(a => a.uuid));
    const rest = accounts.filter(a => !pinnedIds.has(a.uuid));
    return [...pinned, ...rest];
  }, [accounts, pinnedUuids]);

  useEffect(() => {
    if (!selectedUuid && sortedAccounts.length > 0) {
      setSelectedUuid(sortedAccounts[0].uuid);
    }
  }, [sortedAccounts, selectedUuid]);

  const handleLogin = useCallback(async (uuid?: string) => {
    const targetUuid = uuid ?? selectedUuid;
    if (!targetUuid) return;
    setLoggingIn(true);
    try {
      await onLogin(targetUuid);
      setPinnedUuids(prev => {
        const next = [targetUuid, ...prev.filter(id => id !== targetUuid)];
        savePinned(next);
        return next;
      });
    } catch (e) {
      notifyError("登录失败", e instanceof Error ? e.message : "未知错误");
      setLoggingIn(false);
    }
  }, [selectedUuid, onLogin, notifyError]);

  const handleContextMenu = useCallback((e: React.MouseEvent, uuid: string) => {
    e.preventDefault();
    e.stopPropagation();
    setMarkedUuid(uuid);
    setContextMenu({
      visible: true,
      position: { x: e.clientX, y: e.clientY },
      targetUuid: uuid,
    });
  }, []);

  const closeContextMenu = useCallback(() => {
    setContextMenu(prev => ({ ...prev, visible: false }));
  }, []);

  const togglePin = useCallback((uuid: string) => {
    setPinnedUuids(prev => {
      const next = prev.includes(uuid)
        ? prev.filter(id => id !== uuid)
        : [uuid, ...prev];
      savePinned(next);
      return next;
    });
  }, []);

  const handleMenuAction = useCallback(async (actionId: string) => {
    const uuid = contextMenu.targetUuid;
    if (!uuid) return;

    switch (actionId) {
      case "login":
        closeContextMenu();
        await handleLogin(uuid);
        break;
      case "edit":
        closeContextMenu();
        onNavigate("player-add");
        break;
      case "delete":
        closeContextMenu();
        try {
          await onDeleteAccount(uuid);
          if (selectedUuid === uuid) {
            setSelectedUuid(accounts.find(a => a.uuid !== uuid)?.uuid ?? null);
          }
          setPinnedUuids(prev => {
            const next = prev.filter(id => id !== uuid);
            savePinned(next);
            return next;
          });
          notifySuccess("删除成功", "账户已移除");
        } catch (e) {
          notifyError("删除失败", e instanceof Error ? e.message : "未知错误");
        }
        break;
      case "pin":
        closeContextMenu();
        togglePin(uuid);
        break;
    }
  }, [contextMenu.targetUuid, handleLogin, onNavigate, onDeleteAccount, notifyError, notifySuccess, selectedUuid, accounts, closeContextMenu, togglePin]);

  const isContextTargetPinned = contextMenu.targetUuid
    ? pinnedUuids.includes(contextMenu.targetUuid)
    : false;

  const menuItems: ContextMenuItemData[] = [
    { id: "login", label: "登录", icon: LogIn },
    { id: "edit", label: "编辑", icon: Pencil },
    { id: "pin", label: isContextTargetPinned ? "取消置顶" : "置顶", icon: isContextTargetPinned ? PinOff : Pin },
    { id: "divider-delete", label: "", divider: true },
    { id: "delete", label: "删除", icon: Trash2, danger: true },
  ];

  return (
    <div className="space-y-4">
      <h2 className="text-base font-semibold text-[var(--color-text-primary)]">
        点击进入账号
      </h2>

      <div className="flex flex-wrap gap-3 justify-center py-2 max-h-56 overflow-y-auto scrollbar-hide relative">
        {sortedAccounts.map((acc) => (
          <AccountCard
            key={acc.uuid}
            account={acc}
            isSelected={selectedUuid === acc.uuid}
            isMarked={markedUuid === acc.uuid}
            isPinned={pinnedUuids.includes(acc.uuid)}
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
        onClose={() => { setMarkedUuid(null); closeContextMenu(); }}
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
