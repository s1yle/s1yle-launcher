import { useEffect } from 'react';
import { Crown, Mail } from 'lucide-react';
import ActionButton from '../components/common/StartGameButton';
import PlayerProfile from '../components/common/home/PlayerProfile';
import { LoadingSurface, Page, PageSection } from '@/components/common';
import { useGameStore } from '../stores/gameStore';
import { useAdminStore } from '../stores/adminStore';
import { useUserRoleStore, UserRole } from '../stores/userRoleStore';
import { getCurrentAccount, type AccountInfo } from '../helper/rustInvoke';
import { useLoadingAction } from '@/hooks/useLoadingAction';
import { useState } from 'react';

/** 主页 - 显示玩家档案和快捷启动按钮 */
const Home = () => {
  const instance_init = useGameStore(s => s.init);
  const selectedGame = useGameStore(s => s.getSelectedGame());
  const gameReports = useGameStore(s => s.validations);
  const { currentRole } = useUserRoleStore();
  const adminSession = useAdminStore((s) => s.session);

  // 空壳实例（目录内除记录外无任何文件）前端不显示启动入口
  const isShellEmpty = selectedGame && gameReports[selectedGame.id]?.empty;

  const [accountName, setAccountName] = useState<string>('Steve');

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
    <Page className="flex flex-col items-center justify-center min-h-[calc(100vh-120px)] p-0">
      <PageSection className="max-w-4xl w-full space-y-8">
        {currentRole === UserRole.ADMIN ? (
          <div className="flex flex-col items-center gap-4 py-12">
            <div className="w-20 h-20 rounded-full bg-purple-500/20 flex items-center justify-center">
              <Crown className="w-10 h-10 text-purple-400" />
            </div>
            <h1 className="text-lg font-medium text-text-primary">服主</h1>
            <div className="flex items-center gap-2 text-sm text-text-secondary">
              <Mail className="w-4 h-4" />
              <span>{adminSession?.email ?? '未绑定邮箱'}</span>
            </div>
          </div>
        ) : (
          <LoadingSurface loadingKey="home:profile" skeleton="profile">
            <PlayerProfile
              name={accountName}
              role={currentRole}
            />
          </LoadingSurface>
        )}
      </PageSection>

      {currentRole !== UserRole.ADMIN && !isShellEmpty && <ActionButton />}
    </Page>
  );
};

export default Home;
