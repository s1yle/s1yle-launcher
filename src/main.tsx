import ReactDOM from "react-dom/client";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import LoginGate from "./pages/Login/LoginGate";
import App from "./App";
import NotificationProvider from "./components/common/NotificationProvider";

import './styles/themes/dark.css';
import './styles/themes/accents.css';
import './styles/themes/light.css';
import './styles/themes/terminal.css';
import './styles/animations.css';
import { Window } from "@tauri-apps/api/window";

// Global event handlers (both windows)

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

// Detect window type and render accordingly

const appWindow = getCurrentWebviewWindow();

if (appWindow.label === "loading") {
  ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
    <>
      <h1>Hello, Surprise!</h1>
      <h2>理论上来讲这段话从来不应该出现</h2>
      <h2>如有疑问，请联系管理员</h2>
    </>
  );
}

if (appWindow.label === 'login') {
  ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
    <NotificationProvider>
      <LoginGate />
    </NotificationProvider>
  );
} else {
  ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
    <NotificationProvider>
      <App />
    </NotificationProvider>
  );
}
