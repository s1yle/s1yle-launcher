import { useLoadingStore, getActiveEntries, getGlobalProgress } from '@/stores/loadingStore';

const GlobalLoadingBar = () => {
  const config = useLoadingStore((s) => s.config);
  const globalProgress = useLoadingStore((s) => {
    if (!s.config.globalTopbar) return null;
    const entries = getActiveEntries(s.entries);
    if (entries.length === 0) return null;
    return getGlobalProgress(s.entries);
  });

  if (globalProgress === null) return null;

  const indefinite = globalProgress === 0;

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] h-0.5">
      <div className="relative h-full w-full overflow-hidden bg-[var(--color-surface-tertiary)]/30">
        <div
          className="h-full bg-[var(--color-primary)] transition-all duration-300 ease-out"
          style={{
            width: indefinite ? '30%' : `${globalProgress}%`,
            animation: indefinite ? 'global-loading-indefinite 1.5s ease-in-out infinite' : undefined,
          }}
        />
      </div>
      <style>{`
        @keyframes global-loading-indefinite {
          0% { transform: translateX(-100%); }
          50% { transform: translateX(200%); }
          100% { transform: translateX(400%); }
        }
      `}</style>
    </div>
  );
};

export default GlobalLoadingBar;
