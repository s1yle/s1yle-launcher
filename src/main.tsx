import ReactDOM from "react-dom/client";
import { Window } from "@tauri-apps/api/window";
import App from "./App";
import NotificationProvider from "./components/common/NotificationProvider";

import './styles/themes/dark.css';
import './styles/themes/accents.css';
import './styles/themes/light.css';
import './styles/themes/terminal.css';
import './styles/animations.css';
import './styles/accessibility.css';

// Global event handlers

// 拦截浏览器级刷新快捷键（F5 / Ctrl+R / Cmd+R），避免启动器被意外刷新
document.addEventListener('keydown', function (e) {
  if (
    e.key === 'F5' ||
    e.key === 'F6' ||
    ((e.ctrlKey || e.metaKey) && ['r', 'R'].includes(e.key))
  ) {
    e.preventDefault();
    e.stopPropagation();
  }
}, true);

document.addEventListener("wheel", function (e) {
  e.preventDefault();
}, { passive: false });

document.querySelector('body')?.addEventListener('wheel', function (e) {
  e.stopPropagation();
});

document.addEventListener('touchstart', function (event) {
  event.preventDefault()
}, { passive: false })

document.querySelector('body')?.addEventListener('touchstart', function (event) {
  event.stopPropagation()
})

const titleBar = document.getElementById('title-bar');
titleBar?.addEventListener('mousedown', async () => {
  // 窗口拖曳事件
  await Window.getCurrent().startDragging();
});

window.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    Window.getCurrent().show();
    Window.getCurrent().setFocusable(true);
    Window.getCurrent().setFocus();
    Window.getCurrent().setIgnoreCursorEvents(false);
  }, 1)  // 需要加延迟，否则仍可能白屏
});

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <NotificationProvider>
    <App />
  </NotificationProvider>
);
