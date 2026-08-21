# StayOnBeat

面向“工作间隙不能练琴”场景的在线节奏训练器：在节拍器基础上加入键盘/鼠标点击跟随，实时给出命中判定、连击与匹配度，类似音游体验。

参考站点：https://metronome-online.com/zh

## 当前状态

**设计与方案阶段，暂未编码。**

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
