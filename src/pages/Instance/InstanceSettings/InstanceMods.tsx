import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRouteParams } from '@/router/routeParams';
import { useInstanceStore } from '../../../stores/instanceStore';

/** 实例模组管理页面（待实现） */
const InstanceMods: React.FC = () => {
  const { instanceId } = useRouteParams();
  const navigate = useNavigate();
  const getInstance = useInstanceStore(s => s.getInstance);
  const setSelectedInstance = useInstanceStore(s => s.setSelectedInstance);

  useEffect(() => {
    if (instanceId) {
      const inst = getInstance(instanceId);
      if (inst) {
        setSelectedInstance(instanceId);
      } else {
        navigate('/instance-list');
      }
    }
  }, [instanceId]);

  return (
    <div className="flex-1 flex items-center justify-center">
      模组管理（实例：{instanceId}）
    </div>
  );
};

export default InstanceMods;