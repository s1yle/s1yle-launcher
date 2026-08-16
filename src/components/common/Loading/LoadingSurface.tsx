import Loading from '@/pages/Loading';

/**
 * 加载表面组件：纯 Suspense / loader 阶段兜底加载动画。
 * 页面数据预加载（路由 loader）完成后才挂载页面组件，
 * 组件自身不再承担 loading 显隐逻辑。
 */
const LoadingSurface = () => <Loading />;

export default LoadingSurface;