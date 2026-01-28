# Toffee - 跨端公共库

Toffee 是一个跨端（Web、React Native、Taro）公共库集合，提供通用的功能抽象和 UI 组件。

## 包含的包

- `@zhang1career/audio` - 音频抽象层
- `@zhang1career/config` - 配置加载器（从环境变量读取）
- `@zhang1career/core` - 核心类型定义和状态机
- `@zhang1career/crash-reporter` - 崩溃监控包
- `@zhang1career/device` - 设备管理抽象层
- `@zhang1career/haptic` - 触觉反馈抽象层
- `@zhang1career/logger` - 日志抽象层
- `@zhang1career/network` - 网络服务抽象层
- `@zhang1career/ui` - 跨端 UI 组件


## 使用方式

### 作为 Git Submodule

在主项目中添加 submodule：

```bash
git submodule add <toffee-repo-url> toffee
```

### 在代码中使用

```typescript
import { InteractionStateMachine } from '@zhang1career/core';
import { NightSkyBackground } from '@zhang1career/ui';
import { webAudioAdapter } from '@zhang1career/audio';
```

## 开发

```bash
# 类型检查
npm run type-check

# 运行测试
npm run test

# 运行测试（监听模式）
npm run test:watch

# 运行测试并生成覆盖率报告
npm run test:coverage
```

### 测试

项目使用 [Vitest](https://vitest.dev/) 作为测试框架。

#### 运行单个包的测试

```bash
# 进入特定包目录
cd packages/core

# 运行测试
npm run test

# 生成覆盖率报告
npm run test:coverage
```

#### 查看覆盖率报告

运行 `npm run test:coverage` 后，覆盖率报告会生成在：
- 文本报告：终端输出
- HTML 报告：`packages/<package-name>/coverage/index.html`
- LCOV 报告：`packages/<package-name>/coverage/lcov.info`

#### 测试覆盖率目标

- 行覆盖率：80%
- 函数覆盖率：80%
- 分支覆盖率：70%
- 语句覆盖率：80%

## CI/CD

项目使用 GitHub Actions 进行持续集成。每次推送到 `main`/`master` 分支或创建 Pull Request 时，会自动运行：

1. 类型检查
2. 单元测试
3. 生成测试覆盖率报告

测试结果和覆盖率报告可以在 GitHub Actions 的 Artifacts 中下载。

## 发布

### 发布前准备

发布前需要：
1. 在项目根目录创建 `.env` 文件，添加 `GITHUB_TOKEN=your_token`
2. 确保 GitHub Personal Access Token 有 `write:packages` 权限

### 发布方式

使用 `publish.sh` 脚本可以灵活控制发布哪些包：

#### 1. 发布所有包（默认）

发布根包和所有子包：

```bash
./publish.sh
```

#### 2. 只发布根包

只发布根包 `@zhang1career/toffee`：

```bash
./publish.sh --root
```

#### 3. 发布指定的子包

发布单个子包：

```bash
./publish.sh --workspace core
```

发布多个指定的子包：

```bash
./publish.sh --workspace core audio ui
```

#### 4. 列出所有可发布的包

查看所有包及其版本信息：

```bash
./publish.sh --list
# 或
./publish.sh -l
```

#### 5. 查看帮助信息

```bash
./publish.sh --help
# 或
./publish.sh -h
```

### 可用的子包名称

- `core` - 核心类型定义和状态机
- `ui` - 跨端 UI 组件
- `audio` - 音频抽象层
- `network` - 网络服务抽象层
- `haptic` - 触觉反馈抽象层
- `device` - 设备管理抽象层
- `config` - 配置加载器
- `crash-reporter` - 崩溃监控包
