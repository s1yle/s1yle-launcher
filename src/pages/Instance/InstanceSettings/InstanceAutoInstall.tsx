import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRouteParams } from '@/router/routeParams';
import { useInstanceStore } from '../../../stores/instanceStore';

/** 实例自动安装页面 - 模组加载器自动安装（待实现） */
const InstanceAutoInstall: React.FC = () => {
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
      自动安装（实例：{instanceId}）
    </div>
  );
};

export default InstanceAutoInstall;