<p align="center">
  <img src="public/logo-mark.svg" width="72" alt="Hypit AI" />
</p>

<h1 align="center">Hypit Team</h1>

<p align="center">
  Hypit AI 的团队体验站：介绍 Narratage、我们的工作现场，以及把视频写成语言的人。
</p>

## 项目简介

这是 Hypit AI 的交互式团队官网。页面围绕 Narratage 的核心命题展开：人剪辑视频，Agent 编译视频。

网站使用一个贯穿全页的 Three.js 世界承接首屏、编译流程、团队和工作日常，并通过 GSAP 与 Lenis 将滚动位置、指针反馈和 3D 场景同步。中英文内容会根据浏览器语言和站内语言切换展示。

主要页面：

- `/`：Hypit AI 团队叙事、工作现场与成员介绍
- `/team`：团队索引
- `/manifesto`：Narratage 宣言

## 技术栈

- Next.js 16、React 19、TypeScript
- Three.js、React Three Fiber、Drei
- GSAP、Lenis、Motion
- Tailwind CSS 4
- Bun

## 本地开发

需要 [Bun](https://bun.sh/) 1.3 或更高版本。

```bash
bun install
bun run dev
```

打开 [http://localhost:3000](http://localhost:3000)。

## 常用命令

```bash
bun run dev       # 启动开发服务器
bun run lint      # ESLint 检查
bun x tsc --noEmit
bun run build     # 生产构建
bun run start     # 启动生产服务器
```

## 内容与素材

团队文案集中在 `lib/data/`，体验页内容位于 `lib/data/experience.ts`。团队照片从 Hypit AI 的 CDN 加载，允许域名配置在 `next.config.ts`。

> [!NOTE]
> Three.js 场景是装饰层；语义标题、说明文字和成员信息始终保留在 DOM 中，并提供 reduced-motion 降级。

## 项目结构

```text
app/                    Next.js 路由、元数据与全局样式
components/experience/  团队体验页与 Three.js 世界
components/sections/    Narratage 内容章节
components/ui/          通用界面组件
hooks/                  语言、滚动与媒体查询 hooks
lib/data/               双语内容与团队资料
lib/experience/         3D 场景共享状态
public/                 品牌与展示素材
```
