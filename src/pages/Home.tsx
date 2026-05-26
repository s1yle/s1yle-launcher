import { useEffect } from 'react';
import ActionButton from '../components/common/StartGameButton';
import PlayerProfile from '../components/common/home/PlayerProfile';
import { useInstanceStore } from '../stores/instanceStore';
import { useUserRoleStore } from '../stores/userRoleStore';
import { UIMode, useUIModeStore } from '../stores/uiModeStore';
import { useLocation } from 'react-router-dom';
import { getCurrentAccount, type AccountInfo } from '../helper/rustInvoke';
import { useState } from 'react';
import { pagesWithOwnSidebar } from '@/router/config';

const Home = () => {
  const instance_init = useInstanceStore(s => s.init);
  const { currentRole } = useUserRoleStore();
  const { mode: uiMode } = useUIModeStore();
  const location = useLocation();

  const [accountName, setAccountName] = useState<string>('Steve');
  const [isLoadingAccount, setIsLoadingAccount] = useState(true);

  // 检测当前页面是否有独立侧边栏
  const isInstanceManagePage = location.pathname.startsWith('/instance-manage/');
  const hasOwnSidebar = uiMode === UIMode.ISLAND && (
    pagesWithOwnSidebar.some(path => location.pathname.startsWith(path)) || isInstanceManagePage
  );

  useEffect(() => {
    instance_init();

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
  }, [instance_init]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-120px)] p-0">
      <div className="max-w-4xl w-full space-y-8">
        {/* 玩家个人资料卡片 - MC 方块人头像 */}
        <PlayerProfile
          name={accountName}
          role={currentRole}
        />
        
      </div>

      <ActionButton />
    </div>
  );
};

export default Home;
