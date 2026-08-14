import { useEffect } from 'react';
import { useRouteParams } from '@/router/routeParams';
import { useSafeNavigate } from '@/router/navigation';
import { useGameStore } from '../../../stores/gameStore';
import { Page, PageSection } from '@/components/common';

/** 实例模组管理页面（待实现） */
const InstanceMods: React.FC = () => {
  const { instanceId } = useRouteParams();
  const safeNavigate = useSafeNavigate();
  const getGame = useGameStore(s => s.getGame);
  const setSelectedGame = useGameStore(s => s.setSelectedGame);

  useEffect(() => {
    if (instanceId) {
      const inst = getGame(instanceId);
      if (inst) {
        setSelectedGame(instanceId);
      } else {
        safeNavigate('/instance-list');
      }
    }
  }, [instanceId]);

  return (
    <Page className="flex-1 flex items-center justify-center">
      <PageSection>
        模组管理（实例：{instanceId}）
      </PageSection>
    </Page>
  );
};

export default InstanceMods;