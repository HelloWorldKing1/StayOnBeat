# CLAUDE.md — Claude Code 项目说明

本文件是 Claude Code 在本仓库的定向说明，**补充而非替代** `AGENTS.md`（仓库级 AI 协作规范，跨工具适用）。工作前请先读 `AGENTS.md` 与相关文档。

## 项目

StayOnBeat：在线节奏训练器。参考 `metronome-online.com/zh` 的节拍器能力，额外加入「跟随节拍用键盘/鼠标点击 → 实时命中判定 → 匹配度评分」（音游式）。目标用户是上班时间不能练琴的人。纯浏览器端，无登录、无后端。

## 当前阶段

- M0 工程基线已完成（React 18 + TS + Vite + Tailwind 4 + Zustand 5 + Vitest + Playwright）。
- 下一里程碑：**M1 节拍器核心**，详细任务拆解见 `docs/development-plan.md` §5.2。
- **默认只维护文档，不编写产品代码，除非用户明确指示。**

## 常用命令（pnpm）

```bash
pnpm dev        # 开发服务器
pnpm build      # 类型检查 + 构建
pnpm test       # 单元测试（Vitest）
pnpm test:e2e   # E2E（Playwright）
pnpm lint       # ESLint
pnpm format     # Prettier 格式化
```

> 环境注意：若出现 `pnpm: command not found`，用 `corepack enable pnpm` 或 `npx pnpm ...` 恢复，不要因此改动工程配置。

## 工程红线（改动前必读）

- 节拍调度用 Web Audio **lookahead scheduler**（约 25ms refill timer + `scheduleAheadTime` 0.1–0.15s），**禁止用 `setInterval`/`setTimeout` 直接发声**。
- 音频时间（`AudioContext.currentTime`）、性能时间（`performance.now()`）、输入时间必须经时钟桥（`src/lib/clock.ts`）对齐。
- `AudioContext` 只能在用户手势调用栈内创建/resume（autoplay 策略）。
- 静音/仅视觉模式是核心场景，不是后补功能。
- 评分（M3 起）与调度函数必须有单元测试。

## 文档基线（改行为先改文档）

- `AGENTS.md` — AI 协作规范（先读）
- `docs/product-design.md` — 产品与交互设计（功能/UX 口径）
- `docs/technical-solution.md` — 技术方案（架构/算法/数据基线）
- `docs/development-plan.md` — 开发计划（里程碑与任务）
- `docs/ai-agent-guide.md` — AI 代理流程、验收清单、决策记录

## 铁律

- 先读文档，再行动；文档是基线，改行为先改文档。
- 不复制参考站素材（文案/Logo/图标/CSS）。
- MVP 无后端、无账号、无排行榜。
- 不引入未批准的重型依赖。
