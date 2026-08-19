# 发布文档资产包

> 来源：https://pcnykb145ef0.feishu.cn/wiki/JiGkwCudQipWuDk4jCrcpLe2n1l

> 抓取方式：Chrome DevTools MCP，直接读取已登录飞书页面；按稳定文档块 ID 合并虚拟滚动内容。

> 记录日期：2026-08-18



## 1. Core Narrative 核心叙事

github链接：https://github.com/hypit-ai/narratage

discord链接：https://discord.gg/z6UefHvj7f

官网链接：https://narratage.hypit.ai/

Telegram链接：

### One-liner（一句话介绍）

World's #1 video programming language and system for AI agents. Built to kill Adobe.

[别的时候:Born to kill Adobe]

### Elevator Pitch（30秒介绍）

中文：

Adobe、剪映、DaVinci、Final Cut，全是给人的手和眼睛造的。
Narratage 是给 Agent 设计的语言和系统。

一切不再钉在时间轴的秒上,而是挂在叙事的文字上。因为是 Agent 原生,每个组件的参数都由 Agent 自己调:字幕、B-roll、特效,全部写在 SVML 里。改一个词,只重新生成一句;一套 workflow,批量出无限不同样式的视频。


人剪视频，Agent 编译视频。


英文:

Adobe, CapCut, DaVinci, Final Cut: all built for human hands and eyes.
Narratage is a language and system designed for agents.

Nothing is pinned to seconds on a timeline; everything is anchored to words in the narrative. And because it's agent-native, every component's parameters are the agent's to tune: captions, B-roll, effects, all written in SVML. Change a word, one line regenerates. One workflow, ∞ videos.

Humans edit video. Agents compile it.

### Why we built this（为什么做）

中文：

对于大部分创作者和商家来说，制作视频内容只有一条路：吸收别人的创意（creative），然后想办法结合自己的内容和产品，最终转化为自己的内容。但关键的问题是如何复刻。一两年前，随着VLM模型发展，上传视频后解析脚本给制作指导的产品有很多。但对于复刻创意来说，这一步几乎没什么用，可能连百分之一的工作都没有搞定。

我们在帮AI startup制作内容的时候，也是一样会参考其他企业制作的内容，借鉴他们的创意。比如我们参考了perplexity的meta ads，借鉴了the rundown的UGC广告内容。

> [嵌入资产组] 广告资料库 (1) 00:50 广告资料库 00:41

**嵌入附件/视频：** 广告资料库 (1) 00:50

**嵌入附件/视频：** 广告资料库 00:41

制作这样一条视频，作为剪辑团队，需要AIGC生成许多素材，然后剪辑，配上各种字幕，特效，且完全卡点。很多剪辑一天也就做个2-3条，哪怕不思考不动脑，就照搬这个创意然后更改内容。

这种事情未来一定都是Agent来完成。但想让Agent制作这种内容，且能够工作流式的产出（同类型但不同质化），就必须组件式的去完成制作。

视频模型自己搞不定这件事。今天的模型是一个网络一口气画出整段画面，训练时见到的描述只有“一个女人在厨房做饭”这种粗粒度文本。它脑子里没有“字幕““B-roll““卡点”这些对象，你也就没法单独指挥其中任何一个。这是生成范式决定的，堆参数解决不了：模型再大，画面更好看，但还是没有精确性。

要让 Agent 真正做出这种内容，只能在模型外面下功夫：需要一套全新的系统，把制作视频的每一个元动作变成组件；还需要一门全新的语言，所有组件都用它来写，由系统编译执行，拼成最后的成片。

DeepSeek 刚开源的 Harness，干的就是同一件事。模型本身不干活，他们就在模型外面搭了一层 Harness：工具、沙箱、调度，连 Agent 的运行循环本身，全部做成可替换的插件组织起来，模型这才成了 Agent。

视频缺的正是这一层。他们把 Agent 的一切做成插件，我们把视频制作的一切做成组件写在 SVML 里，和 DSH 的插件一样可替换，再由系统组织组件，编译成片。Narratage 就是视频的 Harness。

这就是我们做这套系统和这门语言的原因。

英文：

For most creators and brands, there is only one way to make video content: take someone else's creative, work out how to combine it with your own product, and turn it into something of your own. The hard part is reproducing it. A year or two ago, as VLMs improved, plenty of products appeared that could take an uploaded video and hand back a script breakdown with production notes. For actually reproducing a creative, that step is close to useless. It covers maybe one percent of the work, if that.

We worked the same way when we made content for AI startups: study what other companies ship, borrow the creative. We referenced Perplexity's Meta ads and borrowed from The Rundown's UGC ads.

> [嵌入资产组] 广告资料库 (1) 00:50 广告资料库 00:41

To produce one of these videos, an editing team has to generate a pile of AI assets, cut them together, layer on captions and effects, and land every single beat. Most editors top out at two or three videos a day, even with their brains switched off, doing nothing but copying a proven creative and swapping in new content.

Agents will end up doing all of this. But for an agent to make this kind of content, and to produce it workflow-style (the same format, but no two alike), production has to be broken into components.

Video models can't pull this off on their own. Today's model is one network painting the whole clip in a single pass, trained on captions as coarse as "a woman cooking in a kitchen." There is no "caption," "B-roll," or "beat" anywhere in its head, so you can't give orders to any of them separately. That's set by the generation paradigm, and stacking parameters won't change it: a bigger model paints prettier frames, but the precision still isn't there.

For an agent to actually make this content, the work has to happen outside the model. You need a new system that turns every atomic step of video production into a component, and a new language that all the components are written in, compiled and run by the system, and assembled into the finished film.

DeepSeek's freshly open-sourced Harness does the same thing. A model on its own gets no work done, so they built a Harness around it: tools, sandboxing, scheduling, even the agent's run loop itself, all organized as swappable plugins. Only then does the model become an agent.

Video is missing exactly this layer. They turned everything about the agent into plugins; we turn everything about video-making into components, written in SVML, swappable just like dsh's plugins, and the system organizes those components and compiles them into film. Narratage is the Harness for video.

That's why we built this system and this language.

### What We Are NOT （我们不是什么）

中文：

1. 不是模型。我们的系统允许用户自行接入图片和视频模型，BYOK (Bring Your Own Key)

2. 不是剪辑工具，不是chatcut，不是palmier。举例说明的话，我们目标客群的最大公约数，就是用heygen的人群。当然我们的目标客群会更大一些。但核心是，我们的目标客群一定是用AI驱动生成视频的人，视频里面的素材A roll主内容希望用AI生成的人。比如制作AI口播、AI UGC、AI采访、AI播客...这些人群是我们的目标。一个人录完视频拿我们的框架来剪辑，当然没问题，但不是我们最锚定的目标群体。

3. 不是商业化的产品。我们可以和arcads、topview、creatify、makeUGC、invideo、higgsfield对比，因为我们是唯一一个开源的。尤其是对比arcads。但我们一定强调我们是开源的。且我们能做出来的内容比他们好得多。

4. 不是纯粹模版驱动的“一键生成xx视频”的产品。我们会放模版，也会让用户自己做自己的组件，用户输入视频也可以给到初始的组件模块。但用户可以自行修改组件，也可以自行搭建属于自己的组件。

英文：

1. Not a model. The system lets you plug in your own image and video models. BYOK: Bring Your Own Key.

2. Not an editing tool. Not ChatCut, not Palmier. To put a face on it: the greatest common denominator of our target users is people who use HeyGen, though our audience runs wider than that. The defining trait is that they want the video itself generated by AI; the A-roll, the main content, comes from a model: AI talking heads, AI UGC, AI interviews, AI podcasts. If you filmed yourself and want to cut the footage with our framework, that works too. It's just not the group we anchor on.

3. Not a commercial product. The comparison set is Arcads, TopView, Creatify, MakeUGC, InVideo, Higgsfield. Especially Arcads. We're the only open-source one in that group, and open source is the point to land every time the comparison comes up.

4. Not a template-driven "one-click video" product. We ship templates, but you're never locked into them. You can modify every component, build your own from scratch, and feed in a video of your own to seed the initial component modules.

### Origin Story（命名典故）

名字来自 1933 年《纽约时报》影评人为电影 The Power and the Glory 造的词：

Narration + Montage——旁白推动故事，画面自动装配蒙太奇。

