import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { invokeAccInit } from "./helper/rustInvoke";
import { logger } from "./helper/logger";

async function initApp() {
  try {
    logger.info("应用初始化开始...");
    await invokeAccInit();
    logger.info("应用初始化完成...");
  } catch (e) {
    logger.error("应用初始化失败：", e);
  }
}

initApp();

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
