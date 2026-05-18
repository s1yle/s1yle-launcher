import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ActionButton from '../components/ActionButton';
import PlayerProfile from '../components/home/PlayerProfile';
import InstanceInfoHeader from '../components/sidebar/InstanceInfoHeader';
import { useInstanceStore } from '../stores/instanceStore';
import { useUserRoleStore } from '../stores/userRoleStore';
import { useUIModeStore } from '../stores/uiModeStore';
import { useLocation } from 'react-router-dom';
import { getCurrentAccount, type AccountInfo } from '../helper/rustInvoke';
import { useState } from 'react';

const Home = () => {
  const init = useInstanceStore(s => s.init);
  const { currentRole } = useUserRoleStore();
  const { mode: uiMode } = useUIModeStore();
  const location = useLocation();
  
  const [accountName, setAccountName] = useState<string>('Steve');
  const [isLoadingAccount, setIsLoadingAccount] = useState(true);

  // 检测当前页面是否有独立侧边栏
  const pagesWithOwnSidebar = ['/account', '/download', '/game-settings', '/instance-list'];
  const isInstanceManagePage = location.pathname.startsWith('/instance-manage/');
  const hasOwnSidebar = uiMode === 'island' && (
    pagesWithOwnSidebar.some(path => location.pathname.startsWith(path)) || 
    isInstanceManagePage
  );

  useEffect(() => {
    init();
    
    // 加载当前账户信息
    const loadAccountName = async () => {
      try {
        const currentAccount: AccountInfo | null = await getCurrentAccount();
        if (currentAccount?.name) {
          setAccountName(currentAccount.name);
        }
      } catch (error) {
        console.error('加载账户信息失败:', error);
      } finally {
        setIsLoadingAccount(false);
      }
    };

    loadAccountName();
  }, [init]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-120px)] p-8 pt-24">
      <div className="max-w-4xl w-full space-y-12">
        {/* 玩家个人资料卡片 - MC 方块人头像 */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
        >
          <PlayerProfile
            name={accountName}
            role={currentRole}
          />
        </motion.div>

        {/* 游戏实例选择 - 仅在灵动岛模式且无独立侧边栏时显示 */}
        <AnimatePresence>
          {!hasOwnSidebar && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5, delay: 0.4, ease: "easeOut" }}
              className="w-full max-w-md mx-auto"
            >
              <div className="bg-[var(--color-surface)]/60 backdrop-blur-xl rounded-2xl border border-[var(--color-border)]/40 shadow-lg p-6">
                <h3 className="text-sm font-semibold text-[var(--color-text-secondary)] mb-4 uppercase tracking-wider flex items-center gap-2">
                  <span className="w-2 h-2 bg-[var(--color-primary)] rounded-full animate-pulse" />
                  选择游戏实例
                </h3>
                <InstanceInfoHeader />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <ActionButton />
    </div>
  );
};

export default Home;