93 年后我们把它做成了一门语言：内容进来，不管人写的还是 Agent 写的，编译器装配出成片。

选这个名字，不只是因为典故。Narratage 这个词描述的手法，就是这套系统的架构：语义驱动，内容说什么，画面就装配什么。字幕、B-roll、特效，全部挂在内容的词上。AI口播、AI数字人、AI UGC、AI 播客，这类视频的骨架就是说出来的那段内容，天生适合这样编译。

1933 年它是一种叙事手法，今天它是我们的编译方式。Narratage。

The name comes from a word coined by a New York Times critic in a 1933 review of The Power and the Glory:

Narration + Montage. Narration drives the story; the picture assembles itself into montage.

93 years later, we turned it into a language:
- content comes in, written by a human or an agent, and the compiler assembles the film.

We didn't pick the name for the history alone. The technique this word describes is this system's architecture: semantically driven, so what the content says is what the picture assembles. Captions, B-roll, effects, all anchored to the words of the content. AI talking heads, AI avatars, AI UGC, AI podcasts: the skeleton of these videos is the spoken content itself, born to be compiled this way.

In 1933 it was a storytelling technique. Today it's how we compile video. Narratage.

## 2. Product & Technology 产品和技术介绍

### What is Narratage（Narratage 是什么）

Narratage 是一门语言和一套编译系统，让人和 Agent 能够描述、编译和生产完整视频。

视频模型能生成镜头，但生成不等于制作。一支完整的视频需要脚本、多段画面、配音、字幕、B-roll、特效卡点和最终渲染。这些环节之间存在结构关系，而模型对此一无所知。传统工具用时间线和轨道组织这些关系，但时间线是为人的手和眼睛设计的：Agent 无法拖动滑块、无法目视对齐、无法在画布上反复微调。

Narratage 用一门结构化语言 SVML（Semantic Video Markup Language）取代时间线。创作者或 Agent 用文字描述角色、台词、段落和视觉意图，编译系统将其转化为完整成片。视频不再钉在秒上，而是挂在叙事的文字上。

SVML 保存的不是某一版视频的编辑状态，而是视频的生产方法：内容结构、角色关系、视觉规则和制作要求。MP4 是源码执行后的产物，源码本身可以继续修改、复用和版本管理。

> [嵌入资产组] 安装依赖 00:43

Video models generate shots, but generation is not production. A complete video requires a script, multiple segments of footage, voiceover, captions, B-roll, precisely timed effects, and final rendering — all structurally related in ways no model understands. Traditional tools organize these relationships on timelines and tracks, but timelines are built for human hands and eyes: an Agent cannot drag a slider, visually align elements, or iteratively fine-tune a canvas.

Narratage replaces the timeline with a structured language, SVML (Semantic Video Markup Language). Creators or Agents describe characters, dialogue, segments, and visual intent in text; the compilation system turns it into a finished film. Nothing is pinned to seconds — everything is anchored to words in the narrative.

SVML preserves not the editing state of a particular cut, but the production method of the video — content structure, character relationships, visual rules, and production requirements. The MP4 is the result of executing source code; the source code itself can be modified, reused, and version-controlled.

### The Language（语言与 Script 语法）

SVML 是一门完整的视频描述语言。一个 .svml 文件包含组件导入、空间布局、视频生成、语音合成、字幕系统、画面合成、渲染管线等完整的视频生产图，远不止一段稿子。其中，<script> 元素由 @narratage/script 包提供，是叙事内容的入口。Script 包含四条语法：Segment、Speaker、Split 和 Hook。它们不是语言设计理论的产物，每一条都来自真实的视频生产痛点。

SVML is a complete video description language. A single .svml file contains component imports, spatial layout, video generation, speech synthesis, caption systems, compositing, rendering pipelines, and more — far more than a script. Within it, the <script> element is provided by the @narratage/script package and serves as the entry point for narrative content. Script includes four syntactic constructs: Segment, Speaker, Split, and Hook. None of them come from language design theory; each one was born from a real video production pain point.

#### Segment（段落）

视频模型存在生成时长上限：曾经是 15 秒，如今延长到 30 秒，但这个限制依然不可忽视。更关键的是，一旦某一段不满意需要重新生成，越长的片段代价越高。Segment 将一支视频按语义和场景拆分为多个独立段落，每个段落可以单独生成、检查、确认和重试。

```svml

代码块
HTMLBars
自动换行
复制
<script id="story">
  <intro>
    Meet Narratage — the first language designed for agents to compile video.
  </intro>
  <demo>
    Write your story, describe your intent, and the compiler assembles the film.
  </demo>
  <cta>
    No timeline. No drag-and-drop. Just words in, video out.
  </cta>
</script>
```

三个 Segment（intro、demo、cta）各自独立生成、独立重试。intro 满意了就锁定，demo 不满意只重做 demo。同时，系统为每个 Segment 单独测量时长，确保语速均匀。

Video models have a generation duration cap — once 15 seconds, now extended to 30, but the constraint is still non-trivial. More critically, if a clip is unsatisfactory and needs re-generation, the longer the clip, the higher the cost. Segment splits a video by semantics and scene into independent paragraphs; each can be generated, inspected, approved, and retried individually.

Segment works closely with duration estimation (estimate) to control pacing per paragraph. Competitors fill content into fixed durations — 10 or 15 seconds — regardless of word count, producing clips that race or crawl: completely inhuman rhythm. The Segment-plus-estimate combination ensures each paragraph's word count matches its duration, keeping pacing natural.

Three Segments — intro, demo, cta — each generated and retriable independently. Lock intro when it's good; redo only demo if it's not. The system estimates duration per Segment, ensuring even pacing across the video.

#### Speaker（说话人）

多人视频是信息流内容中最具娱乐性的品类（街头采访、播客、短剧）也是最不像 AI slop 的视频类型。要制作这类内容，视频生成模型必须准确理解每句话由谁说出，才能使用正确的人物形象和音色。Speaker 在稿子中标注说话人身份。这不是编译器层面的抽象，而是直接面向视频生成模型的语义指示：让模型理解对话归属，生成对应的人物和声音。

```svml

代码块
HTMLBars
自动换行
复制
<hook>
  <HOST>What tool do you use to make videos?
  <GUEST>I write what I want to say, and the system
    compiles it into a finished video.
</hook>
<reveal>
  <HOST>Wait — you don't touch a timeline?
  <GUEST>No timeline. Narratage reads my script
    and handles everything else.
  <HOST>So you just... write?
  <GUEST>I just write.
</reveal>
```

HOST 和 GUEST 各自标注说话人身份。视频生成模型据此为每句话匹配正确的人物和音色，字幕系统也自动区分不同角色的样式。

Multi-person videos are the most entertaining category in information-feed content — street interviews, podcasts, short dramas — and the type that least resembles AI slop. To produce them, the video generation model must know exactly who speaks each line so it can use the correct character and voice. Speaker annotates the speaker's identity in the script. This is not a compiler-level abstraction but a direct semantic instruction to the video generation model: understanding dialogue ownership to generate the right character and voice.

HOST and GUEST each annotate the speaker's identity. The video generation model uses this to match the right character and voice to each line, and the caption system automatically differentiates styles per character.

#### Split（显示与朗读分流）

字幕显示的文字和模型需要朗读的文字经常不一致。自创产品名模型不认识，每次读音不同，需要用音标指示；但字幕必须显示原始拼写。数字 9:30 需要读作 nine thirty 才能准确测量时长，但字幕应显示数字形式。Split 从这一根本矛盾出发，将显示文本和朗读文本分流。一旦这个机制建立，还顺带解决了一系列有趣的表达需求。一切都源于字幕的必须存在性和显示与朗读的天然分歧。

```svml

代码块
HTMLBars
自动换行
复制
<intro>
  This is <SVML | semantic video markup language>,
    the open-source video compiler.
  It costs <$0 | zero dollars> to get started.
  Try <Narratage | nah-ruh-tahj> — we just
    hit <10K | ten thousand> GitHub stars.
  And honestly? <this is wild | holy shit>.
</intro>
```

竖线左侧是字幕显示的内容，右侧是模型实际朗读的内容。SVML 显示为四个字母，但读作完整的全称；$0 显示数字，但读 zero dollars 以便测量时长；Narratage 附带发音指引防止模型念错；最后一行展示了同一机制的另一种用途——屏幕上保持克制，实际朗读更口语化。

