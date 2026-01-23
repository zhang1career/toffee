# Toffee - 跨端公共库

Toffee 是一个跨端（Web、React Native、Taro）公共库集合，提供通用的功能抽象和 UI 组件。

## 包含的包

- `@toffee/core` - 核心类型定义和状态机
- `@toffee/ui` - 跨端 UI 组件
- `@toffee/audio` - 音频抽象层
- `@toffee/network` - 网络服务抽象层
- `@toffee/haptic` - 触觉反馈抽象层
- `@toffee/device` - 设备管理抽象层
- `@toffee/config` - 配置加载器（从环境变量读取）
- `@toffee/crash-reporter` - 崩溃监控包

## 使用方式

### 作为 Git Submodule

在主项目中添加 submodule：

```bash
git submodule add <toffee-repo-url> toffee
```

### 在代码中使用

```typescript
import { InteractionStateMachine } from '@toffee/core';
import { NightSkyBackground } from '@toffee/ui';
import { webAudioAdapter } from '@toffee/audio';
```

## 开发

```bash
# 类型检查
npm run type-check
```
