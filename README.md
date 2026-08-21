# StayOnBeat

面向“工作间隙不能练琴”场景的在线节奏训练器：在节拍器基础上加入键盘/鼠标点击跟随，实时给出命中判定、连击与匹配度，类似音游体验。

## 当前状态

**实现阶段：M0 工程基线已完成，下一阶段为 M1 节拍器核心。**

## 本地启动

### 环境要求

- Node.js ≥ 20.19（建议使用已验证的 Node.js 24）
- pnpm ≥ 9（建议使用 pnpm 11）

### 启动步骤

```bash
cd StayOnBeat
pnpm install
pnpm dev
```

启动后访问 Vite 输出的本地地址，默认通常为：

```text
http://localhost:5173
```

### 常用命令

```bash
# 开发模式
pnpm dev

# 生产构建
pnpm build

# 本地预览生产构建产物
pnpm preview

# 单元测试
pnpm test

# 单元测试监听模式
pnpm test:watch

# 代码检查
pnpm lint

# 自动格式化代码
pnpm format

# 检查代码格式
pnpm format:check
```

### 端到端测试

首次运行 E2E 测试前，需要安装 Playwright 浏览器：

```bash
pnpm exec playwright install chromium
pnpm test:e2e
```

如仅查看 E2E 用例列表，可运行：

```bash
pnpm exec playwright test --list
```

## 文档导航

- [产品与交互设计](docs/product-design.md)
- [技术方案](docs/technical-solution.md)
- [开发计划](docs/development-plan.md)
- [AI 协作规范](AGENTS.md)
- [AI 代理协作指南](docs/ai-agent-guide.md)

## 核心定位

- 浏览器直接使用，无需登录、无需下载。
- 节拍器基础能力：BPM、拍号、重音、细分、计时器、Tap BPM、亮暗主题、全屏。
- 训练评分能力：键盘/鼠标点击 → Perfect/Great/Good/Miss → 实时匹配度 → 会话总结。
- 办公室友好：静音/仅视觉节拍模式。

## 技术栈草案

React + TypeScript + Vite + Tailwind CSS + Zustand + Web Audio API + IndexedDB。

详细内容见 `docs/technical-solution.md`。