Captions and speech frequently diverge. A coined product name is unfamiliar to the model — it pronounces it differently each time — so phonetic guidance is needed, but captions must display the original spelling. The number 9:30 must be read as nine thirty for accurate duration estimation, but captions should show the numeric form. Split addresses this fundamental tension by routing display text and spoken text separately. Once this mechanism is in place, it also resolves a range of interesting expression needs. Everything stems from the inevitable presence of captions and the natural divergence between display and speech.

The left side of the pipe is what captions display; the right side is what the model actually speaks. SVML shows as four letters but is read as the full name; $0 shows the numeral but reads zero dollars for accurate duration estimation; Narratage carries pronunciation guidance to prevent mispronunciation; the last line shows another use — keeping the caption restrained while the spoken version is more colloquial.

#### Hook（叙事锚点）

Hook 是 Narratage 的起源，也是项目命名的由来。

所有信息流视频的剪辑都存在一个本质的绕远路：创作者在写稿时就知道某个特效应该在说到某个词的时候出现，但因为生成之前不知道这个词会出现在第几秒，只能在视频生成后用剪辑软件逐帧定位、手动添加。这是一个巨大的、被当做理所当然的后置工序。Hook 将视觉效果直接锚定在稿子的词上，而非时间轴的秒上。剪辑依然存在，但其中一个巨大的需求分类被用正确的方式解决了。

Hook 有两种形态：Selection（区间）标注一段持续的时间范围，用 @name 开启、@/name 关闭；Moment（瞬时）标注一个精确的时间点，用 @name! 触发一次性事件。

```svml

代码块
HTMLBars
自动换行
复制
<hook>
  <HOST>@leaderboard Here are the top tools.
    @board @flash Number one @/flash —
    that is Narratage. @/board
</hook>
<demo>
  <HOST>We @glow take your script, the compiler
    plans @/leaderboard your build, and it
    <assembles | compiles ~@spark!> the entire
    video. @/glow
  <HOST>@done That is @/done~ Narratage.
</demo>
```

这个例子展示了 Hook 的全部语法特性：

1. 嵌套

@board 完全嵌套在 @leaderboard 内部，@flash 又嵌套在 @board 内部。排行榜显示的同时，局部条目高亮，条目内部的文字还能触发闪屏：三层 Selection 各自驱动不同的视觉组件，互不干涉。

2. 交叉闭合

@leaderboard 先开启，@glow 后开启，但 @leaderboard 先关闭、@glow 后关闭（开1开2闭1闭2）。这不是嵌套，而是两个视觉效果的时间范围自然交叉。传统 XML 不允许这种结构，但 Hook 天然支持，因为视觉效果的生命周期本来就不总是层级关系。

3. 伸入 Split

<assembles | compiles ~@spark!> 中，@spark! 写在 Split 的朗读侧。字幕显示 assembles，模型朗读 compiles，而 Moment 锚定在朗读侧的真实语音时间点上。Hook 和 Split 可以自由组合。

4. 吸附控制

默认情况下，@name 吸附到右侧下一个词的起点，@/name 吸附到左侧上一个词的终点，选区恰好覆盖标记之间的词。加上波浪号 ~ 可以反转吸附方向：~@spark! 让 Moment 吸附到左侧词的终点（在 compiles 说完的瞬间触发），@/done~ 让 Selection 的终点吸附到 Narratage 这个词的起点而非上一个词的终点。

5. Segment 锚点（2M+2N）

Hook 的吸附点不仅限于词（token）的边界。每个 Segment 的起点和终点本身也是吸附锚点。M 个 Segment 产生 2M 个锚点（每段头尾各一），N 个词产生 2N 个锚点（每词头尾各一），总计 2M + 2N 个语义锚点。当一个 Hook 需要对齐到 Segment 的最前沿时，它吸附到 Segment 起始锚点，而非第一个词的起始锚点，两者之间可能存在极短的时间差（第一个词不一定紧贴片段起点）。Segment 锚点消除了这种切片边缘的时间错位，使视觉效果精确对齐到片段的物理边界。

Hook is the origin of Narratage and the reason behind the project's name.

Every piece of information-feed video editing involves a fundamentally roundabout process: the creator knows while writing the script that a certain effect should appear when a specific word is spoken, but because the exact timestamp is unknown before generation, they are forced to locate it frame-by-frame in editing software after the fact. This is an enormous post-processing step taken for granted. Hook anchors visual effects directly to words in the script, not seconds on a timeline. Editing still exists, but one of its largest demand categories is solved correctly.

Hook has two forms: a Selection marks a continuous time range, opened with @name and closed with @/name; a Moment marks a single time point, fired with @name! as a one-shot event.

1. Nesting

@board is fully nested inside @leaderboard, and @flash is nested inside @board. While the leaderboard is showing, a row highlights, and within that row the text triggers a flash: three layers of Selection, each driving a different visual component, independently.

2. Interleaving

@leaderboard opens first, @glow opens second, but @leaderboard closes before @glow (open-1, open-2, close-1, close-2). This is not nesting — it is two visual effects whose time ranges naturally cross. Traditional XML forbids this structure, but Hook supports it natively, because visual effect lifetimes are not always hierarchical.

3. Inside Split

In <assembles | compiles ~@spark!>, the @spark! Moment is written on the speech side of the Split. Captions display assembles, the model speaks compiles, and the Moment anchors to the real speech timing. Hook and Split compose freely.

4. Affinity Control

By default, @name attaches to the start of the next word (right affinity) and @/name attaches to the end of the previous word (left affinity); the selection covers exactly the words between the markers. Adding a tilde ~ reverses the attachment direction: ~@spark! makes the Moment attach to the end of the preceding word (firing the instant compiles finishes speaking); @/done~ makes the Selection's close attach to the start of the next word (Narratage) rather than the end of the previous word.

5. Segment Anchors (2M+2N)

Hook anchors are not limited to word (token) boundaries. Each Segment's start and end are also anchor points. M Segments produce 2M anchors (one at each boundary); N tokens produce 2N anchors (start and end of each word) — 2M + 2N semantic anchors in total. When a Hook needs to align with the very beginning of a Segment, it attaches to the Segment's start anchor rather than the first token's start — there can be a tiny time gap between the two (the first word doesn't necessarily start at the exact clip boundary). Segment anchors eliminate this timing misalignment at clip edges, ensuring visual effects align precisely with the physical segment boundary.

### The System（系统：作者图与运行图的分离）

Narratage 的核心系统设计是将“视频是什么”和“这次要构建什么”彻底解耦。

Narratage's core system design completely decouples "what the video is" from "what to build this time."

#### SVML — 作者图 / Author Graph

SVML 文件（.svml）描述视频本身的完整意图。<svml> 根元素下通过 <import> 导入组件包，通过 <script> 编写叙事内容，通过各组件元素声明视频生成、语音合成、字幕、画面合成、渲染等全部环节的依赖关系。这是一张纯粹的作者意图图（author graph）。

作者在 .svml 中可以指定使用哪个模型（例如 model="mini" 指定 Seedance 2 Mini，model="gemini-2.5-flash" 指定 Gemini），但不指定使用哪个提供商（Provider）。同一个模型可能由 KIE、Google Vertex、本地推理等不同的提供商运行；具体由谁来跑，是运行时根据已配置的 Endpoint 实例自动匹配的，不是作者关心的事。.svml 不包含任何运行时信息：不指定提供商、不记录历史结果、不决定这次运行哪些部分。

```svml

代码块
HTMLBars
自动换行
复制
```

model="mini" 指定了使用 Seedance 2 Mini 模型，但谁来跑这个模型——KIE 云端、Google Vertex、还是本地 GPU——完全不在 .svml 的管辖范围内。

An SVML file (.svml) describes the complete intent of a video. Under the <svml> root, <import> brings in component packages, <script> holds narrative content, and component elements declare every dependency in the pipeline — video generation, speech synthesis, captions, compositing, and rendering. This forms a pure author graph.

Authors can specify which model to use in .svml (e.g., model="mini" for Seedance 2 Mini, model="gemini-2.5-flash" for Gemini), but never which provider. The same model may be served by KIE, Google Vertex, local inference, or other providers — who actually runs it is resolved by the runtime based on configured Endpoint instances, not by the author. An .svml contains no runtime information: no provider, no historical results, no decisions about what to run this time.

