# 调谐器（Tuner）

`@zhang1career/tuner` 为 React Native（iOS/Android）提供「可调变量」能力：通过 `@tuning` 装饰器声明变量后，侧边抽屉中会显示对应的滑动条，调试开关开启时可在屏幕左上角展示变量名与数值。

## 原理

### 架构

- **TunerStore**：单例，维护所有已注册可调变量的名称、当前值、范围（min/max/step）及订阅者。
- **@tuning 装饰器**：在类定义时把属性注册到 TunerStore，并将该属性改为 getter/setter，读写均走 Store。
- **RN 组件**：`TunerSliderSection`、`TunerDebugOverlay` 通过 `useSyncExternalStore` 订阅 TunerStore，根据 Store 中的条目渲染 UI。

### 数据流

1. 模块加载时，带 `@tuning` 的类被定义，装饰器执行，调用 `TunerStore.register(name, initialValue, options)`。
2. 用户拖动抽屉内滑动条 → `TunerStore.setValue(name, value)` → Store 更新并 `notify()` → 订阅者（含 DebugOverlay、SliderSection）重渲染。
3. 业务代码读取被装饰属性时，getter 从 `TunerStore.getValue(name)` 取当前值。

### 装饰器语义

- 装饰器接收 **初始值** 和可选的 **TuningOptions**（`min`、`max`、`step`）。
- 变量名来自类属性的 **propertyKey**，即代码里的字段名。
- 去掉装饰器后，该属性不再注册；下次热更新/重启后，Store 中不再包含该变量，抽屉与调试窗口会自然不再显示该项。

## 安装与依赖

```bash
npm install @zhang1career/tuner @react-native-community/slider
```

**peerDependencies**：`react`、`react-native`、`@react-native-community/slider`。

**Babel**：需启用装饰器。在 `babel.config.js` 中：

```javascript
plugins: [['@babel/plugin-proposal-decorators', { legacy: true }]],
```

**TypeScript**：`tsconfig.json` 中需开启：

```json
"experimentalDecorators": true,
"emitDecoratorMetadata": true
```

## 使用方法

### 1. 定义可调变量

在应用内定义配置类，用 `@tuning(初始值, options?)` 装饰需要调节的数值属性：

```typescript
import { tuning } from '@zhang1career/tuner';

class AppTuning {
  @tuning(0.5, { min: 0, max: 1 }) volume = 0.5;
  @tuning(80, { min: 0, max: 100 }) brightness = 80;
}

// 模块加载时实例化，触发装饰器注册
void new AppTuning();
```

- 第一个参数为 **初始值**（也是默认值）。
- 第二个参数可选：`min`、`max`、`step`，用于滑动条范围和步进。

### 2. 在侧边抽屉中显示滑动条

将 `TunerSliderSection` 放入侧边抽屉内容区（例如在「调试」区块上方）：

```tsx
import { TunerSliderSection } from '@zhang1career/tuner';

// 在抽屉的 ScrollView 内
<View style={styles.items}>
  <TunerSliderSection />
  {/* 其他抽屉项：背景音、调试开关等 */}
</View>
```

无任何 `@tuning` 变量时，`TunerSliderSection` 不渲染内容。

### 3. 在调试模式下显示变量值

当「调试」开关开启时，用 `TunerDebugOverlay` 在屏幕左上角显示可调变量名和当前值：

```tsx
import { TunerDebugOverlay } from '@zhang1career/tuner';

// 独立浮层（左上角绝对定位）
<TunerDebugOverlay visible={debugEnabled} />

// 或嵌入到现有调试容器内（无绝对定位）
{debugEnabled && (
  <View style={styles.debugContainer}>
    <TunerDebugOverlay visible={debugEnabled} embedded />
    {/* 其他只读调试信息 */}
  </View>
)}
```

- **visible**：为 `true` 时显示。
- **embedded**：为 `true` 时不用绝对定位，适合放在已有调试容器里。

### 4. 在业务中使用可调值

若需在逻辑中读取当前值，可保留配置类实例并读取属性（getter 会从 Store 取最新值）：

```typescript
const appTuning = new AppTuning();

// 读取
const vol = appTuning.volume;

// 写入（会同步到 Store，UI 会更新）
appTuning.volume = 0.8;
```

仅做「抽屉 + 调试展示」时，也可以只执行 `void new AppTuning();` 不做引用。

## API 摘要

| 导出 | 说明 |
|------|------|
| `tuning(initialValue, options?)` | 类属性装饰器，注册可调变量 |
| `TunerStore` | 单例 Store：`register` / `unregister` / `getValue` / `setValue` / `getAll` / `subscribe` |
| `TunerSliderSection` | 抽屉内滑动条区块（React Native） |
| `TunerDebugOverlay` | 调试浮层/内嵌块（React Native） |
| `TuningOptions` | `{ min?, max?, step? }` |
| `TunableEntry` | `{ name, value, min?, max?, step? }` |

## 平台说明

- **React Native（iOS/Android）**：完整支持；需安装 `@react-native-community/slider`，并在 Babel/TS 中启用装饰器。
- **Web / Taro**：当前包内 RN 组件依赖 `react-native` 与 Slider，不适用于 Web；若需 Web 端可调变量，可仅使用 `TunerStore` + `tuning` 装饰器，自行实现 UI。
