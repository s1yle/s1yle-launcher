import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import enUS from '../locales/en-US/translation.json';
import zhCN from '../locales/zh-CN/translation.json';

/**
 * i18next 国际化实例
 *
 * 初始化配置：
 * - 语言资源：zh-CN（中文）、en-US（英文）
 * - 默认语言：zh-CN
 * - 回退语言：en-US
 * - 插值转义：关闭（React 已处理 XSS）
 */
i18n.use(initReactI18next).init({
  resources: {
    'en-US': { translation: enUS },
    'zh-CN': { translation: zhCN },
  },
  lng: 'zh-CN',
  fallbackLng: 'en-US',
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