model="mini" specifies Seedance 2 Mini as the model, but who runs it — KIE cloud, Google Vertex, or a local GPU — is entirely outside .svml's jurisdiction.

#### SVRUN — 运行图 / Run Graph

运行配置文件（.svrun）描述这次构建的范围和策略。<svrun> 根元素内，<author> 指向一份 .svml 文件，<target> 声明本次构建的目标输出。.svml 定义了完整的依赖图，.svrun 从中选取一个切面来执行。

除了 target，.svrun 还提供一组候选声明标签：<build-record> 复用历史构建结果，<satisfy> 将候选显式绑定到某个输出，<value> 和 <file> 直接注入值或文件作为候选。同一份 .svml 配合不同的 .svrun，可以产生完全不同的运行行为：只生成参考图片看一眼效果、只跑时长预估检查节奏、用占位素材跑通全流程、或者执行完整的视频生产。传统画布编辑器是作者语义和运行语义混淆的典型：用户在画布上编辑时是在表达作者意图，但又被迫承担运行语义。Narratage 将两者彻底分离到两个文件。

```svml

代码块
HTMLBars
自动换行
复制
<svrun version="1">
  <author source="./main.svml"/>
  <target output="final.video"/>
</svrun>

<svrun version="1">
  <author source="./main.svml"/>
  <target output="final.video"/>

  <build-record id="reused-intro"
    build="b-20240801" output="intro-take.video"/>
  <satisfy output="intro-take.video"
    candidate="reused-intro"/>
</svrun>
```

第一份 .svrun 选择了 final.video 作为 target；第二份同样选择 final.video，但通过 <build-record> 复用了上一次构建的 intro 片段，运行时跳过 intro 的生成，只执行其余部分。两份 .svrun 指向同一份 .svml，但执行路径完全不同。

A run configuration file (.svrun) describes the scope and strategy of this build. Inside the <svrun> root, <author> points to an .svml file and <target> declares the output to build. The .svml defines the full dependency graph; the .svrun selects a cross-section to execute.

Beyond targets, .svrun provides a set of candidate declaration tags: <build-record> reuses historical build results, <satisfy> explicitly binds a candidate to an output, and <value> and <file> inject values or files directly as candidates. The same .svml paired with different .svrun files produces entirely different runtime behavior: generate only reference images for a quick look, run only duration estimation to check pacing, execute the full pipeline with placeholder assets, or run complete video production. Traditional canvas editors are the canonical example of conflating authoring semantics with runtime semantics. Narratage separates the two completely into two files.

The first .svrun selects final.video as the target; the second also selects final.video but reuses the intro segment from a prior build via <build-record>, causing the runtime to skip intro generation and execute only the remainder. Both .svrun files point to the same .svml, but their execution paths are entirely different.

#### "DUCK" - 候选协议 / Candidate Protocol

2000 年，Alex Martelli 在 Python 社区的 comp.lang.python 邮件列表中阐述了一种类型判定原则："If it walks like a duck and it quacks like a duck, then it must be a duck"；判断一个对象是否可用，依据不是它的声明类型，而是它实际展现的结构与行为。这一思想后来被称为 duck typing（鸭子类型）。

Narratage 的候选协议沿用了同样的原则。系统中的每个计算节点在运行时会产生需求（Need），声明自己需要什么能力（Capability）和什么类型（Type）的输出。任何产物（真实生成的结果、占位输出、历史复用的产物、降级输出）只要结构上匹配该 Need 的协议，就可以作为候选（Candidate）填充它，推动后续流程继续。核心不关心候选从哪来，只验证协议是否满足。没有特殊的“固定历史结果”语义，历史产物由外部维护，核心只看结构。

In 2000, Alex Martelli articulated a typing principle on Python's comp.lang.python mailing list: "If it walks like a duck and it quacks like a duck, then it must be a duck" — an object's suitability is determined not by its declared type but by the structure and behavior it actually exhibits. This idea came to be known as duck typing.

Narratage's candidate protocol follows the same principle. Each computation node in the system produces a Need at runtime, declaring what Capability and what Type of output it requires. Any artifact — a real generation result, a placeholder output, a reused historical artifact, a degraded output — can serve as a Candidate to fill that Need, as long as it structurally matches the Need's protocol. The Core does not care where a candidate comes from; it only verifies protocol satisfaction. There is no special "pinned historical result" semantic; historical artifacts are maintained externally, and the Core only checks structure.

#### Target — 局部执行 / Partial Execution

本质上，每一次 .svrun 都是 .svml 的一次局部执行。.svml 定义了一张完整的作者意图图，而 .svrun 通过 <target> 从中选取要构建的子图。即使 target 指向最终的渲染输出（如 final.video），这仍然是一次选取，只不过恰好选中了依赖链的终点，于是回溯触发了全部上游节点。你也可以设定更早的 target（如只跑语音对齐、只生成参考图片），运行时只会执行该 target 所需的最小子图。已满足的上游节点不会重复计算。

Fundamentally, every .svrun is a partial execution of the .svml. The .svml defines a complete author-intent graph, and the .svrun uses <target> to select which subgraph to build. Even when the target points to the final rendered output (e.g., final.video), this is still a selection — it just happens to select the terminus of the dependency chain, so the runtime traces back and triggers all upstream nodes. You can also set an earlier target (e.g., speech alignment only, reference images only), and the runtime will execute only the minimal subgraph required. Upstream nodes already satisfied are never re-executed.

### Architecture（架构）

#### 一切皆插件 / Everything is Plugin

Narratage 的架构遵循“一切皆插件”原则。视频组件是插件：语音合成、字幕系统、视频生成、图片生成、音频对齐、画面合成、渲染引擎；每一种能力都是独立的包，可以替换、可以升级、可以由社区贡献。SVML 语法本身也是插件：语言的解析和编译规则作为包发布，语法扩展不需要修改核心。运行时适配器是插件：存储后端、凭据管理、模型提供商都通过 RuntimeAdapterRegistry 以包的形式注册。

核心（Core）保持领域无关：它不认识视频，只负责计划编译和 Build 状态机。安装一个包即可增加能力，无需重新发布 Core。这个设计源于前代系统的真实教训：每次更新能力都需要完整 CI 重建，一个月的 CI 时长被直接挤爆。

Narratage's architecture follows the "everything is plugin" principle. Video components are plugins: speech synthesis, caption systems, video generation, image generation, audio alignment, compositing, and rendering — each is an independent package that can be replaced, upgraded, or contributed by the community. The SVML syntax itself is a plugin: parsing and compilation rules ship as packages, so syntax extensions never require modifying the Core. Runtime adapters are plugins: storage backends, credential managers, and model providers all register through the RuntimeAdapterRegistry as packages.

The Core remains domain-agnostic: it knows nothing about video — it only compiles plans and drives the Build state machine. Installing a package adds capability without requiring a Core release. This design was born from a real lesson in a predecessor system — every capability update required a full CI rebuild, and a month's CI budget was blown in days.

#### 七层包架构 / Seven-Layer Package Architecture

整个系统由七个层次的包组成，每层有明确的职责边界。上层依赖下层，下层对上层无感知。

The entire system is composed of seven layers of packages, each with a clear responsibility boundary. Upper layers depend on lower layers; lower layers are unaware of upper layers.

Layer 1 — Narratage Core（核心）

计划编译与 Build 状态机。Core 将 BuildRequest 编译为 BuildPlan，状态机（BuildMachine）通过 evaluate → commit 的事务式推进接收每条命令结果（CommandResult），生成新的 BuildFact，从而驱动整个构建流程。Core 不认识视频，不调用任何模型。包：core、protocol。

Plan compilation and the Build state machine. Core compiles a BuildRequest into a BuildPlan; the BuildMachine advances transactionally through evaluate → commit, receiving each CommandResult, producing a new BuildFact, and driving the build forward. Core knows nothing about video and calls no models. Packages: core, protocol.

Layer 2 — Compiler（编译器）

Source 解析、包导入与图展开。Host 加载 .svml 和 .svs 文件，markup 解析 SVML 语法，elaborator 将声明式的组件引用展开为完整的依赖图（CompiledGraph），交给 Core 编译。包：host、markup、svs、elaborator、source、run-markup、run。

Source parsing, package imports, and graph elaboration. Host loads .svml and .svs files, markup parses SVML syntax, and the elaborator expands declarative component references into a complete dependency graph (CompiledGraph) for Core to compile. Packages: host, markup, svs, elaborator, source, run-markup, run.

