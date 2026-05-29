import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, LogIn, Loader2 } from 'lucide-react';
import { useLoginStore } from '../../stores/loginStore';
import { getAccountList, setCurrentAccount, AccountInfo } from '../../helper/rustInvoke';
import { logger } from '../../helper/logger';

const Login = () => {
  const navigate = useNavigate();
  const setLoggedIn = useLoginStore((s) => s.setLoggedIn);
  
  const [selectedAccount, setSelectedAccount] = useState<AccountInfo | null>(null);
  const [accounts, setAccounts] = useState<AccountInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showAccountList, setShowAccountList] = useState(false);

  const loadAccounts = async () => {
    try {
      const accountData = await getAccountList();
      setAccounts(accountData);
      if (accountData.length > 0) {
        setSelectedAccount(accountData[0]);
      }
    } catch (error) {
      logger.error('加载账户列表失败:', error);
      setError('加载账户列表失败');
    }
  };

  const handleLogin = async () => {
    if (!selectedAccount) {
      setError('请选择一个账户');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await setCurrentAccount(selectedAccount.uuid);
      setLoggedIn();
      
      logger.info(`账户 ${selectedAccount.name} 登录成功`);
      
      setTimeout(async () => {
        // await closeLoginWindow();
      }, 300);
      
    } catch (error) {
      const errorMessage = (error as Error).message || '登录失败';
      setError(errorMessage);
      logger.error('登录失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddAccount = () => {
    navigate('/account');
  };

  const handleShowAccountList = async () => {
    await loadAccounts();
    setShowAccountList(true);
  };

  return (
    <div className="h-screen w-screen flex items-center justify-center bg-gradient-to-br from-[var(--color-primary)]/20 to-[var(--color-surface)]">
      <div className="w-full max-w-md p-8 rounded-2xl bg-[var(--color-surface)]/80 backdrop-blur-xl border border-[var(--color-border)] shadow-2xl">
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary)]/70 flex items-center justify-center shadow-lg">
            <LogIn className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)] mb-2">
            欢迎回来
          </h1>
          <p className="text-sm text-[var(--color-text-secondary)]">
            选择账户登录 WeCraft Launcher
          </p>
        </div>

        {error && (
          <div className="mb-6 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
            {error}
          </div>
        )}

        {showAccountList ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
                选择账户
              </h2>
              <button
                onClick={() => setShowAccountList(false)}
                className="text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
              >
                返回
              </button>
            </div>

            <div className="max-h-64 overflow-y-auto space-y-2 scrollbar-thin scrollbar-thumb-[var(--color-border)] scrollbar-track-transparent">
              {accounts.map((account) => (
                <button
                  key={account.uuid}
                  onClick={() => {
                    setSelectedAccount(account);
                    setShowAccountList(false);
                  }}
                  className={`w-full p-3 rounded-lg border transition-all duration-200 flex items-center gap-3 ${
                    selectedAccount?.uuid === account.uuid
                      ? 'bg-[var(--color-primary)]/10 border-[var(--color-primary)] shadow-md'
                      : 'bg-[var(--color-surface-hover)] border-[var(--color-border)] hover:border-[var(--color-primary)]/50'
                  }`}
                >
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--color-primary)]/80 to-[var(--color-primary)] flex items-center justify-center text-white font-semibold">
                    {account.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 text-left">
                    <div className="font-medium text-[var(--color-text-primary)]">
                      {account.name}
                    </div>
                    <div className="text-xs text-[var(--color-text-secondary)]">
                      {account.account_type === 'microsoft' ? 'Microsoft 账户' : '离线账户'}
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {accounts.length === 0 && (
              <div className="text-center py-8 text-[var(--color-text-secondary)]">
                <p className="mb-4">暂无账户</p>
                <button
                  onClick={handleAddAccount}
                  className="px-4 py-2 rounded-lg bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary)]/90 transition-colors"
                >
                  添加账户
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {selectedAccount ? (
              <div className="p-4 rounded-lg bg-[var(--color-surface-hover)] border border-[var(--color-border)]">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[var(--color-primary)]/80 to-[var(--color-primary)] flex items-center justify-center text-white font-semibold shadow-md">
                    {selectedAccount.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-[var(--color-text-primary)]">
                      {selectedAccount.name}
                    </div>
                    <div className="text-xs text-[var(--color-text-secondary)]">
                      {selectedAccount.account_type === 'microsoft' ? 'Microsoft 账户' : '离线账户'}
                    </div>
                  </div>
                  <User className="w-5 h-5 text-[var(--color-text-secondary)]" />
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-[var(--color-text-secondary)]">
                <p>暂无可用账户</p>
              </div>
            )}

            <button
              onClick={handleLogin}
              disabled={loading || !selectedAccount}
              className="w-full py-3 px-4 rounded-lg bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary)]/90 text-white font-medium 
                hover:from-[var(--color-primary)]/90 hover:to-[var(--color-primary)]/80 
                disabled:opacity-50 disabled:cursor-not-allowed 
                transition-all duration-200 shadow-lg hover:shadow-xl
                flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>登录中...</span>
                </>
              ) : (
                <>
                  <LogIn className="w-5 h-5" />
                  <span>登录</span>
                </>
              )}
            </button>

            <div className="text-center">
              <button
                onClick={handleShowAccountList}
                className="text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors mr-4"
              >
                切换账户
              </button>
              <button
                onClick={handleAddAccount}
                className="text-sm text-[var(--color-primary)] hover:text-[var(--color-primary)]/90 transition-colors"
              >
                添加新账户
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Login;
