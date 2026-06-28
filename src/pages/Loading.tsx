import { useWindowPosition } from "@/hooks";

const Loading = () => {
  useWindowPosition();

  return (
    <div className="h-screen w-screen flex flex-col items-center justify-center bg-[var(--color-surface)] select-none">
      <div className="fixed top-0 w-full h-0 bg-red"></div>
      <div className="text-2xl font-bold text-[var(--color-text-primary)] mb-8 tracking-wide">
        WeCraft! Launcher
      </div>
      <div className="flex gap-1.5">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="w-2.5 h-2.5 rounded-full bg-[var(--color-primary)]"
            style={{
              animation: `loading-bounce 1.4s ease-in-out ${i * 0.16}s infinite`,
            }}
          />
        ))}
      </div>
      <style>{`
      @keyframes loading-bounce {
        0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
        40% { transform: scale(1); opacity: 1; }
      }
    `}</style>
    </div>
  );
}
export default Loading;
