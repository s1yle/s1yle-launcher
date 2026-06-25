import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useInstanceStore } from '../../../stores/instanceStore';

/** 实例材质包管理页面（待实现） */
const InstanceResourcePacks: React.FC = () => {
  const { instanceId } = useParams<{ instanceId: string }>();
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
      材质包管理（实例：{instanceId}）
    </div>
  );
};

export default InstanceResourcePacks;