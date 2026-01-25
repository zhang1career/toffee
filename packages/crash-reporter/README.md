# @echo/crash-reporter

可复用的崩溃监控和日志记录包，支持 React Native iOS 应用。

## 功能特性

- ✅ **原生崩溃捕获**：捕获 iOS 原生层的崩溃（异常和信号）
- ✅ **JavaScript 错误捕获**：捕获 React Native JS 层的错误和未处理的 Promise 拒绝
- ✅ **持久化存储**：崩溃日志保存到本地文件，崩溃后仍可查看
- ✅ **设备信息收集**：自动收集设备型号、iOS 版本、内存使用等信息
- ✅ **日志管理**：支持查看、清理和导出崩溃日志
- ✅ **可复用设计**：独立包设计，可在多个项目中复用

## 安装

在项目的 `package.json` 中添加依赖：

```json
{
  "dependencies": {
    "@echo/crash-reporter": "*"
  }
}
```

## iOS 原生文件集成

### 步骤 1：添加文件到 Xcode 项目

1. 打开 Xcode 项目：`apps/native/ios/EchoNative.xcworkspace`
2. 在项目导航器中，右键点击 `EchoNative` 项目
3. 选择 "Add Files to EchoNative..."
4. 导航到 `packages/crash-reporter/ios/` 目录
5. 选择以下文件：
   - `CrashReporter.h`
   - `CrashReporter.m`
   - `RCTCrashReporter.h`
   - `RCTCrashReporter.m`
6. 确保勾选 "Create groups" 和目标 "EchoNative"
7. 点击 "Add"

详细说明请参考 [ios/README.md](./ios/README.md)

### 步骤 2：在 AppDelegate 中初始化（可选）

如果需要在应用启动时立即捕获原生崩溃，可以在 `AppDelegate.mm` 中添加：

```objc
#import "CrashReporter.h"

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions {
  // 尽早初始化崩溃捕获
  [[CrashReporter sharedInstance] initializeWithLogRetentionDays:30];
  
  // ... 其他初始化代码
}
```

## 使用方法

### 基本使用

在应用的入口文件（如 `App.tsx`）中初始化：

```typescript
import { CrashReporter } from '@echo/crash-reporter';
import { useEffect } from 'react';

function App() {
  useEffect(() => {
    // 初始化崩溃报告器
    CrashReporter.initialize({
      enableNativeCrashCapture: true,
      enableJSErrorCapture: true,
      logRetentionDays: 30,
      showErrorInDev: __DEV__, // 开发模式下显示错误
    });
  }, []);

  // ... 应用代码
}
```

### 配置选项

```typescript
interface CrashReporterConfig {
  /** 是否启用原生崩溃捕获（默认：true） */
  enableNativeCrashCapture?: boolean;
  
  /** 是否启用 JavaScript 错误捕获（默认：true） */
  enableJSErrorCapture?: boolean;
  
  /** 日志保留天数（默认：30 天） */
  logRetentionDays?: number;
  
  /** 是否在开发模式下显示错误（默认：false） */
  showErrorInDev?: boolean;
}
```

### 获取崩溃日志

```typescript
// 获取所有崩溃日志
const logs = await CrashReporter.getCrashLogs();
logger.log('Crash logs:', logs);

// 获取最近一次崩溃日志
const lastLog = await CrashReporter.getLastCrashLog();
if (lastLog) {
  logger.log('Last crash:', lastLog);
}

// 清理所有日志
await CrashReporter.clearCrashLogs();
```

### 手动记录错误

```typescript
try {
  // 可能出错的代码
} catch (error) {
  // 手动记录错误
  await CrashReporter.recordError(error, 'js');
}
```

### 使用日志查看组件（可选）

```typescript
import { CrashLogViewer } from '@echo/crash-reporter';

function SettingsScreen() {
  const [showLogs, setShowLogs] = useState(false);

  return (
    <View>
      <Button title="查看崩溃日志" onPress={() => setShowLogs(true)} />
      {showLogs && (
        <CrashLogViewer
          visible={showLogs}
          onClose={() => setShowLogs(false)}
        />
      )}
    </View>
  );
}
```

## 崩溃日志格式

