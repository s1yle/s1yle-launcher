import { useState, useEffect } from "react";
import Popup from "../components/Popup";
import { 
  invokeAddAccount, 
  getAccountList, 
  getCurrentAccount, 
  deleteAccount, 
  setCurrentAccount,
  AccountInfo,
  AccountType 
} from "../helper/rustInvoke";
import { logger } from "../helper/logger";
import ConfirmPopup from "../components/popup/ConfirmPopup";

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
  const [isLoadingAccounts, setIsLoadingAccounts] = useState(true);

  // 加载账户数据
  const loadAccounts = async () => {
    setIsLoadingAccounts(true);
    try {
      const [accountsData, currentAccountData] = await Promise.all([
        getAccountList(),
        getCurrentAccount()
      ]);
      setAccounts(accountsData);
      setCurrentAccountState(currentAccountData);
    } catch (error) {
      logger.error('加载账户列表失败：', error);
      setErrorMsg("加载账户列表失败");
    } finally {
      setIsLoadingAccounts(false);
    }
  };

  // 初始加载
  useEffect(() => {
    loadAccounts();
  }, []);

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
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] p-4 md:p-8">
      <div className="max-w-6xl w-full space-y-8">
        {/* 标题区域 */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white mb-2">账户管理</h1>
          <p className="text-lg text-gray-300">管理您的 Minecraft 账户</p>
        </div>

        {/* 当前账户卡片 */}
        <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 backdrop-blur-sm rounded-xl p-6 border border-white/20">
          <h2 className="text-2xl font-bold text-white mb-4">当前账户</h2>
          {currentAccount ? (
            <div className="bg-white/10 rounded-lg p-4 border border-white/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center">
                    <span className="text-white text-xl">👤</span>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-xl font-bold text-white">{currentAccount.name}</h3>
                    <p className="text-gray-300">{getAccountTypeText(currentAccount.account_type)}</p>
                    <p className="text-sm text-gray-400">最后登录: {formatTime(currentAccount.last_login_time)}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-400">创建时间: {formatTime(currentAccount.create_time)}</p>
                  <p className="text-sm text-gray-400">UUID: {currentAccount.uuid.substring(0, 8)}...</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white/10 rounded-lg p-6 border border-white/20 text-center">
              <p className="text-gray-300 text-lg">当前没有选中任何账户</p>
              <p className="text-gray-400">请从下方选择一个账户</p>
            </div>
          )}
        </div>

        {/* 账户列表 */}
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-white">账户列表</h2>
            <button 
              onClick={handleAddAccount}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2"
            >
              <span>➕</span>
              添加账户
            </button>
          </div>

          {isLoadingAccounts ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white"></div>
              <p className="text-gray-300 mt-2">加载中...</p>
            </div>
          ) : accounts.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-300 text-lg">暂无账户</p>
              <p className="text-gray-400">点击上方按钮添加第一个账户</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {accounts.map((account) => (
                <div 
                  key={account.uuid}
                  className={`bg-white/5 rounded-lg p-4 border ${currentAccount?.uuid === account.uuid ? 'border-blue-500' : 'border-white/10'} hover:border-white/30 transition-colors`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-full bg-blue-600/30 flex items-center justify-center">
                        <span className="text-white">
                          {account.account_type === AccountType.Microsoft ? "🔵" : "⚪"}
                        </span>
                      </div>
                      <div className="ml-3">
                        <h3 className="font-bold text-white">{account.name}</h3>
                        <p className="text-sm text-gray-300">{getAccountTypeText(account.account_type)}</p>
                      </div>
                    </div>
                    {currentAccount?.uuid === account.uuid && (
                      <span className="px-2 py-1 bg-blue-600 text-white text-xs rounded-full">当前</span>
                    )}
                  </div>

                  <div className="mt-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">创建时间</span>
                      <span className="text-gray-300">{formatTime(account.create_time)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">最后登录</span>
                      <span className="text-gray-300">{formatTime(account.last_login_time)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">UUID</span>
                      <span className="text-gray-300 font-mono text-xs">{account.uuid.substring(0, 8)}...</span>
                    </div>
                  </div>

                  <div className="mt-4 flex gap-2">
                    {currentAccount?.uuid !== account.uuid && (
                      <button
                        onClick={() => handleSetCurrentAccount(account.uuid)}
                        className="flex-1 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-sm"
                      >
                        设为当前
                      </button>
                    )}
                    <button
                      onClick={() => setShowDeleteConfirm(account.uuid)}
                      className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-sm"
                    >
                      删除
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 错误提示 */}
        {errorMsg && (
          <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-4">
            <p className="text-red-300 text-center">{errorMsg}</p>
          </div>
        )}
      </div>

      {/* 添加账户弹窗 */}
      <Popup
        isOpen={showAddPopup}
        onClose={handleClosePopup}
        title="添加新账户"
        size="md"
        position="center"
        showCloseButton={true}
        closeOnEsc={true}
        closeOnOverlayClick={true}
        footer={
          <div className="flex justify-end gap-4">
            <button 
              onClick={handleClosePopup}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
              disabled={loading}
            >
              取消
            </button>
            <button 
              onClick={handleSubmit}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
              disabled={loading}
            >
              {loading ? "添加中..." : "确认添加"}
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-white mb-2">账户名称</label>
            <input 
              type="text" 
              placeholder="请输入账户名称 (1-16字符)"
              className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
              value={accountName}
              onChange={(e) => setAccountName(e.target.value)}
              disabled={loading}
            />
            <p className="text-gray-400 text-sm mt-1">支持字母、数字和下划线</p>
          </div>
          <div>
            <label className="block text-white mb-2">账户类型</label>
            <select 
              className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-blue-500"
              value={accountType}
              onChange={(e) => setAccountType(e.target.value as "microsoft" | "offline")}
              disabled={loading}
            >
              <option value="offline">离线账户</option>
              <option value="microsoft">Microsoft 账户</option>
            </select>
            {accountType === "microsoft" && (
              <p className="text-yellow-300 text-sm mt-1">
                注意：Microsoft 账户需要 OAuth 认证，当前使用占位符 Token
              </p>
            )}
          </div>
          {errorMsg && (
            <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-3">
              <p className="text-red-300 text-sm">{errorMsg}</p>
            </div>
          )}
        </div>
      </Popup>

      {/* 删除确认弹窗 */}
      {showDeleteConfirm && (
        <Popup
          isOpen={true}
          onClose={() => setShowDeleteConfirm(null)}
          title="确认删除"
          size="sm"
          position="center"
          showCloseButton={false}
          closeOnEsc={true}
          closeOnOverlayClick={true}
          footer={
            <div className="flex justify-end gap-4">
              <button 
                onClick={() => setShowDeleteConfirm(null)}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
              >
                取消
              </button>
              <button 
                onClick={() => handleDeleteAccount(showDeleteConfirm)}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
              >
                确认删除
              </button>
            </div>
          }
        >
          <p className="text-white text-center">
            确定要删除这个账户吗？此操作不可撤销。
          </p>
        </Popup>
      )}
    </div>
  );
};

export default AccountList;
