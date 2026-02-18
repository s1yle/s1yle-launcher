interface ActionButtonProps {
  onClick?: () => void;
}

const ActionButton = ({ onClick }: ActionButtonProps) => {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-6 right-6 bg-indigo-500 hover:bg-indigo-600 text-white px-8 py-4 rounded-xl shadow-lg transition-all hover:shadow-xl active:scale-95 flex flex-col items-center justify-center"
    >
      <span className="text-lg font-bold">启动游戏</span>
      <span className="text-xs opacity-90 mt-1">Vault Hunters Official Pack</span>
    </button>
  );
};

export default ActionButton;