Layer 3 — Foundations（基础能力）

可复用的媒体处理、时间计算、空间布局、排版和传输基础能力。这些包被多个上层视频组件共享，但本身不包含任何视频领域逻辑。包：media-pipeline、media、temporal、spatial、text、composition、raster、transport。

Reusable building blocks for media processing, time computation, spatial layout, typography, and transport. These packages are shared by multiple upper-layer video components but contain no video domain logic themselves. Packages: media-pipeline, media, temporal, spatial, text, composition, raster, transport.

Layer 4 — Video Authoring（视频创作）

Script 语法解析、视频生成（Seedance、GPT Image、Grok Imagine 等）、语音合成与对齐（Speech Spine、WhisperX、MiMo TTS）、字幕渲染（Caption）、画面合成（Film）和渲染（HyperFrames）。每个组件通过 component-kit 注册 Producer 和 TypeValidator，对 Core 声明自己能做什么。包：script、seedance、generation、speech-spine、whisperx、caption、film、render-hyperframes 等。

Script syntax parsing, video generation (Seedance, GPT Image, Grok Imagine, etc.), speech synthesis and alignment (Speech Spine, WhisperX, MiMo TTS), caption rendering, compositing (Film), and rendering (HyperFrames). Each component registers its Producers and TypeValidators through component-kit, declaring its capabilities to Core. Packages: script, seedance, generation, speech-spine, whisperx, caption, film, render-hyperframes, etc.

Layer 5 — Providers（提供商适配器）

外部模型、API 和本地程序的适配器。每个 Provider 通过 endpoint-kit 注册 EndpointPackage，声明自己能满足哪些 Capability。KIE 一个 Provider 即可映射 Seedance、MiniMax、Gemini、Grok、GPT Image 等多个模型的能力。本地 Provider（WhisperX、FFmpeg、HyperFrames）通过 Managed Program 机制自动管理进程生命周期。包：provider-kie、provider-google-vertex、provider-whisperx-local、provider-media-local、provider-hyperframes-local 等。

Adapters for external models, APIs, and local programs. Each Provider registers an EndpointPackage through endpoint-kit, declaring which Capabilities it can fulfill. A single KIE Provider maps the capabilities of Seedance, MiniMax, Gemini, Grok, GPT Image, and more. Local Providers (WhisperX, FFmpeg, HyperFrames) manage process lifecycles automatically through the Managed Program mechanism. Packages: provider-kie, provider-google-vertex, provider-whisperx-local, provider-media-local, provider-hyperframes-local, etc.

Layer 6 — Runtime（运行时）

调度、队列、存储、凭据与执行。LocalBuildScheduler 管理 Build 的并发调度和容量分配（CapacityReservation），BuildDispatchStore 维护持久化的分发队列，Worker 进程在后台持续消费队列中的 Build。ArtifactStore 以内容寻址方式管理所有构建产物（支持本地文件系统和 S3），CredentialStore 管理提供商凭据（支持环境变量和系统 Keychain）。包：runtime、store-sqlite、runtime-local、runtime-kit、artifact-store-fs、artifact-store-s3、credential-store-env、credential-store-keychain。

Scheduling, queuing, storage, credentials, and execution. The LocalBuildScheduler manages concurrent Build scheduling and capacity allocation (CapacityReservation), the BuildDispatchStore maintains a durable dispatch queue, and a Worker process continuously consumes Builds from the queue in the background. The ArtifactStore manages all build artifacts via content addressing (supporting local filesystem and S3), and the CredentialStore manages provider credentials (supporting environment variables and system Keychain). Packages: runtime, store-sqlite, runtime-local, runtime-kit, artifact-store-fs, artifact-store-s3, credential-store-env, credential-store-keychain.

Layer 7 — Applications（应用层）

用户直接使用的界面。CLI 提供完整的创作和运维工作流：check 验证源码、plan 冻结执行计划、build 提交持久构建、status 观察进度、get 提取产物、doctor 诊断环境、queue 查看分发队列。包：cli、svml-playground。

User-facing interfaces. The CLI provides a complete authoring and operations workflow: check validates sources, plan freezes an execution plan, build submits a durable build, status observes progress, get extracts artifacts, doctor diagnoses the environment, and queue inspects the dispatch queue. Packages: cli, svml-playground.

#### 持久化构建 / Durable Build

AI 生成缓慢、昂贵且不确定。Narratage 不是立即执行，而是把所需工作编译为一份持久化计划。整个构建生命周期分为四步：

1. Plan（计划）— narratage plan 冻结一份完整的执行计划。每一次模型调用、每一笔费用都可以在执行前审查。确认了才真正花钱。

2. Build（构建）— narratage build 提交持久化 Build。CLI 立即返回一个 Build ID，构建在后台 Worker 进程中执行。即使终端关闭，构建继续。

3. Dispatch（分发）— Build 进入持久化分发队列（BuildDispatchStore）。Worker 按 claim 顺序消费，通过 CapacityReservation 管理并发资源。多个 Build 共享容量声明，互不阻塞。

4. Execute（执行）— Worker 驱动 Build 状态机（BuildMachine），每条命令通过 Executor 发送给对应的 Provider，结果写入 BuildFact，推进状态直到所有 target 的依赖链完成。

AI generation is slow, costly, and non-deterministic. Instead of executing immediately, Narratage compiles requested work into a durable plan. The entire build lifecycle has four steps:

1. Plan — narratage plan freezes a complete execution plan. Every model call, every cost is reviewable before execution. You only pay after you confirm.

2. Build — narratage build submits a durable Build. The CLI returns a Build ID immediately; the build executes in a background Worker process. Even if the terminal closes, the build continues.

3. Dispatch — the Build enters a durable dispatch queue (BuildDispatchStore). The Worker claims Builds in order, managing concurrent resources through CapacityReservation. Multiple Builds share capacity declarations without blocking each other.

4. Execute — the Worker drives the Build state machine (BuildMachine); each command is sent to the corresponding Provider through the Executor, results are written as BuildFacts, and state advances until the dependency chains for all targets are complete.

#### 运行时配置 / Runtime Profile

运行时配置文件（narratage.runtime.json）定义了“在哪里、用什么跑”。它与 .svml/.svrun 完全解耦：同一份源码可以在不同的运行时配置下执行；开发者用本地 GPU + 环境变量凭据，CI 用 S3 存储 + Keychain 凭据，生产环境用 AWS Lambda 传输。

配置文件声明四类插件实例：artifacts（构建产物存储，如本地文件系统或 S3）、credentials（凭据管理，如环境变量或系统 Keychain）、endpoints（模型提供商，如 KIE、Google Vertex、本地 WhisperX），以及由 Endpoint 声明的 Managed Program（如 WhisperX 本地进程、HyperFrames 渲染服务）。narratage doctor 可以在不执行任何构建的前提下验证整个运行时配置的完整性。

The Runtime Profile (narratage.runtime.json) defines "where and how to run." It is completely decoupled from .svml/.svrun: the same source code can execute under different runtime configurations — a developer uses a local GPU with environment variable credentials, CI uses S3 storage with Keychain credentials, and production uses AWS Lambda transport.

The profile declares four categories of plugin instances: artifacts (build artifact storage, e.g., local filesystem or S3), credentials (credential management, e.g., environment variables or system Keychain), endpoints (model providers, e.g., KIE, Google Vertex, local WhisperX), and Managed Programs declared by Endpoints (e.g., a local WhisperX process, a HyperFrames rendering service). narratage doctor can validate the entire runtime configuration without executing any build.

### Capabilities（能力）

#### 叙事驱动 / Narrative-Driven

取消时间线：所有视频编辑器——Premiere、CapCut、剪映、DaVinci、Final Cut——都是为人类的手在时间线上拖拽而设计的。Narratage 取消了时间线。视频不是在轨道上拼接出来的，而是在源码中写出来的：角色、台词、段落、视觉意图全部在文本中声明，没有时间码、没有素材路径、没有图层。别人给你更快的剪辑台，我们取消剪辑台。

Agent 原生：输入是结构化文本，LLM 天生会写。Agent 不需要模仿人类拖动时间线——它读取 SVML、规划任务、调用模型、组织结果。视频生产可以无缝接入更大的 Agent Workflow，不再是自动化链路中需要人工接手的孤岛。

