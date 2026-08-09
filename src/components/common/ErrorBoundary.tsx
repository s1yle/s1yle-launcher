import { Component, type ErrorInfo, type ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  error: Error | null;
}

/**
 * 全局错误边界：任何页面渲染异常都给出可见面板，避免静默白屏。
 */
export default class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary] 页面渲染异常:', error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="h-full w-full flex flex-col items-center justify-center gap-3 p-6 text-center">
          <div className="text-red-400 font-semibold">页面发生错误</div>
          <div className="text-red-400 font-semibold">请联系管理员，并提供相关报错信息或日志</div>
          <div className="text-sm opacity-60 max-w-md break-all">{this.state.error.message}</div>
          <button
            className="px-3 py-1 rounded border opacity-80 hover:opacity-100"
            onClick={() => this.setState({ error: null })}
          >
            重试
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}