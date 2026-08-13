import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRouteParams } from '@/router/routeParams';
import { useGameStore } from '../../../stores/gameStore';
import { Page, PageSection } from '@/components/common';

/** 实例自动安装页面 - 模组加载器自动安装（待实现） */
const InstanceAutoInstall: React.FC = () => {
  const { instanceId } = useRouteParams();
  const navigate = useNavigate();
  const getGame = useGameStore(s => s.getGame);
  const setSelectedGame = useGameStore(s => s.setSelectedGame);

  useEffect(() => {
    if (instanceId) {
      const inst = getGame(instanceId);
      if (inst) {
        setSelectedGame(instanceId);
      } else {
        navigate('/instance-list');
      }
    }
  }, [instanceId]);

  return (
    <Page className="flex-1 flex items-center justify-center">
      <PageSection>
      自动安装（实例：{instanceId}）
      </PageSection>
    </Page>
  );
};

export default InstanceAutoInstall;