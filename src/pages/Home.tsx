import ActionButton from '../components/common/StartGameButton';
import PlayerProfile from '../components/common/home/PlayerProfile';
import CreatorPreview from '../components/common/home/CreatorPreview';
import { LaunchingOverlay, RunningGamesCard, Skeleton, Page, PageSection } from '@/components/common';
import { useGameStore } from '../stores/gameStore';
import { useAuthStore } from '../stores/authStore';
import { useLaunchStore } from '../stores/launchStore';
import { useUserRoleStore, UserRole } from '../stores/userRoleStore';

/** 主页 - 显示玩家档案和快捷启动按钮 */
const Home = () => {
  const currentRole = useUserRoleStore(s => s.currentRole);
  const selectedGame = useGameStore(s => s.getSelectedGame());
  const gameReports = useGameStore(s => s.validations);

  // 空壳游戏（目录内除记录外无任何文件）前端不显示启动入口
  const isShellEmpty = selectedGame && gameReports[selectedGame.id]?.empty;

  const currentAccount = useAuthStore(s => s.currentAccount);
  const accountLoading = useAuthStore(s => s.loading);
  const overlay = useLaunchStore(s => s.overlay);
  const closeOverlay = useLaunchStore(s => s.closeOverlay);

  const isCreator = currentRole === UserRole.CREATOR;

  return (
    <Page className="flex flex-col items-center justify-center min-h-[calc(100vh-120px)] p-0">
      <PageSection className="max-w-4xl w-full space-y-8">
        {isCreator ? (
          <CreatorPreview />
        ) : accountLoading ? (
          <Skeleton.Profile />
        ) : (
          <PlayerProfile />
        )}
      </PageSection>

      {!isShellEmpty && (
        <ActionButton />
      )}

      <RunningGamesCard />

      {overlay && (
        <LaunchingOverlay
          game={overlay.game}
          gameId={overlay.gameId}
          accountInfo={currentAccount}
          onExit={closeOverlay}
        />
      )}
    </Page>
  );
};

export default Home;