锚定到词：再生成会导致时长变化，所有时间码都会漂移。传统编辑器的解决方案是人工重新对齐。Narratage 的 Hook 机制将视觉效果锚定到叙事文本中的词，而非时间轴上的秒——重新生成语音后，B-roll 和效果自动跟随它们锚定的词重新对齐，不需要人工返工。

批量生产：最重要的是，一切都是源文件。同一份 .svml 可以同时提交一百个 Build，每个 Build 使用不同的 .svrun 配置——不同的风格参数、不同的片段组合、不同的语言版本。一个人每天手动在时间线上搓 B-roll 最多做三条视频；Narratage 框架下，生产瓶颈不是人手，而是 GPU 并发数。视频生产从手工编辑的速度，变成了代码编译的速度。

No timeline — Every video editor — Premiere, CapCut, DaVinci, Final Cut — was built for human hands on a timeline. Narratage eliminates the timeline. Videos are not assembled on tracks but written in source: characters, dialogue, segments, and visual intent are all declared in text — no timecodes, no asset paths, no layers. Others give you a faster editing desk; we remove the editing desk entirely.

Agent-native — The input is structured text — something LLMs write natively. Agents don't need to imitate humans dragging a timeline; they read SVML, plan tasks, call models, and organize results. Video production plugs seamlessly into larger Agent Workflows, no longer an island in the automation chain that requires a human handoff.

Pinned to words — Regeneration shifts timing, causing every timecode to drift. Traditional editors solve this with manual realignment. Narratage's Hook mechanism pins visual effects to words in the narrative text, not seconds on a timeline — after regenerating speech, B-roll and effects automatically realign to the words they're anchored to, with no manual rework.

Batch-ready — Most importantly, everything is source files. The same .svml can submit a hundred Builds simultaneously, each with a different .svrun configuration — different style parameters, different segment combinations, different language versions. One person manually placing B-roll on a timeline can produce at most three videos a day; under Narratage, the production bottleneck is not human hands but GPU concurrency. Video production moves from the speed of manual editing to the speed of code compilation.

#### 创作能力 / Authoring

多角色对话：剧本中直接标注说话人（<HOST>、<GUEST>），系统据此生成对应人物形象和音色。播客、街采、短剧等多人内容原生支持，不需要分轨录制再手动拼接。

显示与朗读分离：Split 语法让字幕显示原始文本，模型朗读指定发音。<$299 | two ninety-nine> 让观众看到“$299”，听到“two ninety-nine”。自创词汇、数字、口头语和替换表达均可精确控制。

Display-speech separation — Split syntax lets captions show the original text while the model speaks the designated pronunciation. <$299 | two ninety-nine> shows viewers "$299" while they hear "two ninety-nine." Coined terms, numbers, colloquialisms, and substitute expressions are all precisely controllable.

Caption system — Per-word karaoke highlighting, entry/exit animations, per-character differentiated styles. Caption behavior is not hand-tuned in an editor but declared like style rules.

Semantic anchors — Hooks anchor not only to word boundaries but also to Segment boundaries (2M+2N anchors). Selections mark time ranges, Moments mark time points, with support for nesting, interleaving, and affinity control. Visual effect lifetimes are determined by narrative structure, not by timecodes.

#### 执行控制 / Execution Control

花钱前先看账单：narratage plan 在执行前冻结一份完整的执行计划。每一次模型调用、调用哪个提供商、预期产物类型，全部可审查。确认了才真正花钱。

结果可复用：修改剧本后重新编译，未变化的部分通过 <build-record> 和 <satisfy> 声明复用旧结果，不重复支付生成费用。只有真正变化的片段触发重新生成。

同一份源码，一致的结果：执行计划是确定性的。生成模型的随机性依然存在，但被限制在单个模型调用的范围内；其余一切（依赖图、调度顺序、产物类型）由编译器保证。

Bill before you pay — narratage plan freezes a complete execution plan before any work runs. Every model invocation, which provider handles it, and the expected artifact type are all reviewable. You only pay after you confirm.

Reusable results — After editing and recompiling, unchanged parts declare reuse of prior results via <build-record> and <satisfy>, avoiding duplicate generation costs. Only the segments that actually changed trigger regeneration.

Same source, consistent results — The execution plan is deterministic. Model randomness still exists, but it is confined to individual model invocations — everything else (dependency graph, scheduling order, artifact types) is guaranteed by the compiler.

### Comparison（对比：第五种范式）

今天市面上所有的视频制作方案都落入四种范式之一。每一种都有结构性缺陷，不是功能不够，而是范式本身的天花板。Narratage 不是对任何一种的改良。它是第五种范式：用语言描述叙事意图，由编译器组织生成。

Every video production solution on the market today falls into one of four paradigms. Each has a structural deficiency — not a missing feature, but a ceiling inherent to the paradigm itself. Narratage is not an improvement on any of them — it is the fifth paradigm: describe narrative intent in a language, and let a compiler orchestrate the generation.

#### vs. 时间线 / Timeline

代表：Adobe Premiere Pro、Apple Final Cut Pro、DaVinci Resolve、CapCut / 剪映、Avid Media Composer、Vegas Pro、Filmora、KineMaster

时间线是过去三十年视频编辑的基本范式。这个范式不是没有尝试拥抱 AI 和可编程：ChatCut 通过 ChatGPT 插件让 Agent 用自然语言操作时间线；CapCut 社区逆向了 draft_content.json 做出了非官方 CLI 和 MCP Server；DaVinci Resolve 提供 Python/Lua 脚本 API 和 headless 模式，是传统 NLE 里可编程能力最强的。但这些努力的本质是一样的：给时间线配一个代操的 Agent。Agent 帮你拖素材、切片段、对时间码，做的还是人做的那些事，只是换了一双手。时间线本身仍然是表示层：它描述的是“什么素材在什么时间点出现在什么轨道上”，不是“这条视频在讲什么故事”。一个人每天手搓 B-roll 最多做三条视频，Agent 搓得快一些也许做十条；但做一百条不同版本，时间线范式没有这个表达能力。

Representatives: Adobe Premiere Pro, Apple Final Cut Pro, DaVinci Resolve, CapCut, Avid Media Composer, Vegas Pro, Filmora, KineMaster

The timeline has been the fundamental paradigm of video editing for thirty years. It is not for lack of trying that it hasn’t embraced AI and programmability — ChatCut lets agents operate a timeline through a ChatGPT plugin with natural language; the CapCut community reverse-engineered draft_content.json to build an unofficial CLI and MCP servers; DaVinci Resolve offers Python/Lua scripting with headless mode, the strongest programmability among traditional NLEs. But every one of these efforts amounts to the same thing: giving the timeline a proxy operator. The agent drags assets, cuts segments, aligns timecodes — doing exactly what a human does, just with different hands. The timeline itself remains the representation layer: it describes “what asset appears on what track at what timecode,” not “what story this video is telling.” One person placing B-roll by hand can produce three videos a day; an agent doing it faster might manage ten — but a hundred different versions is beyond what the timeline paradigm can express.

#### vs. 画布 / Canvas

代表：ComfyUI、LibTV（哩布哩布）、Descript、Dify / n8n（工作流编排）

画布（节点图）范式用可视化连线取代了时间线的线性轨道，而且这个范式对 Agent 的拥抱比时间线积极得多：ComfyUI 2026 年推出了官方 MCP 和人类可读 DSL；LibTV 是目前最有野心的尝试：无限画布 + 节点图 + Agent Skill 协议，把脚本、分镜、生成、剪辑放进同一个空间；Dify 和 n8n 作为通用工作流引擎，社区已经拼出了“webhook → LLM → 生成 → 拼接 → 上传”的视频自动化管线。但画布描述的是数据流，不是叙事意图。你在连接的是“图片节点 → 缩放节点 → 合成节点”，不是“在主持人说产品名的时候切入产品特写”。规模上去之后，画布变成一坨几千行的 json。更关键的是：画布不是源码。它不能 diff，不能 merge，不能 code review，不能在 CI 里跑。Agent 可以调参数、可以搜模型、可以触发工作流，但它不能理解“这条视频在讲什么故事”。此外，Higgsfield、RunwayML、Kling AI 等产品虽然有画布界面或 API，但本质上是生成平台（把 prompt 变成片段），不是合成工具（把片段变成视频），它们是 Narratage 调用的下层基础设施，不是同层竞品。

Representatives: ComfyUI, LibTV, Descript, Dify / n8n (workflow orchestrators)

