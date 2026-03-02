import React, { useState } from 'react';
import Popup from './Popup';
import ConfirmPopup from './popup/ConfirmPopup';
import AlertPopup from './popup/AlertPopup';
import LoadingPopup from './popup/LoadingPopup';
import { createConfirmConfig, createLoadingConfig, ConfirmPresets, AlertPresets } from '../helper/popupUtils';

const PopupExamples: React.FC = () => {
  const [showBasicPopup, setShowBasicPopup] = useState(false);
  const [showConfirmPopup, setShowConfirmPopup] = useState(false);
  const [showAlertPopup, setShowAlertPopup] = useState(false);
  const [showLoadingPopup, setShowLoadingPopup] = useState(false);
  
  const [confirmResult, setConfirmResult] = useState<string>('');
  const [alertType, setAlertType] = useState<'success' | 'warning' | 'error' | 'info'>('info');
  const [loadingProgress, setLoadingProgress] = useState(0);

  // 处理确认弹窗结果
  const handleConfirmResult = (confirmed: boolean) => {
    setConfirmResult(confirmed ? '用户点击了确认' : '用户点击了取消');
    setShowConfirmPopup(false);
  };

  // 处理提示弹窗确认
  const handleAlertConfirm = () => {
    console.log(`提示弹窗确认: ${alertType}`);
    setShowAlertPopup(false);
  };

  // 模拟加载进度
  const simulateProgress = () => {
    setLoadingProgress(0);
    const interval = setInterval(() => {
      setLoadingProgress(prev => {
        const newProgress = prev + 5;
        if (newProgress >= 100) {
          clearInterval(interval);
          setTimeout(() => setShowLoadingPopup(false), 500);
          return 100;
        }
        return newProgress;
      });
    }, 200);
  };

  // 使用预设配置的示例
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [successAlertOpen, setSuccessAlertOpen] = useState(false);

  return (
    <div className="p-8 bg-gray-900 min-h-screen text-white">
      <h1 className="text-3xl font-bold mb-6">弹窗组件示例</h1>
      
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">简介</h2>
        <p className="text-gray-300 mb-2">
          本项目提供了多种弹窗组件，包括基础弹窗(Popup)、确认弹窗(ConfirmPopup)、提示弹窗(AlertPopup)和加载弹窗(LoadingPopup)。
        </p>
        <p className="text-gray-300">
          所有弹窗都支持自定义样式、动画、无障碍访问等功能，并提供了工具函数方便使用。
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* 基础弹窗示例 */}
        <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
          <h3 className="text-lg font-semibold mb-4">1. 基础弹窗 (Popup)</h3>
          <p className="text-gray-300 mb-4">最灵活的弹窗组件，可以自定义所有内容。</p>
          
          <button
            onClick={() => setShowBasicPopup(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
          >
            打开基础弹窗
          </button>

          <Popup
            isOpen={showBasicPopup}
            onClose={() => setShowBasicPopup(false)}
            title="基础弹窗示例"
            size="md"
            footer={
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowBasicPopup(false)}
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg"
                >
                  取消
                </button>
                <button
                  onClick={() => setShowBasicPopup(false)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg"
                >
                  确认
                </button>
              </div>
            }
          >
            <div className="space-y-4">
              <p className="text-gray-300">这是一个基础弹窗示例，你可以在这里放置任何内容。</p>
              <div className="bg-gray-700/30 p-4 rounded-lg">
                <p className="text-sm text-gray-400">支持的功能：</p>
                <ul className="text-sm text-gray-400 list-disc pl-5 mt-2 space-y-1">
                  <li>自定义标题、内容和底部</li>
                  <li>多种尺寸（sm, md, lg, xl, full）</li>
                  <li>多种动画效果（fade, slide, scale）</li>
                  <li>ESC键关闭</li>
                  <li>点击遮罩层关闭</li>
                  <li>无障碍访问支持</li>
                </ul>
              </div>
            </div>
          </Popup>
        </div>

        {/* 确认弹窗示例 */}
        <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
          <h3 className="text-lg font-semibold mb-4">2. 确认弹窗 (ConfirmPopup)</h3>
          <p className="text-gray-300 mb-4">用于需要用户确认的操作，如删除、退出等。</p>
          
          <div className="space-y-3">
            <button
              onClick={() => setShowConfirmPopup(true)}
              className="block w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
            >
              打开确认弹窗
            </button>
            
            <button
              onClick={() => setDeleteConfirmOpen(true)}
              className="block w-full px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
            >
              使用预设：删除确认
            </button>
          </div>

          {confirmResult && (
            <div className="mt-4 p-3 bg-gray-700/50 rounded-lg">
              <p className="text-gray-300">上次操作结果：<span className="font-semibold">{confirmResult}</span></p>
            </div>
          )}

          <ConfirmPopup
            isOpen={showConfirmPopup}
            onClose={() => setShowConfirmPopup(false)}
            onConfirm={() => handleConfirmResult(true)}
            onCancel={() => handleConfirmResult(false)}
            {...createConfirmConfig('确定要执行此操作吗？', {
              confirmType: 'primary',
              iconType: 'question',
            })}
          />

          <ConfirmPopup
            isOpen={deleteConfirmOpen}
            onClose={() => setDeleteConfirmOpen(false)}
            onConfirm={() => {
              console.log('执行删除操作');
              setDeleteConfirmOpen(false);
            }}
            onCancel={() => setDeleteConfirmOpen(false)}
            {...ConfirmPresets.delete('示例项目')}
          />
        </div>

        {/* 提示弹窗示例 */}
        <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
          <h3 className="text-lg font-semibold mb-4">3. 提示弹窗 (AlertPopup)</h3>
          <p className="text-gray-300 mb-4">用于显示成功、错误、警告等信息提示。</p>
          
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => {
                setAlertType('success');
                setShowAlertPopup(true);
              }}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
            >
              成功提示
            </button>
            <button
              onClick={() => {
                setAlertType('error');
                setShowAlertPopup(true);
              }}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
            >
              错误提示
            </button>
            <button
              onClick={() => {
                setAlertType('warning');
                setShowAlertPopup(true);
              }}
              className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 rounded-lg transition-colors"
            >
              警告提示
            </button>
            <button
              onClick={() => setSuccessAlertOpen(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
            >
              使用预设：成功提示
            </button>
          </div>

          <AlertPopup
            isOpen={showAlertPopup}
            onClose={() => setShowAlertPopup(false)}
            onConfirm={handleAlertConfirm}
            type={alertType}
            message={`这是一个${alertType === 'success' ? '成功' : alertType === 'error' ? '错误' : '警告'}提示示例！`}
            confirmText="知道了"
            autoClose={alertType === 'success' ? 2000 : 0}
          />

          <AlertPopup
            isOpen={successAlertOpen}
            onClose={() => setSuccessAlertOpen(false)}
            onConfirm={() => setSuccessAlertOpen(false)}
            {...AlertPresets.success('操作已成功完成！')}
          />
        </div>

        {/* 加载弹窗示例 */}
        <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
          <h3 className="text-lg font-semibold mb-4">4. 加载弹窗 (LoadingPopup)</h3>
          <p className="text-gray-300 mb-4">用于显示加载状态，支持进度条显示。</p>
          
          <div className="space-y-3">
            <button
              onClick={() => setShowLoadingPopup(true)}
              className="block w-full px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
            >
              打开普通加载弹窗
            </button>
            
            <button
              onClick={() => {
                setShowLoadingPopup(true);
                simulateProgress();
              }}
              className="block w-full px-4 py-2 bg-indigo-700 hover:bg-indigo-800 rounded-lg transition-colors"
            >
              打开进度加载弹窗
            </button>
          </div>

          <LoadingPopup
            isOpen={showLoadingPopup}
            onClose={() => setShowLoadingPopup(false)}
            showCancelButton={true}
            onCancel={() => {
              console.log('用户取消了加载');
              setShowLoadingPopup(false);
              setLoadingProgress(0);
            }}
            {...createLoadingConfig('正在处理中...', {
              showProgress: loadingProgress > 0,
              progress: loadingProgress,
            })}
          />
        </div>
      </div>

      {/* 使用说明 */}
      <div className="mt-8 bg-gray-800/30 rounded-xl p-6 border border-gray-700">
        <h3 className="text-lg font-semibold mb-4">使用说明</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-gray-300 mb-2">基础用法</h4>
            <pre className="bg-gray-900 p-4 rounded-lg text-sm text-gray-300 overflow-x-auto">
{`// 导入组件
import ConfirmPopup from './components/ConfirmPopup';

// 在组件中使用
const [isOpen, setIsOpen] = useState(false);

<ConfirmPopup
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  onConfirm={() => {
    console.log('用户确认');
    setIsOpen(false);
  }}
  message="确定要执行此操作吗？"
/>`}
            </pre>
          </div>

          <div>
            <h4 className="font-medium text-gray-300 mb-2">使用工具函数</h4>
            <pre className="bg-gray-900 p-4 rounded-lg text-sm text-gray-300 overflow-x-auto">
{`// 导入工具函数
import { createConfirmConfig } from './helper/popupUtils';

// 创建配置
const confirmConfig = createConfirmConfig('确定要删除吗？', {
  confirmType: 'danger',
  iconType: 'warning'
});

// 使用配置
<ConfirmPopup
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  {...confirmConfig}
/>`}
            </pre>
          </div>
        </div>

        <div className="mt-6">
          <h4 className="font-medium text-gray-300 mb-2">预设配置</h4>
          <pre className="bg-gray-900 p-4 rounded-lg text-sm text-gray-300 overflow-x-auto">
{`// 导入预设
import { ConfirmPresets, AlertPresets } from './helper/popupUtils';

// 使用预设
<ConfirmPopup
  isOpen={deleteOpen}
  onClose={() => setDeleteOpen(false)}
  {...ConfirmPresets.delete('项目名称')}
/>

<AlertPopup
  isOpen={successOpen}
  onClose={() => setSuccessOpen(false)}
  {...AlertPresets.success('操作成功！')}
/>`}
          </pre>
        </div>
      </div>

      <div className="mt-8 text-center text-gray-400 text-sm">
        <p>更多详细用法请查看组件源码和类型定义。</p>
      </div>
    </div>
  );
};

export default PopupExamples;