```typescript
interface CrashLog {
  /** 崩溃唯一标识 */
  id: string;
  
  /** 崩溃类型：'native' | 'js' | 'unhandled_promise' */
  type: CrashLogType;
  
  /** 崩溃时间戳（ISO 8601 格式） */
  timestamp: string;
  
  /** 崩溃消息/错误信息 */
  message: string;
  
  /** 堆栈信息 */
  stack?: string;
  
  /** 设备信息 */
  deviceInfo?: {
    iosVersion?: string;
    deviceModel?: string;
    appVersion?: string;
    memoryUsage?: number; // MB
  };
  
  /** 额外信息 */
  extra?: string;
}
```

## 日志存储位置

崩溃日志保存在应用的 Documents 目录下的 `crash_logs/` 文件夹：

- **文件命名格式**：`crash_YYYYMMDD_HHMMSS_type.log`
- **文件格式**：JSON
- **自动清理**：超过保留天数的日志会自动删除

## 查看崩溃日志

### 方法 1：通过 Xcode 设备窗口

1. 连接设备到 Mac
2. 打开 Xcode → Window → Devices and Simulators
3. 选择设备 → 选择应用 → 点击 "Download Container..."
4. 在下载的容器中找到 `AppData/Documents/crash_logs/` 目录

### 方法 2：通过 App 内查看组件

使用 `CrashLogViewer` 组件在应用内查看日志。

### 方法 3：通过代码获取

```typescript
const logs = await CrashReporter.getCrashLogs();
// 处理日志数据
```

## 故障排除

### 问题：原生模块未找到（⚠️ CrashReporter native module is not available）

**症状**：
- 应用启动时看到警告：`⚠️ CrashReporter native module is not available`
- 崩溃报告功能不可用，但应用仍可正常运行

**可能原因**：
1. 原生文件未正确添加到 Xcode 项目
2. 项目需要清理并重新构建
3. 模块名称不匹配（React Native 会自动去掉 `RCT` 前缀）

**解决方案**：

#### 步骤 1：验证文件已添加到 Xcode 项目
1. 打开 Xcode 项目：`apps/native/ios/EchoNative.xcworkspace`
2. 在项目导航器中，确认以下文件存在：
   - `CrashReporter.h`
   - `CrashReporter.m`
   - `RCTCrashReporter.h`
   - `RCTCrashReporter.m`
3. 检查文件是否在 "Compile Sources" 构建阶段：
   - 选择项目 → Build Phases → Compile Sources
   - 确认 `CrashReporter.m` 和 `RCTCrashReporter.m` 都在列表中

#### 步骤 2：清理并重新构建
```bash
# 在 Xcode 中：
# 1. Product → Clean Build Folder (Cmd+Shift+K)
# 2. Product → Build (Cmd+B)

# 或使用命令行：
cd apps/native/ios
xcodebuild clean -workspace EchoNative.xcworkspace -scheme EchoNative
```

#### 步骤 3：验证模块注册
在开发模式下，代码会自动打印所有可用的原生模块名称。检查控制台输出，确认 `CrashReporter` 或 `RCTCrashReporter` 是否在列表中。

#### 步骤 4：检查 Podfile 配置
确保 `Podfile` 中使用了 `use_native_modules!`（通常已自动配置）。

#### 步骤 5：重新安装 Pods（如果需要）
```bash
cd apps/native/ios
pod install
```

**注意**：如果问题仍然存在，可能是 React Native 的自动链接在 monorepo 环境中的已知限制。可以尝试：
- 将 `@echo/crash-reporter` 直接添加到 `apps/native/package.json` 的 dependencies
- 或者手动在 `react-native.config.js` 中配置模块路径

### 问题：崩溃日志未保存

**解决方案**：
1. 检查应用是否有写入 Documents 目录的权限
2. 确认崩溃捕获已正确初始化
3. 查看 Xcode 控制台是否有错误信息

### 问题：JavaScript 错误未捕获

**解决方案**：
1. 确保 `CrashReporter.initialize()` 已调用
2. 检查 `enableJSErrorCapture` 配置是否为 `true`
3. 确认 ErrorUtils 可用（React Native 环境）

## 在其他项目中使用

这个包设计为可复用的，可以在其他 React Native 项目中使用：

1. 将 `packages/crash-reporter` 复制到新项目
2. 在 `package.json` 中添加依赖
3. 按照上述步骤集成原生文件
4. 在应用入口初始化崩溃报告器

## 后续扩展

- [ ] Android 平台支持
- [ ] 集成 Sentry/Bugsnag 等第三方服务
- [ ] 崩溃上报到服务器
- [ ] 崩溃统计和分析面板

## License

MIT

