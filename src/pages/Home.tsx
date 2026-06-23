import { motion } from 'framer-motion';
import { staggerContainer, staggerSection } from '@/utils/animations';
import { useEffect } from 'react';
import ActionButton from '../components/common/StartGameButton';
import PlayerProfile from '../components/common/home/PlayerProfile';
import { LoadingSurface } from '@/components/common';
import { useInstanceStore } from '../stores/instanceStore';
import { useUserRoleStore } from '../stores/userRoleStore';
import { UIMode, useUIModeStore } from '../stores/uiModeStore';
import { useLocation } from 'react-router-dom';
import { getCurrentAccount, type AccountInfo } from '../helper/rustInvoke';
import { useLoadingAction } from '@/hooks/useLoadingAction';
import { useState } from 'react';
import { pagesWithOwnSidebar } from '@/router/config';

const Home = () => {
  const instance_init = useInstanceStore(s => s.init);
  const { currentRole } = useUserRoleStore();
  const { mode: uiMode } = useUIModeStore();
  const location = useLocation();

  const [accountName, setAccountName] = useState<string>('Steve');

  const isInstanceManagePage = location.pathname.startsWith('/instance-manage/');
  const hasOwnSidebar = uiMode === UIMode.ISLAND && (
    pagesWithOwnSidebar.some(path => location.pathname.startsWith(path)) || isInstanceManagePage
  );

  const loadProfile = useLoadingAction({
    key: 'home:profile',
    action: async () => {
      try {
        const currentAccount: AccountInfo | null = await getCurrentAccount();
        if (currentAccount?.name) {
          setAccountName(currentAccount.name);
        }
      } catch (error) {
        console.error('加载账户信息失败:', error);
      }
    },
  });

  useEffect(() => {
    instance_init();
    loadProfile();
  }, [instance_init, loadProfile]);

  return (
    <motion.div
      className="flex flex-col items-center justify-center min-h-[calc(100vh-120px)] p-0"
      variants={staggerContainer}
      initial="initial"
      animate="animate"
    >
      <motion.div variants={staggerSection} className="max-w-4xl w-full space-y-8">
        <LoadingSurface loadingKey="home:profile" skeleton="profile">
          <PlayerProfile
            name={accountName}
            role={currentRole}
          />
        </LoadingSurface>
      </motion.div>

      <motion.div>
        <ActionButton />
      </motion.div>
    </motion.div>
  );
};

export default Home;
