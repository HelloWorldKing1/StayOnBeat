# AGENTS.md — StayOnBeat AI 协作规范

本文件是仓库级 AI 协作规范，适用于所有 AI 编码代理（Codex、Claude Code、Cursor 等）。它覆盖本仓库根目录及所有子目录；与本文档冲突时，以用户直接指令为准。

## 1. 项目是什么

StayOnBeat 是一个**在线节奏训练器**：

- 产品参考：https://metronome-online.com/zh
- 核心差异：在传统节拍器上增加“跟随节拍点击 → 实时命中判定 → 匹配度评分”，类似节奏游戏。
- 目标用户：上班时间不能练琴、需要保持节奏感的用户。
- 核心形态：纯浏览器端，无需登录即可训练。

## 2. 当前阶段：文档先行，暂不编码

- 当前仓库处于**设计与方案阶段**。
- 除非用户明确要求开始实现，否则不要创建应用代码、脚手架、样式、依赖或配置文件。
- 如果用户要求修改功能或技术方向，先更新对应文档，再按用户指示编码。
- 已批准的产品/技术基线：

  - `docs/product-design.md` — 产品与交互设计
  - `docs/technical-solution.md` — 技术方案
  - `docs/ai-agent-guide.md` — AI 协作流程与验收清单

## 3. 目录结构

```text
StayOnBeat/
├── AGENTS.md
├── README.md
├── docs/
│   ├── product-design.md
│   ├── technical-solution.md
│   └── ai-agent-guide.md
└── .idea/                  # IDE 配置，不参与业务实现
```

## 4. 核心原则

1. **先读文档，再行动**：任何任务先阅读 `docs/` 下相关文档。
2. **方案收敛**：技术选型、判定规则、数据模型以 `docs/technical-solution.md` 为准。
3. **产品口径**：功能范围、交互、视觉规范以 `docs/product-design.md` 为准。
4. **小步交付**：优先实现可验证的最小闭环，避免一次性大重构。
5. **节奏准确优先**：一切评分都依赖稳定节拍，不能为视觉或代码简洁牺牲音频调度精度。
6. **不做不必要的复杂度**：MVP 不需要后端、账号、复杂路由、重量级状态管理。
7. **不复制参考站素材**：只参考交互和功能，不搬运其文案、Logo、图标、图片或 CSS。

## 5. 既定技术决策

- 前端：React 18 + TypeScript + Vite。
- 样式：Tailwind CSS。
- 状态：Zustand。
- 音频：Web Audio API，采用 lookahead scheduler，不用 `setInterval` 驱动发声。
- 输入：Pointer Events 统一鼠标/触摸，键盘主键 `Space`/`Enter`。
- 数据：`localStorage` 存设置，`IndexedDB` 存训练记录。
- 测试：Vitest + Testing Library + Playwright。
- 部署：静态托管（Vercel 或 Cloudflare Pages）。
- MVP 无后端。

如需变更上述决策，先更新 `docs/technical-solution.md` 的“技术选型”和“待决策问题”。

## 6. 关键领域规范

### 6.1 节拍调度

- 使用 `AudioContext.currentTime` 排程，普通定时器只负责“提前填满调度窗口”。
- 调度窗口建议 0.1–0.15s，定时器 tick 约 25ms。
- 音频、视觉、输入必须通过时钟桥对齐；不要混用 `Date.now()` 和音频时间。

### 6.2 评分

- MVP 判定窗口：低速场景名义上限为 Perfect ≤ 40ms、Great ≤ 80ms、Good ≤ 120ms，其余 Miss。
- 实际窗口动态收紧：`goodWindow = min(120ms, interval * 0.25)`，Great/Perfect 按该窗口比例压缩。
- 一个预期节拍只计一个有效点击，冗余点击不计分。
- 匹配度按技术方案中的加权命中分计算；实时与最终分别使用已出现/全部预期节拍作为分母。

### 6.3 状态

- 训练状态机：`IDLE → READY → COUNT_IN → TRAINING → SUMMARY → IDLE`；中止也进入 Summary。
- 节拍器模式状态机：`IDLE → READY → PLAYING → STOPPED → IDLE`，不产生计分会话。
- 训练中锁定 BPM/拍号/细分，避免评分不公平。

### 6.4 可访问性与体验

- 静音/仅视觉模式是核心场景，不能把“有声音”当作唯一节拍来源。
- 视觉提示不能只依赖颜色。
- 尊重 `prefers-reduced-motion`。

## 7. AI 代理工作流

1. 确认任务范围，阅读相关文档。
2. 若任务涉及产品范围变更，更新 `docs/product-design.md`。
3. 若任务涉及架构、算法、数据或依赖变更，更新 `docs/technical-solution.md`。
4. 需要时更新 `docs/ai-agent-guide.md` 的决策记录。
5. 按 `docs/ai-agent-guide.md` 的验收清单完成工作。
6. 最终回复引用改动的文档/文件路径，并说明验证情况。

## 8. 代码风格（未来实现阶段启用）

- TypeScript 严格模式。
- 组件单一职责；音频/评分逻辑与 UI 解耦。
- 不写无意义注释；注释只解释“为什么”。
- 命名清晰，禁止无上下文的一字母变量。
- 新逻辑尽量有单元测试；评分与调度函数必须测试。
- 提交信息用中文或英文均可，但需说明“做了什么、为什么”。

## 9. 禁止事项

- 不引入未在技术方案中批准的重型依赖。
- 不为 MVP 增加后端、登录、云同步、排行榜。
- 不复制参考站点资产或原文。
- 不提交 `.env`、密钥、本机绝对路径或无关 IDE 状态。
- 不在文档未更新的情况下，用临时代码绕过节拍调度或评分规则。

## 10. 文档更新规则

- 所有文档用中文编写。
- 文档版本采用 `v0.1` 起递增，`docs/product-design.md` 和 `docs/technical-solution.md` 顶部保持同步状态。
- 重大方向调整需在 `docs/ai-agent-guide.md` 的“决策记录”追加一条。
- README 只负责导航，不重复正文细节。
