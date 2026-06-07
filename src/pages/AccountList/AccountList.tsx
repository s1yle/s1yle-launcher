import { useState, useEffect } from "react";
import { LoadingSurface } from "@/components/common";
import Popup from "../../components/Popup";
import {
  invokeAddAccount,
  getAccountList,
  getCurrentAccount,
  deleteAccount,
  setCurrentAccount,
  AccountInfo,
  AccountType
} from "../../helper/rustInvoke";
import { useLoadingAction } from "@/hooks/useLoadingAction";
import { logger } from "../../helper/logger";


// TODO: 支持在顶部栏显示账号头像

interface AccountListProps {
  onClickAddAccount?: () => void;
}

const AccountList = ({ onClickAddAccount }: AccountListProps) => {
  const [showAddPopup, setShowAddPopup] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  const [accountName, setAccountName] = useState("");
  const [accountType, setAccountType] = useState<"microsoft" | "offline">("offline");

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const [accounts, setAccounts] = useState<AccountInfo[]>([]);
  const [currentAccount, setCurrentAccountState] = useState<AccountInfo | null>(null);

  const loadAccounts = useLoadingAction<AccountInfo[]>({
    key: 'account:list',
    action: async () => {
      const [accountsData, currentAccountData] = await Promise.all([
        getAccountList(),
        getCurrentAccount()
      ]);
      setAccounts(accountsData);
      setCurrentAccountState(currentAccountData);
      return accountsData;
    },
    onError: (error) => {
      logger.error('加载账户列表失败：', error);
    }
  });

  // 初始加载
  useEffect(() => {
    loadAccounts();
  }, [loadAccounts]);

  const handleAddAccount = () => {
    setShowAddPopup(true);
    if (onClickAddAccount) {
      onClickAddAccount();
    }
  };

  const handleClosePopup = () => {
    setShowAddPopup(false);
    setAccountName("");
    setAccountType("offline");
    setErrorMsg("");
  };

  const handleSubmit = async () => {
    if (loading) return;

    const name = accountName.trim();
    if (name.length <= 0 || name.length > 16) {
      setErrorMsg("名称不能为空且长度为1-16");
      return;
    }

    setLoading(true);
    setErrorMsg("");

    try {
      // 根据您的选择，我们保留占位符 token
      let accessToken: string | undefined = undefined;
      let refreshToken: string | undefined = undefined;

      if (accountType === "microsoft") {
        // 根据方案A，保留占位符
        accessToken = "placeholder_access_token";
        refreshToken = "placeholder_refresh_token";
      }

      const result = await invokeAddAccount(name, accountType, accessToken, refreshToken);
      logger.info('账户添加成功：', result);

      // 刷新账户列表
      await loadAccounts();
      handleClosePopup();
    } catch (e) {
      const errorMessage = (e as Error).message || "未知错误";
      setErrorMsg(errorMessage);
      logger.error('添加账户失败：', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSetCurrentAccount = async (uuid: string) => {
    try {
      await setCurrentAccount(uuid);
      await loadAccounts(); // 刷新数据
      logger.info(`账户 ${uuid} 已设为当前账户`);
    } catch (error) {
      logger.error('设置当前账户失败：', error);
      setErrorMsg("设置当前账户失败");
    }
  };

  const handleDeleteAccount = async (uuid: string) => {
    try {
      await deleteAccount(uuid);
      await loadAccounts(); // 刷新数据
      setShowDeleteConfirm(null);
      logger.info(`账户 ${uuid} 删除成功`);
    } catch (error) {
      logger.error('删除账户失败：', error);
      setErrorMsg("删除账户失败");
    }
  };

  const formatTime = (timeString: string | null) => {
    if (!timeString) return "从未登录";
    try {
      const date = new Date(timeString);
      return date.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return timeString;
    }
  };

  const getAccountTypeText = (type: AccountType) => {
    switch (type) {
      case AccountType.Microsoft: return "Microsoft 账户";
      case AccountType.Offline: return "离线账户";
      default: return "未知";
    }
  };

  return (
    <div className="p-4">
      <LoadingSurface loadingKey="account:list" skeleton="list" skeletonCount={4}>
        <div />
      </LoadingSurface>
    </div>
  );
};

export default AccountList;