The canvas (node graph) paradigm replaces the timeline’s linear tracks with visual wiring, and this paradigm has embraced agents more aggressively than timelines — ComfyUI launched an official MCP and human-readable DSL in 2026; LibTV is the most ambitious attempt to date: infinite canvas + node graph + Agent Skill protocol, placing scriptwriting, storyboarding, generation, and editing in one space; Dify and n8n, as general-purpose workflow engines, have community-built video automation pipelines chaining webhooks, LLMs, generation APIs, and social media upload. But a canvas describes data flow, not narrative intent — you’re wiring “image node → scale node → composite node,” not “cut to a product close-up when the host says the product name.” At scale, the canvas becomes a bowl of spaghetti. More critically: a canvas is not source code. It cannot be diffed, merged, code-reviewed, or run in CI. Agents can tune parameters, search models, trigger workflows — but they cannot understand “what story this video is telling.” Note: products like Higgsfield, RunwayML, and Kling AI may have canvas UIs or APIs, but they are fundamentally generation platforms (turning prompts into clips), not composition tools (turning clips into videos) — they are downstream infrastructure that Narratage calls, not same-layer competitors.

#### vs. 信息流 SaaS / Info-Feed SaaS

代表：Arcads、HeyGen、Creatify、Synthesia、MakeUGC、TopView、InVideo、D-ID、Colossyan、Pictory

信息流 SaaS 是目前 AI 视频赛道最拥挤的范式：上传素材、选模板、填文案、点生成。能出片，速度也快，但天花板极低。模板锁死了视觉结构；你想要的效果如果模板没有，你做不了。闭源意味着你不能修改生成流程、不能接入自己的模型、不能自部署。结果不可复现，同一段文案生成两次得到两个完全不同的视频。按月订阅收费，用户为平台付费而非为算力付费。最致命的：它们本质上是表单，不是编程系统。Agent 能做的只是帮你填表单，不是帮你做视频。

Representatives: Arcads, HeyGen, Creatify, Synthesia, MakeUGC, TopView, InVideo, D-ID, Colossyan, Pictory

Info-feed SaaS is the most crowded paradigm in the AI video space: upload assets, choose a template, fill in copy, click generate. It can produce videos and does so quickly, but the ceiling is extremely low. Templates lock down the visual structure — if the effect you want isn't in the template, you can't do it. Closed source means you cannot modify the generation pipeline, plug in your own models, or self-host. Results are not reproducible: the same script generated twice yields two entirely different videos. Monthly subscriptions charge for the platform, not for compute. The fatal flaw: they are fundamentally forms, not programming systems — the most an Agent can do is fill in the form for you, not make a video for you.

#### vs. 代码视频框架 / Code Video Frameworks

代表：Remotion、Revideo、MoviePy、Motion Canvas、Manim、FFmpeg 脚本

代码视频框架是四个范式里离 Narratage 最近的：可编程、可批量、可复现。但它们解决的问题是“用代码精确控制每一帧动画”，本质是程序化合成，不是内容生产。你要知道每一帧画什么、每个元素在哪个像素、每段动画持续几秒。没有语义层：没有“段落”、没有“说话人”、没有“在这句话的时候”。没有 AI 生成：画面不是从 prompt 生成的，是你手写 React 组件或 Python 函数画出来的。它们面向动效设计师和程序化动画，不面向内容生产。Remotion 能做出惊艳的数据可视化视频，但做不了“主持人讲解产品”，因为它没有叙事、没有语音、没有生成。

Representatives: Remotion, Revideo, MoviePy, Motion Canvas, Manim, FFmpeg scripting

Code video frameworks are the closest of the four paradigms to Narratage: programmable, batchable, reproducible. But the problem they solve is "precisely control every frame of animation with code" — fundamentally programmatic compositing, not content production. You need to know what to draw on each frame, which pixel each element occupies, how many seconds each animation lasts. There is no semantic layer: no "segment," no "speaker," no "when this sentence is spoken." There is no AI generation: visuals are not generated from prompts but hand-coded as React components or Python functions. They target motion designers and programmatic animation, not content production. Remotion can produce stunning data visualization videos, but it cannot make "a host explaining a product" — because it has no narrative, no speech, no generation.

#### vs. 生成模型 / Generation Models

代表：Seedance（字节）、MiniMax H3（MiniMax）、Gemini Omni（Google）、GPT Image（OpenAI）、Grok Imagine（xAI）、Veo（Google）、Kling（快手）、ElevenLabs、MiMo TTS（小米）

这些不是竞品，是基础设施。Narratage 站在它们肩膀上。Seedance 能生成一段 5 秒的参考视频，MiniMax H3 能合成一段语音，GPT imge 能生成一张图片，但它们中没有任何一个能把 20 个生成结果编排成一条完整的视频。从单个片段到成片之间缺失的是整条生产链：叙事结构、语音对齐、字幕渲染、多轨合成、画面合成、渲染输出，以及把这一切串起来的依赖图编译和状态机驱动的执行。这正是 Narratage 的工作。用户在 .svml 里写 model="mini" 调用 Seedance 2 Mini，但 Narratage 负责把这次调用编排进完整的构建流程：先生成语音、再对齐时间、再生成画面、再合成字幕、再渲染输出。任何一步的结果都可以复用，任何一步的模型都可以替换。模型是砖，Narratage 是建筑师。

Representatives: Seedance (Bytedance), MiniMax H3 (MiniMax), Gemini (Google), GPT Image (OpenAI), Grok Imagine (xAI), Veo (Google), Kling (Kuaishou), ElevenLabs, MiMo TTS (Xiaomi)

These are not competitors — they are infrastructure. Narratage stands on their shoulders. Seedance can generate a 5-second reference video, MiniMax H3 can synthesize a speech segment, Gemini can generate an image — but none of them can orchestrate 20 generation results into a finished video. What is missing between individual clips and a finished production is the entire production chain: narrative structure, speech alignment, caption rendering, multi-track compositing, frame composition, render output, and the dependency-graph compilation and state-machine-driven execution that ties it all together. That is what Narratage does. A user writes model="mini" in .svml to invoke Seedance 2 Mini, but Narratage orchestrates that invocation into a complete build pipeline: generate speech first, then align timing, then generate visuals, then render captions, then composite and output — any step's result can be reused, any step's model can be swapped. Models are the bricks; Narratage is the architect.

## 3. Use Case 内容样例

每个 use case 备齐三样:成片 + .svml 源码 + 一句卖点文案。

- AI 口播/AI UGC 带货(对标 Arcads/Creatify 主战场,商业价值最直接)——【待填:成片 + 可视化】

- AI 播客/多角色对话(展示多角色剧本能力,竞品做不了)——【待填:成片 + 可视化】

- Agent 全自动出片(一条 prompt 到一支成片,卖给 Agent 时代)——【待填:成片 + 可视化】

- AI 街头采访 ——【待填:成片 + 源码】

- AI 短剧 ——【待填:成片 + 源码】

## 4. User Journey 工作流程demo

1. 克隆仓库

**嵌入附件/视频：** clone 00:28

**嵌入附件/视频：** quick start 00:18

## 5. Visual Assets 视觉资产储备

- Logo(亮/暗底各一)

1. 初版白底logo svg：

**嵌入附件/视频：** 初版logo.svg 11.75KB

黑底logo svg：

**嵌入附件/视频：** 黑底logo.svg 5.15KB

带报纸纹理版png

> [原飞书文档嵌入图片；块 ID: 342, record ID: NvKEdBmFMoSbzNxZaUWcedlsnid]

2. Banner(GitHub 社交预览图 1280×640 + README 头图)

> [原飞书文档嵌入图片；块 ID: 344, record ID: FPXVdjkTIoqxRmxGsRVcB2M5nQf]

