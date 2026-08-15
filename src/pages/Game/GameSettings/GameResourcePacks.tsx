import { useEffect } from 'react';
import { useRouteParams } from '@/router/routeParams';
import { useSafeNavigate } from '@/router/navigation';
import { useGameStore } from '../../../stores/gameStore';
import { Page, PageSection } from '@/components/common';

/** 游戏材质包管理页面（待实现） */
const GameResourcePacks: React.FC = () => {
  const { gameId } = useRouteParams();
  const safeNavigate = useSafeNavigate();
  const getGame = useGameStore(s => s.getGame);
  const setSelectedGame = useGameStore(s => s.setSelectedGame);

  useEffect(() => {
    if (gameId) {
      const inst = getGame(gameId);
      if (inst) {
        setSelectedGame(gameId);
      } else {
        safeNavigate('/game-list');
      }
    }
  }, [gameId]);

  return (
    <Page className="flex-1 flex items-center justify-center">
      <PageSection>
      材质包管理（游戏：{gameId}）
      </PageSection>
    </Page>
  );
};

export default GameResourcePacks;