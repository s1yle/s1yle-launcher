import { useEffect } from 'react';
import ActionButton from '../components/ActionButton';
import { useInstanceStore } from '../stores/instanceStore';

const Home = () => {
  const init = useInstanceStore(s => s.init);
  const selectedInstance = useInstanceStore(s => s.getSelectedInstance());
  
  useEffect(() => {
    init();
  }, [init]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] p-8">
      <div className="max-w-4xl w-full space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-text-primary mb-4">S1yle 启动器</h1>
          {selectedInstance ? (
            <div className="space-y-2">
              <p className="text-lg text-text-secondary">
                当前选择: <span className="text-primary font-semibold">{selectedInstance.name}</span>
              </p>
              <p className="text-sm text-text-tertiary">
                {selectedInstance.version} · {selectedInstance.loader_type}
                {selectedInstance.loader_version && ` ${selectedInstance.loader_version}`}
              </p>
            </div>
          ) : (
            <p className="text-lg text-text-secondary">请在实例列表中选择一个游戏实例</p>
          )}
        </div>
      </div>

      <ActionButton/>
    </div>
  );
};

export default Home;