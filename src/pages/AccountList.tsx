import { useState } from "react";
import Popup from "../components/Popup";

interface AccountListProps {
    // 这里可以添加一些属性，比如账户数据等
    onClickAddAccount?: () => void;
}


const AccountList = ({ onClickAddAccount }: AccountListProps) => {
  const [showPopup, setShowPopup] = useState(false);
  
  const handleAddAccount = () => {
    console.log('Add Account button clicked');
    setShowPopup(true);
    if(onClickAddAccount) {
      onClickAddAccount();
    }
  };

  const handleClosePopup = () => {
    setShowPopup(false);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] p-8">
      <div className="max-w-4xl w-full">
        <h1 className="text-4xl font-bold text-white mb-6 text-center">账户列表</h1>
        
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-8 border border-white/20">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            <div className="bg-blue-500/20 rounded-lg p-6 border border-blue-500/30">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center">
                  <span className="text-white text-xl">➕</span>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-bold text-white">添加新账户</h3>
                  <p className="text-gray-300 text-sm">点击添加</p>
                </div>
              </div>
              <p className="text-gray-300 mb-4">添加新的Minecraft账户</p>
              <button onClick={handleAddAccount} className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
                添加账户
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* 核心修改：在这里渲染 Popup 组件 */}
      <Popup
        isOpen={showPopup}
        onClose={handleClosePopup}
        title="添加新账户"
        size="md"
        position="center"
        showCloseButton={true}
        closeOnEsc={true}
        closeOnOverlayClick={true}
        footer={
          <div className="flex justify-end gap-4">
            <button 
              onClick={handleClosePopup}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
            >
              取消
            </button>
            <button 
              onClick={() => {
                // 这里可以添加确认添加的逻辑
                console.log('确认添加账户');
                handleClosePopup();
              }}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              确认添加
            </button>
          </div>
        }
      >
        {/* 弹窗内容区域（children） */}
        <div className="space-y-4">
          <div>
            <label className="block text-white mb-2">账户名称</label>
            <input 
              type="text" 
              placeholder="请输入账户名称"
              className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-white mb-2">账户类型</label>
            <select className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-blue-500">
              <option value="microsoft">Microsoft 账户</option>
              <option value="offline">离线账户</option>
            </select>
          </div>
        </div>
      </Popup>

    </div>
  );
};

export default AccountList;
