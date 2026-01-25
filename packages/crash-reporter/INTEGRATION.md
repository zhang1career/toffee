# 崩溃报告器集成检查清单

## ✅ 已完成的工作

### 1. 包结构创建
- [x] `package.json` - 包配置和 exports 字段
- [x] `tsconfig.json` - TypeScript 配置
- [x] 目录结构创建

### 2. 原生 iOS 代码
- [x] `ios/CrashReporter.h` - 原生崩溃捕获头文件
- [x] `ios/CrashReporter.m` - 原生崩溃捕获实现
- [x] `ios/RCTCrashReporter.h` - React Native Bridge 头文件
- [x] `ios/RCTCrashReporter.m` - React Native Bridge 实现
- [x] `ios/README.md` - 集成说明文档

### 3. TypeScript 代码
- [x] `src/interface.ts` - 类型定义
- [x] `src/native.ts` - React Native 平台实现
- [x] `src/web.ts` - Web 平台存根实现
- [x] `src/index.ts` - 主入口文件
- [x] `src/components/CrashLogViewer.tsx` - 日志查看组件

### 4. 项目集成
- [x] `apps/native/package.json` - 添加依赖
- [x] `apps/native/ios/EchoNative/AppDelegate.mm` - 集成原生崩溃捕获
- [x] `apps/native/src/App.tsx` - 集成 JavaScript 错误捕获

### 5. 文档
- [x] `README.md` - 使用说明文档
- [x] `ios/README.md` - iOS 集成说明

## ⚠️ 需要手动完成的步骤

### 1. 将原生文件添加到 Xcode 项目

**重要**：这是唯一需要手动完成的步骤！

1. 打开 Xcode：`apps/native/ios/EchoNative.xcworkspace`
2. 在项目导航器中，右键点击 `EchoNative` 项目
3. 选择 "Add Files to EchoNative..."
4. 导航到 `packages/crash-reporter/ios/` 目录
5. 选择以下 4 个文件：
   - `CrashReporter.h`
   - `CrashReporter.m`
   - `RCTCrashReporter.h`
   - `RCTCrashReporter.m`
6. 确保勾选：
   - ✅ "Copy items if needed"（如果需要）
   - ✅ "Create groups"
   - ✅ 目标 "EchoNative"
7. 点击 "Add"

### 2. 验证集成

1. 在 Xcode 中检查文件是否已添加
2. 检查 "Build Phases" → "Compile Sources" 中是否包含：
   - `CrashReporter.m`
   - `RCTCrashReporter.m`
3. 清理并重新构建项目

## 🧪 测试

### 测试原生崩溃捕获

1. 在代码中触发一个原生崩溃（仅用于测试）：
   ```objc
   // 在 AppDelegate.mm 中临时添加
   // abort(); // 取消注释以测试崩溃捕获
   ```

2. 运行应用，应用会崩溃
3. 重新启动应用
4. 检查日志：
   ```typescript
   const logs = await CrashReporter.getCrashLogs();
   logger.log('Crash logs:', logs);
   ```

### 测试 JavaScript 错误捕获

1. 在代码中触发一个错误：
   ```typescript
   throw new Error('Test error');
   ```

2. 检查日志是否已保存

### 测试未处理的 Promise 拒绝

```typescript
Promise.reject(new Error('Unhandled promise rejection'));
```

## 📝 使用示例

### 基本初始化

```typescript
import { CrashReporter } from '@echo/crash-reporter';

useEffect(() => {
  CrashReporter.initialize({
    enableNativeCrashCapture: true,
    enableJSErrorCapture: true,
    logRetentionDays: 30,
  });
}, []);
```

### 查看崩溃日志

```typescript
// 获取所有日志
const logs = await CrashReporter.getCrashLogs();

// 获取最近一次崩溃
const lastLog = await CrashReporter.getLastCrashLog();

// 使用查看组件
import { CrashLogViewer } from '@echo/crash-reporter';
<CrashLogViewer visible={true} onClose={() => {}} />
```

## 🔍 故障排除

### 编译错误：找不到头文件

**解决方案**：
1. 检查文件是否已添加到 Xcode 项目
2. 检查 "Header Search Paths" 设置
3. 确保使用 `.xcworkspace` 而不是 `.xcodeproj`

### 运行时错误：原生模块未找到

**解决方案**：
1. 确保原生文件已添加到 "Compile Sources"
2. 清理并重新构建项目
3. 重新运行 `pod install`（如果使用 CocoaPods）

### 崩溃日志未保存

**解决方案**：
1. 检查应用权限
2. 确认崩溃捕获已初始化
3. 查看 Xcode 控制台日志

## 📚 相关文档

- [README.md](./README.md) - 完整使用文档
- [ios/README.md](./ios/README.md) - iOS 集成详细说明

