import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import NotificationProvider from "./components/common/NotificationProvider";
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

document.addEventListener("wheel", function (e) {
  console.log("Wheel event detected, preventing default behavior.");
  e.preventDefault();
}, { passive: false });

document.querySelector('body')?.addEventListener('wheel', function (e) {
  console.log("Wheel event detected, stopping propagation.");
  e.stopPropagation();
});

document.addEventListener('touchstart', function(event) {
    console.log("Touchstart event detected, preventing default behavior.");
    event.preventDefault()
}, { passive: false })

document.querySelector('body')?.addEventListener('touchstart', function(event) {
  event.stopPropagation()
})


ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <NotificationProvider>
      <App />
    </NotificationProvider>
  </React.StrictMode>,
);