Demo GIF(15 秒内,README 首屏用,最重要的单一视觉资产

> [原飞书文档嵌入图片；块 ID: 346, record ID: Oy0MdZkgaobbTzxvJGfcvz6EnWX]

3.Product screenshots(写剧本→看计划→编译→成片,4 张)——【待做】

4.Architecture image(三个文件 + 四步流程,一张图)——【待做】

待修改：

> [原飞书文档嵌入图片；块 ID: 351, record ID: HYAadbSnpoKy3OxxSbucYKxRnjg]

5.Launch video(60-90s;建议:video 本身用 Narratage 编译,片尾放出它自己的源码)——【待做】

3. 暂时的官网截图（修改了左侧代码颜色）

https://narratage.hypit.site/ 目前是这样，修改了页脚，搜索框，排放位置等等

> [原飞书文档嵌入图片；块 ID: 355, record ID: TOSZdQHFWoZ9quxwVDscbuCxnrd]

4. Discord 表情包

初稿：

> [原飞书文档嵌入资产组；块 ID: 358]

5. Narratage 1.0 Launch – Content Collaboration Brief 起了一个草稿（user journey视频在这里）


Narratage 1.0 Launch – Content Collaboration Brief （Twitter）

## 6. Team Intro 团队介绍

平均年龄20岁！我作为founder拖了后腿。

陈昱东 Alvin，北京大学 25 届本科毕业生；从清华大学辍学；曾任光华管理学院学生会主席；AI 领域连续创业者；自媒体ADHD患者；side project github 1.3k star（无launch无投流无营销，虽然我们团队的开源项目campaign需要做一些营销）；“startup应该无限零食无限饮料无限token无限打车无限工作时长”工作理念提出者

金群琳 Kashorin，清华大学计算机系 22 级本科生，曾在清华计算机系知识工程（KEG）实验室科研，参与发表论文并投稿至 AAAI；曾在智谱 AI 多模态研究组实习，负责视觉美学理解模型和视频生成大模型的训练；全网第一批 AI IP 打造者，2 个月时间打造超 30 万粉丝 AI 美女 IP；曾获 2023 年国家奖学金；曾在真格基金实习。

> 💡
> 群琳是我在真格实习时认识的好兄弟，一起做了小一年的项目，无需多言，你可以微信搜索。是最有 UGC 思维、最懂流量的 AI 创作者，也是硬核的多模态研究员。Hypit 里"VLM 反向工程视频 + Workflow化内容制作" 这一整条技术线的灵魂人物。

刘润生，华南理工大学，分别在腾讯和字节负责开发工作。在腾讯期间，负责 QQ 小程序以及小游戏的底层客户端开发，负责优化小程序性能、重构小程序加载，解决白屏问题等。在字节期间，负责字节中台单元测试服务的前后端开发工作，包括服务稳定性治理，单测智能生成，用例质量稳定性等。同时也是 TikTok 跨境电商店铺老板。

> 📌
> 润生是我下定决心来广东创业之后，在小红书上认识的后端技术"大爹"。其实我们刚接触的时候，不知道他在字节腾讯做过后端。他只是觉得我们做 AI 内容很有趣，他也当过 TikTok 店铺的老板，觉得 AI + UGC 内容，做流量做营销很有意思，也是他之前的刚需。后来才发现，润生的技术确实强，字节出来的是真的不一样……Hypit 的后端高并发、服务稳定性、和未来的 marketplace 交易系统都由润生扛。

王毓凝 Eva，康奈尔大学信息科学硕士，普瑞特艺术学院设计与心理学本科；曾参与谷歌云平台及 Twirlista 等 AI 项目，负责 AI 产品评估、电商首页、销售历史等核心体验设计；ngtc珠宝鉴定师，独自跑过广州珠宝工厂与销售，上学时3个月卖了10wrmb（粗略估计），拿过很多小奖，交互装置在纽约画廊展出过。

> 📌
> Eva也是我在小红书上寻觅到的天才，我打断了她成为跨境电商亿级大卖的旅途。Eva的加入也是一次颇具浪漫主义的转会：美高+美本+美硕，但是也准备一个人回国来深圳和我们一起创业，工资是在美国工作的1/5左右。我们有不得不成功的理由（

卫家燊，北京大学物理学院22级本科生；开源项目资深开发者；PHYBench共同第一作者、内部平台代码工作负责人（获新智元/机器之心等知名媒体报导，Hugging Face Dataset Trending 单日最高No.3，投稿至NIPS）；物院首届大模型调优挑战赛第一名；北京大学校级云计算平台Clab核心开发者；曾为多个知名开源项目（memos、umami..上万star）贡献代码并成功merge进主分支、

> 🚅
> 家燊和我认识快2年了，我第一段创业经历，就是和家燊他们一起做的，LLM北大校内资讯平台，有好几千名用户。虽然后续没有继续推进下去，但团队里的朋友们一直都有connection。家燊是对AI native的设计&前端构造最有sense的人。

rpone 鲨鱼，我们未来的老板（现在的intern）。18 岁高中刚毕业的独立开发者，B 站 @rponeawa 4.6 万粉，官方邀请签约独家 UP 主，拥有「黄金殿堂」勋章；6 年自媒体运营经验，做出过 7 条百万级视频，单条最高 447 万播放。他既懂音乐卡点、填词翻唱、AI 生成视频这类爆款内容，也能把商单制作、视频搬运、配音、字幕、封面和上传流程拆成可复用的 agentic workflow。目前在跑的 TransVideo，已经把 YouTube / B 站趋势抓取、素材下载、中文配音、字幕封面生成、一键上传串成了完整自动化链路。

> 📌
> rpone 是我在小红书黑客松巅峰赛上认识的女生。 她决定加入我们只花了 1 天，高考一结束就过来和我们一起干。虽然才刚 18 岁，但她在 AI 视频、音频、内容创作和Agent上的实战经验已经非常扎实，几乎可以无缝衔接 Hypit 现在最核心的工作。很感谢 rpone 对我们的信任，也小小夸一下我们团队的凝聚力！

唐艺 Seraphina（可丽饼），09 年高二学生。初一初二因为疫情做跨境进口，初三为证明学术能力放弃保送参加中考考进成都 Top 2 高中，后因觉得AI 时代不想上无效课所以果断脱产；搭建 Web一周内有 10W+ 使用量且收获无数走心反馈；Hackittw共创，组织多个青少年开创社群；高精力人文哲学社会方案实践者，虽然是E人但是重度 Solo Traveler，小学起独自踩线多国，独自徒步过 5000 米高原、睡过机场搭过帐篷、独自野外遇蛇处变不惊；表面是 K-pop 迷，本质是对世界一切保持终极的好奇。

> 📌
> 可丽饼 也是我在小红书上认识的女生。高中生在AI startup工作可能在美国比较寻常，但在中国敢做这种决定，一定是有勇气有决策能力，同时有很有creative的人才能做出来的事情。作为团队年龄的中位数，我会被可丽饼的勇气和想法，以及活力深深感触。可丽饼现在负责公司的mkt工作筹备与实施，才16岁！

## 7. 可以用于营销的point

1. 视频正在迎来自己名叫 Narratage 的 Harness 时刻。【酷炫，蹭deepseek】

→Agent = Model + Harness
Video Agent = Video Model + Narratage

2. Narratage 无需画布和时间线 就可以生成视频。【对比其他的视频agent】

3. 视频生成模型只能生成素材; 而 Narratage 不仅生成素材，而且可以把素材组织成完整的视频——结构、字幕、卡点、特效全写在源码里，可修改、可复用。【对比模型】

4. Agency 交付一次性结果，而 Narratage 任何一条结果都是一条可持续运转的生产线（工作流）。【对比Agency】

5. Narratage 让用户免费拥有生产能力。Free to start. Open to own.【对比其他的闭源产品。我们open source+开源】

→CapCutPro $19.99/月,Creatify $39/月,HeyGen $49/月,Arcads$220/月,而open source的Narratage $00️⃣🔪

6. Narratage 把一次性、概率性的（手动抽卡式的）视频生成，变成开放、可检查、可修改、可重复执行的生产系统。【针对抽卡痛点和视频制作无法workflow化的痛点】

7. Narratage 让视频的时间参考不再是帧，而是最直接的语言内容。

→kill timeline:直接视频/照片演示对比

8. Narratage 里的每个词都可以成为B-roll的触发器，说到哪个词，画面就在哪个词精确出现。

→视频：eg说到“产品”时，产品画面出现；说到“增长”时，数据图表出现；说到某个人时，人物画中画出现；说到某个功能时，产品演示出现

9. 传统剪辑对齐第几秒，Narratage精确对其到字句。

→详细说：其他工具把文字当作字幕或Prompt，Narratage把语言变成视频源码。Narratage 的每句话都可以调度声音、字幕、B-roll和画中画，内容发生变化，相关画面随语言重新编译。

10. Narratage 让视频不只是单独一次制作快，而是越做越快。
