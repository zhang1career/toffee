# iOS Native Module 集成说明

本目录包含崩溃报告器的原生 iOS 代码。需要将这些文件添加到 Xcode 项目中。

## 文件列表

- `CrashReporter.h` - 原生崩溃捕获头文件
- `CrashReporter.m` - 原生崩溃捕获实现
- `RCTCrashReporter.h` - React Native Bridge 头文件
- `RCTCrashReporter.m` - React Native Bridge 实现

## 集成步骤

### 方法 1：通过 Xcode 手动添加（推荐）

1. 打开 Xcode 项目：`apps/native/ios/EchoNative.xcworkspace`

2. 在项目导航器中，右键点击 `EchoNative` 项目

3. 选择 "Add Files to EchoNative..."

4. 导航到 `packages/crash-reporter/ios/` 目录

5. 选择以下文件：
   - `CrashReporter.h`
   - `CrashReporter.m`
   - `RCTCrashReporter.h`
   - `RCTCrashReporter.m`

6. 确保以下选项已勾选：
   - ✅ "Copy items if needed"（如果需要）
   - ✅ "Create groups"（推荐）
   - ✅ 目标 "EchoNative"

7. 点击 "Add"

### 方法 2：通过 project.pbxproj 文件添加（高级）

如果你熟悉 Xcode 项目文件格式，可以直接编辑 `project.pbxproj` 文件。

## 验证集成

1. 在 Xcode 中，检查项目导航器是否显示了这些文件

2. 确保文件已添加到 "Compile Sources" 构建阶段：
   - 选择项目 → Target "EchoNative" → "Build Phases"
   - 展开 "Compile Sources"
   - 确认 `CrashReporter.m` 和 `RCTCrashReporter.m` 都在列表中

3. 清理并重新构建项目：
   ```bash
   cd apps/native/ios
   xcodebuild clean -workspace EchoNative.xcworkspace -scheme EchoNative
   ```

## 注意事项

- 这些文件已经通过 `AppDelegate.mm` 中的相对路径导入
- 如果文件路径发生变化，需要更新 `AppDelegate.mm` 中的导入路径
- 确保 React Native 的 Headers Search Paths 包含必要的路径

## 故障排除

如果遇到编译错误：

1. **找不到头文件**：
   - 检查 "Header Search Paths" 设置
   - 确保 React Native 的路径已正确配置

2. **链接错误**：
   - 确保所有 `.m` 文件都已添加到 "Compile Sources"
   - 检查是否有重复的文件引用

3. **运行时错误**：
   - 确保原生模块已正确注册
   - 检查 `AppDelegate.mm` 中的导入路径是否正确

