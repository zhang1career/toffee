# @echo/config

Echo 跨端应用共享配置包，从环境变量读取配置，支持 Web、React Native、Taro 等平台。

## 重构说明

**v0.2.0+**: 配置已改为从 `.env` 文件读取，业务特定配置已移到应用层。

### 通用配置（可加入公共库）

- `INTERACTION_CONFIG` - 交互配置（超时、动画时长等）
- `METRO_CONFIG` - Metro 配置（端口、主机等）

### 业务配置（应用层）

业务特定配置已移到应用层：
- `apps/web/src/config/app.ts` - Web 应用配置
- `apps/native/src/config/app.ts` - React Native 应用配置

包含：
- `APP_CONFIG` - 应用名称、显示名称
- `STORAGE_KEYS` - 存储键名（带业务前缀）
- `PERMISSIONS` - 权限描述文本

## 使用方法

### 1. 配置环境变量

创建 `.env` 文件（参考 `.env.example`）：

```bash
# 交互配置
INTERACTION_IDLE_TIMEOUT=5000
INTERACTION_FADE_TRANSITION_DURATION=2000
INTERACTION_TOUCH_HOLD_THRESHOLD=50
INTERACTION_ECHO_DISPLAY_DURATION=3000

# Metro 配置
METRO_DEFAULT_PORT=8081
METRO_DEFAULT_HOST=localhost
```

**注意**：
- **Web (Vite)**: 环境变量需要 `VITE_` 前缀
- **React Native**: 使用 `react-native-config` 或 `process.env`
- **Taro**: 使用 `process.env`

### 2. 在代码中使用

#### 通用配置（从 @echo/config）

```typescript
import { INTERACTION_CONFIG, METRO_CONFIG } from '@echo/config';

// 使用交互配置
const timeout = INTERACTION_CONFIG.idleTimeout;
const fadeDuration = INTERACTION_CONFIG.fadeTransitionDuration;

// 使用 Metro 配置
const port = METRO_CONFIG.defaultPort;
```

#### 业务配置（从应用层）

```typescript
// Web 应用
import { APP_CONFIG, STORAGE_KEYS } from '../config/app';

// React Native 应用
import { APP_CONFIG, STORAGE_KEYS } from '../config/app';
```

## 环境变量加载器

包会自动检测运行平台并选择合适的加载器：

- **Web**: `src/loaders/web.ts` - 使用 Vite 的 `import.meta.env`
- **React Native**: `src/loaders/native.ts` - 使用 `react-native-config` 或 `process.env`
- **Taro**: `src/loaders/taro.ts` - 使用 `process.env`

## 默认值

如果环境变量未设置，将使用默认值（见 `src/defaults.ts`）：

```typescript
{
  interaction: {
    idleTimeout: 5000,
    fadeTransitionDuration: 2000,
    touchHoldThreshold: 50,
    echoDisplayDuration: 3000,
  },
  metro: {
    defaultPort: 8081,
    defaultHost: 'localhost',
    bundleRoot: 'index',
    bundleName: 'main',
    bundleExtension: 'jsbundle',
  }
}
```

## 类型定义

```typescript
import type { InteractionConfig, MetroConfig } from '@echo/config';

const config: InteractionConfig = INTERACTION_CONFIG;
```

## iOS 原生代码生成

iOS 配置生成脚本已更新，支持从 `.env` 读取配置：

```bash
cd packages/config
npm run generate-ios
```

生成的配置文件位于：
- `apps/native/ios/EchoNative/EchoConfig.h`
- `apps/native/ios/EchoNative/EchoConfig.m`

## 迁移指南

### 从旧版本迁移

1. **创建 `.env` 文件**（参考 `.env.example`）
2. **更新导入路径**：
   ```typescript
   // 旧方式
   import { APP_CONFIG } from '@echo/config';
   
   // 新方式
   import { APP_CONFIG } from '../config/app';  // 应用层
   import { INTERACTION_CONFIG } from '@echo/config';  // 通用配置
   ```
3. **更新 iOS 生成脚本**：确保从 `.env` 读取配置

## 优势

1. ✅ **解耦业务逻辑** - 业务配置移到应用层
2. ✅ **可加入公共库** - 通用配置加载器可复用
3. ✅ **环境差异化** - 不同环境使用不同配置
4. ✅ **类型安全** - 保留 TypeScript 类型定义
5. ✅ **向后兼容** - 提供默认值，不影响现有代码

