/**
 * S16 · TEAM（蓝图 §3.15 / §8 红线 10）。
 *
 * 全部事实逐条来自 BP「Team Intro 团队介绍」原文，不润色、不拔高、不补全学历或奖项。
 * 唐艺只写 16 岁，不写出生年（D7）。founderNote 是创始人陈昱东对成员的原话（压缩，不改事实）。
 */

import type { L10n, L10nList } from './types'

export interface TeamMember {
  id: string
  index: string
  name: string
  enName: string | null
  role: L10n
  /** 首页团队区的一句话事实简介；由飞书 Team Intro 压缩，不补充原文外信息。 */
  profile: L10n
  org: L10n
  highlights: L10nList
  /** 成员自己的话；没有就是 null。 */
  quote: L10n | null
  /** 创始人评价；创始人本人为 null。 */
  founderNote: L10n | null
  /** public 路径，缺失时渲染 mono 首字母块。 */
  avatar?: string
}

export interface TeamData {
  eyebrow: string
  averageAge: number
  hook: L10n
  members: TeamMember[]
}

export const team: TeamData = {
  eyebrow: 'MOVEMENT V — PEOPLE',
  averageAge: 20,
  hook: {
    en: 'Average age 20. As the founder, I’m the one dragging it up.',
    cn: '平均年龄 20 岁！我作为 founder 拖了后腿。',
  },
  members: [
    {
      id: 'alvin',
      index: '0x01',
      name: '陈昱东',
      enName: 'Alvin',
      role: { en: 'Founder', cn: '创始人' },
      profile: {
        en: 'PKU class of 2025 · serial AI founder · a side project at 1.3k GitHub stars without a launch or paid distribution.',
        cn: '北大 25 届 · AI 连续创业 · side project 未 launch、未投流，做到 1.3k GitHub star。',
      },
      org: { en: 'Peking University, class of 2025', cn: '北京大学 25 届本科毕业生' },
      highlights: {
        en: [
          'Peking University, class of 2025; dropped out of Tsinghua University before that',
          'Former president of the Guanghua School of Management student union',
          'Serial founder in AI',
          'Chronically online',
          'A side project at 1.3k GitHub stars — no launch, no ads, no marketing',
        ],
        cn: [
          '北京大学 25 届本科毕业生，此前从清华大学辍学',
          '曾任光华管理学院学生会主席',
          'AI 领域连续创业者',
          '自媒体 ADHD 患者',
          'side project GitHub 1.3k star（无 launch、无投流、无营销）',
        ],
      },
      quote: {
        en: 'A startup should run on unlimited snacks, unlimited drinks, unlimited tokens, unlimited taxi rides and unlimited hours.',
        cn: 'startup 应该无限零食、无限饮料、无限 token、无限打车、无限工作时长。',
      },
      founderNote: null,
    },
    {
      id: 'kashorin',
      index: '0x02',
      name: '金群琳',
      enName: 'Kashorin',
      role: { en: 'Multimodal research · AI content', cn: '多模态研究 · AI 内容' },
      profile: {
        en: 'Tsinghua CS · KEG and Zhipu multimodal research · built a 300k-follower AI persona in two months.',
        cn: '清华计算机 · KEG 与智谱多模态研究 · 2 个月做出 30 万粉的 AI IP。',
      },
      org: { en: 'Tsinghua University, CS, class of 2022', cn: '清华大学计算机系 22 级本科生' },
      highlights: {
        en: [
          'Research at Tsinghua’s Knowledge Engineering Group (KEG); co-authored a paper submitted to AAAI',
          'Interned in Zhipu AI’s multimodal research group, training visual aesthetics understanding models and video generation models',
          'One of the first AI IP builders in China: grew an AI influencer persona to 300k+ followers in two months',
          'National Scholarship, 2023',
          'Interned at ZhenFund',
        ],
        cn: [
          '曾在清华计算机系知识工程实验室（KEG）科研，参与发表论文并投稿至 AAAI',
          '曾在智谱 AI 多模态研究组实习，负责视觉美学理解模型和视频生成大模型的训练',
          '全网第一批 AI IP 打造者，2 个月打造超 30 万粉丝的 AI 美女 IP',
          '2023 年国家奖学金',
          '曾在真格基金实习',
        ],
      },
      quote: null,
      founderNote: {
        en: 'Kashorin is a brother I met interning at ZhenFund; we ran a project together for the better part of a year. The most UGC-minded, most traffic-literate AI creator I know, and a hardcore multimodal researcher at the same time. He is the soul of the whole “reverse-engineer video with VLMs, then produce content workflow-style” line of work at Hypit.',
        cn: '群琳是我在真格实习时认识的好兄弟，一起做了小一年的项目，无需多言。是最有 UGC 思维、最懂流量的 AI 创作者，也是硬核的多模态研究员。Hypit 里「VLM 反向工程视频 + Workflow 化内容制作」这一整条技术线的灵魂人物。',
      },
    },
    {
      id: 'liurunsheng',
      index: '0x03',
      name: '刘润生',
      enName: 'laurunshen',
      role: { en: 'Backend · infrastructure', cn: '后端 · 基础设施' },
      profile: {
        en: 'Tencent and ByteDance backend · mini-program foundations, test infrastructure and service reliability · TikTok shop operator.',
        cn: '腾讯 / 字节后端 · 小程序底层、单测平台与稳定性治理 · 也经营 TikTok 跨境店。',
      },
      org: { en: 'South China University of Technology', cn: '华南理工大学' },
      highlights: {
        en: [
          'Tencent: client-side foundations for QQ mini programs and mini games — performance tuning, rebuilding the loading path, killing white screens',
          'ByteDance: full-stack work on the internal unit-test platform — service stability governance, intelligent test generation, case quality',
          'Runs his own TikTok cross-border e-commerce store',
        ],
        cn: [
          '腾讯：负责 QQ 小程序与小游戏的底层客户端开发，优化小程序性能、重构小程序加载、解决白屏问题',
          '字节：负责中台单元测试服务的前后端开发，包括服务稳定性治理、单测智能生成、用例质量稳定性',
          '同时是 TikTok 跨境电商店铺老板',
        ],
      },
      quote: null,
      founderNote: {
        en: 'Runsheng is the backend heavyweight I met on Xiaohongshu after I decided to start up in Guangdong. When we first talked I had no idea he had done backend at ByteDance and Tencent — he just thought AI content was interesting, having run a TikTok store himself. Hypit’s backend concurrency, service stability and the future marketplace transaction system all rest on him.',
        cn: '润生是我下定决心来广东创业之后，在小红书上认识的后端技术「大爹」。刚接触的时候，不知道他在字节腾讯做过后端 —— 他只是觉得我们做 AI 内容很有趣，他也当过 TikTok 店铺的老板。后来才发现，字节出来的是真的不一样。Hypit 的后端高并发、服务稳定性和未来的 marketplace 交易系统都由润生扛。',
      },
    },
    {
      id: 'eva',
      index: '0x04',
      name: '王毓凝',
      enName: 'Eva',
      role: { en: 'Product experience · design', cn: '产品体验 · 设计' },
      profile: {
        en: 'Cornell Information Science · Pratt design and psychology · AI product design, jewelry factories and hands-on sales.',
        cn: '康奈尔信息科学 · Pratt 设计与心理学 · 做 AI 产品，也亲自跑过珠宝工厂与销售。',
      },
      org: {
        en: 'M.S. Information Science, Cornell · B.A. Design & Psychology, Pratt',
        cn: '康奈尔大学信息科学硕士 · 普瑞特艺术学院设计与心理学本科',
      },
      highlights: {
        en: [
          'Worked on Google Cloud Platform and AI projects including Twirlista — AI product evaluation, e-commerce homepage, sales history and other core experience design',
          'NGTC-certified gemologist; ran Guangzhou jewelry factories and sales solo, selling roughly ¥100k in three months while still in school',
          'Several small awards; an interactive installation exhibited in a New York gallery',
        ],
        cn: [
          '曾参与谷歌云平台及 Twirlista 等 AI 项目，负责 AI 产品评估、电商首页、销售历史等核心体验设计',
          'NGTC 珠宝鉴定师；独自跑过广州珠宝工厂与销售，上学时 3 个月卖了 10w rmb（粗略估计）',
          '拿过很多小奖，交互装置在纽约画廊展出过',
        ],
      },
      quote: null,
      founderNote: {
        en: 'Eva is another talent I found on Xiaohongshu — I interrupted her route to becoming a nine-figure cross-border e-commerce seller. Her joining was a romantic transfer: US high school, US undergrad, US master’s, and then she came back alone to Shenzhen to build with us at about a fifth of what she would earn in the States. We have every reason we need to succeed.',
        cn: 'Eva 也是我在小红书上寻觅到的天才，我打断了她成为跨境电商亿级大卖的旅途。Eva 的加入是一次颇具浪漫主义的转会：美高 + 美本 + 美硕，但也准备一个人回国来深圳和我们一起创业，工资是在美国工作的 1/5 左右。我们有不得不成功的理由。',
      },
    },
    {
      id: 'weijiashen',
      index: '0x05',
      name: '卫家燊',
      enName: 'wjsoj',
      role: { en: 'AI-native design & frontend', cn: 'AI native 设计与前端' },
      profile: {
        en: 'PKU Physics · PHYBench co-first author · Clab core developer · long-time open-source contributor.',
        cn: '北大物理 · PHYBench 共同一作 · Clab 核心开发 · 资深开源贡献者。',
      },
      org: { en: 'Peking University, School of Physics, class of 2022', cn: '北京大学物理学院 22 级本科生' },
      highlights: {
        en: [
          'Veteran open-source developer',
          'Co-first author of PHYBench and lead of its internal platform code — covered by Xinzhiyuan and Jiqizhixin, peaked at No.3 on Hugging Face Dataset Trending for a day, submitted to NIPS',
          'First place in the School of Physics’ inaugural LLM fine-tuning challenge',
          'Core developer of Clab, Peking University’s campus-wide cloud computing platform',
          'Contributed code merged into the main branches of open-source projects with 10k+ stars, including memos and umami',
        ],
        cn: [
          '开源项目资深开发者',
          'PHYBench 共同第一作者、内部平台代码工作负责人（获新智元 / 机器之心等媒体报道，Hugging Face Dataset Trending 单日最高 No.3，投稿至 NIPS）',
          '物院首届大模型调优挑战赛第一名',
          '北京大学校级云计算平台 Clab 核心开发者',
          '曾为 memos、umami 等上万 star 的开源项目贡献代码并成功 merge 进主分支',
        ],
      },
      quote: null,
      founderNote: {
        en: 'Jiashen and I have known each other for close to two years — my first startup, an LLM campus information platform at PKU with a few thousand users, was built with him and his friends. It did not go on, but the friendships did. He has the best sense for AI-native design and frontend construction of anyone I know.',
        cn: '家燊和我认识快 2 年了，我第一段创业经历就是和家燊他们一起做的：LLM 北大校内资讯平台，有好几千名用户。虽然后续没有继续推进，但团队里的朋友们一直都有 connection。家燊是对 AI native 的设计 & 前端构造最有 sense 的人。',
      },
    },
    {
      id: 'rpone',
      index: '0x06',
      name: '鲨鱼',
      enName: 'rpone',
      role: { en: 'Intern · AI video & agentic workflow', cn: 'Intern · AI 视频与 Agent 工作流' },
      profile: {
        en: '18 · six years running creator channels · seven million-view videos · turns production into agentic workflows.',
        cn: '18 岁 · 6 年自媒体 · 7 条百万播放视频 · 把内容制作拆成 agentic workflow。',
      },
      org: { en: 'Independent developer, 18', cn: '18 岁独立开发者' },
      highlights: {
        en: [
          '18, straight out of high school; 46k followers on Bilibili as @rponeawa, an officially invited exclusive creator with the Golden Hall badge',
          'Six years running her own channels: seven videos past a million views, the biggest at 4.47 million',
          'Beat-matched music edits, lyric covers and AI-generated video on one side; sponsored production, reuploads, dubbing, captions, thumbnails and upload flows broken into reusable agentic workflows on the other',
          'Currently building TransVideo: YouTube/Bilibili trend scraping, asset download, Chinese dubbing, caption and thumbnail generation, one-click upload — one full automated chain',
        ],
        cn: [
          '18 岁高中刚毕业的独立开发者；B 站 @rponeawa 4.6 万粉，官方邀请签约独家 UP 主，拥有「黄金殿堂」勋章',
          '6 年自媒体运营经验，做出过 7 条百万级视频，单条最高 447 万播放',
          '既懂音乐卡点、填词翻唱、AI 生成视频这类爆款内容，也能把商单制作、视频搬运、配音、字幕、封面和上传流程拆成可复用的 agentic workflow',
          '目前在跑 TransVideo：YouTube / B 站趋势抓取、素材下载、中文配音、字幕封面生成、一键上传，串成完整自动化链路',
        ],
      },
      quote: null,
      founderNote: {
        en: 'rpone is a girl I met at a Xiaohongshu hackathon final. It took her one day to decide to join, and she came the moment the gaokao ended. She is barely 18, but her hands-on experience in AI video, audio, content creation and agents is already solid enough to plug straight into the most critical work at Hypit. Thank you for trusting us — which says something about the team, too.',
        cn: 'rpone 是我在小红书黑客松巅峰赛上认识的女生。她决定加入我们只花了 1 天，高考一结束就过来和我们一起干。虽然才刚 18 岁，但她在 AI 视频、音频、内容创作和 Agent 上的实战经验已经非常扎实，几乎可以无缝衔接 Hypit 现在最核心的工作。很感谢 rpone 对我们的信任，也小小夸一下我们团队的凝聚力。',
      },
    },
    {
      id: 'seraphina',
      index: '0x07',
      name: '唐艺',
      enName: 'Seraphina',
      role: { en: 'Marketing', cn: '市场' },
      profile: {
        en: '16 · built a web product used 100k+ times in one week · now preparing and running Hypit marketing.',
        cn: '16 岁 · Web 产品一周 10W+ 使用量 · 现在筹备并实施 Hypit 的市场工作。',
      },
      org: { en: 'High school student, 16', cn: '16 岁高中生' },
      highlights: {
        en: [
          'Ran cross-border import in her first two years of middle school, through the pandemic',
          'Gave up a guaranteed admission in her third year to sit the entrance exam and prove she could, and got into a top-2 high school in Chengdu; later left full-time schooling because she did not want ineffective classes in the age of AI',
          'Built a web product that hit 100k+ uses in its first week, with a flood of heartfelt feedback',
          'Co-creator of Hackittw; organizer of several youth builder communities',
          'An extrovert who is nonetheless a hardcore solo traveler — scouting countries alone since primary school, hiking a 5,000-metre plateau alone, sleeping in airports, pitching tents, meeting a snake in the wild without flinching',
          'K-pop fan on the surface; ultimate curiosity about everything underneath',
        ],
        cn: [
          '初一初二因为疫情做跨境进口',
          '初三为证明学术能力放弃保送参加中考，考进成都 Top 2 高中；后因觉得 AI 时代不想上无效课所以果断脱产',
          '搭建 Web 一周内有 10W+ 使用量，且收获无数走心反馈',
          'Hackittw 共创，组织多个青少年开创社群',
          '虽然是 E 人，却是重度 Solo Traveler：小学起独自踩线多国，独自徒步过 5000 米高原、睡过机场搭过帐篷、独自野外遇蛇处变不惊',
          '表面是 K-pop 迷，本质是对世界一切保持终极的好奇',
        ],
      },
      quote: null,
      founderNote: {
        en: 'Seraphina is another girl I met on Xiaohongshu. A high schooler working at an AI startup may be ordinary in the US, but making that call in China takes courage, decisiveness and a genuinely creative mind. As the median age of the team, I am moved by her courage, her ideas and her energy. She now runs marketing preparation and execution for the company — at 16.',
        cn: '可丽饼也是我在小红书上认识的女生。高中生在 AI startup 工作可能在美国比较寻常，但在中国敢做这种决定，一定是有勇气、有决策能力，同时很有 creative 的人才能做出来的事。作为团队年龄的中位数，我会被可丽饼的勇气、想法和活力深深感触。可丽饼现在负责公司的 mkt 工作筹备与实施，才 16 岁！',
      },
    },
  ],
}

export function memberById(id: string): TeamMember | undefined {
  return team.members.find((m) => m.id === id)
}
