// 根据平台自动选择实现
let CrashReporter: any;

try {
  // 尝试导入 React Native
  const { Platform } = require('react-native');
  if (Platform.OS === 'web') {
    const webModule = require('./web');
    CrashReporter = webModule.CrashReporter;
  } else {
    const nativeModule = require('./native');
    CrashReporter = nativeModule.CrashReporter;
  }
} catch {
  // 如果 React Native 不可用，使用 Web 实现
  const webModule = require('./web');
  CrashReporter = webModule.CrashReporter;
}

export { CrashReporter };
export type { CrashReporterConfig, CrashLog, CrashLogType } from './interface';

// 导出组件（可选）
export { CrashLogViewer } from './components/CrashLogViewer';

