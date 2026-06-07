import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import NotificationProvider from "./components/common/NotificationProvider";
import { invokeAccInit } from "./helper/rustInvoke";
import { logger } from "./helper/logger";
import { useThemeStore } from "./stores/themeStore";
import { useInstanceStore } from "./stores/instanceStore";
import { useDownloadStore } from "./stores/downloadStore";
import { config } from "./config";
import { window } from "@tauri-apps/api";

import './styles/themes/dark.css';
import './styles/themes/accents.css';
import './styles/themes/light.css';
import './styles/themes/terminal.css'; // 极客终端风格主题
import './styles/animations.css'; // 加载动画关键帧

async function initApp() {
  try {
    logger.info("🚀 应用初始化开始...");
    
    // 1. 账户系统初始化（独立）
    logger.info("[1/5] 初始化账户系统...");
    await invokeAccInit();
    logger.info("✅ 账户系统初始化完成");
    
    // 2. 统一配置系统初始化（核心，其他 store 依赖）
    logger.info("[2/5] 初始化统一配置系统...");
    await config.initialize();
    logger.info("✅ 统一配置系统初始化完成");
    
    // 3. 等待配置就绪后，并行初始化其他 store
    logger.info("[3/5] 并行初始化其他 store...");
    await Promise.all([
      (async () => {
        logger.info("  - 初始化主题系统...");
        useThemeStore.getState().init();
        logger.info("  ✅ 主题系统初始化完成");
      })(),
      (async () => {
        logger.info("  - 初始化实例系统...");
        await useInstanceStore.getState().init();
        logger.info("  ✅ 实例系统初始化完成");
      })(),
      (async () => {
        logger.info("  - 初始化下载系统...");
        await useDownloadStore.getState().init();
        logger.info("  ✅ 下载系统初始化完成");
      })(),
    ]);
    
    logger.info("🎉 应用初始化完成！");
  } catch (e) {
    logger.error("❌ 应用初始化失败：", e);
    throw e;
  }
}

initApp();

document.addEventListener("wheel", function (e) {
  e.preventDefault();
}, { passive: false });

document.querySelector('body')?.addEventListener('wheel', function (e) {
  e.stopPropagation();
});

document.addEventListener('touchstart', function(event) {
    event.preventDefault()
}, { passive: false })

document.querySelector('body')?.addEventListener('touchstart', function(event) {
  event.stopPropagation()
})

const titleBar = document.getElementById('title-bar');
titleBar?.addEventListener('mousedown', async () => {
  // 窗口拖曳事件
  await window.getCurrentWindow().startDragging();
});

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <NotificationProvider>
    <App />
  </NotificationProvider>
);
