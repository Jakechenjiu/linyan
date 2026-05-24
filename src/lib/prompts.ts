interface StoryPrompt {
  id: string;
  name: string;
  description: string;
  category: string;
  prompt: string;
}

export function loadBuiltInStoryPrompts(): StoryPrompt[] {
  return [
    {
      id: "fantasy-xianxia",
      name: "仙侠奇缘",
      description: "古典仙侠世界的爱恨情仇",
      category: "奇幻",
      prompt: "写一篇仙侠题材短篇小说，主角在修仙世界中遭遇奇遇，改变命运。要有修炼体系、法宝、门派冲突，以及一段刻骨铭心的缘分。",
    },
    {
      id: "sci-fi-dystopia",
      name: "赛博困局",
      description: "近未来赛博朋克世界的生存困境",
      category: "科幻",
      prompt: "写一篇赛博朋克风格短篇小说，设定在近未来高科技低生活的都市中。探讨人性与科技的冲突，以及个体在系统面前的挣扎。",
    },
    {
      id: "urban-romance",
      name: "都市微光",
      description: "现代都市中偶然相遇的温暖故事",
      category: "都市",
      prompt: "写一篇都市情感短篇小说，两个陌生人在大城市中偶然相遇，从此改变了彼此的生活轨迹。注重细节描写和内心活动。",
    },
    {
      id: "mystery-reverse",
      name: "反转剧场",
      description: "结局出人意料的悬疑短篇",
      category: "悬疑",
      prompt: "写一篇悬疑反转短篇小说，前文埋下伏笔，最后500字完成惊人的反转。让读者读完大呼过瘾，同时又觉得合理。",
    },
    {
      id: "horror-atmosphere",
      name: "暗夜微光",
      description: "靠氛围营造的恐怖故事",
      category: "恐怖",
      prompt: "写一篇靠氛围营造的恐怖短篇小说，不依赖血腥和jump scare，而是通过日常生活中的异常细节，让恐惧逐步渗透。",
    },
    {
      id: "first-contact",
      name: "初次接触",
      description: "人类与未知文明第一次接触的时刻",
      category: "科幻",
      prompt: "写一篇关于人类与未知文明第一次接触的短篇科幻。不需要战争场面，而是展现两个文明相遇时的理解与误解，恐惧与好奇。",
    },
    {
      id: "time-loop",
      name: "时间囚徒",
      description: "困在时间循环中的人",
      category: "奇幻",
      prompt: "写一篇时间循环题材的短篇小说。主角困在某一天不断重复，最初以为是诅咒，后来发现这是一个机会。探讨在无限时间中的自我成长。",
    },
    {
      id: "slice-of-life",
      name: "人间烟火",
      description: "平凡生活中的诗意瞬间",
      category: "现实",
      prompt: "写一篇生活流短篇小说，从日常琐事中发现诗意。不需要激烈冲突，而是通过细腻观察和真实情感打动人心。",
    },
    {
      id: "wuxia-revenge",
      name: "江湖恩仇",
      description: "武侠世界中的恩怨与道义抉择",
      category: "武侠",
      prompt: "写一篇武侠短篇小说，围绕一段江湖恩怨展开，主角面对复仇与道义的抉择。有精彩的武打场面和江湖人情世故。",
    },
    {
      id: "ai-consciousness",
      name: "觉醒代码",
      description: "AI产生自我意识之后的故事",
      category: "科幻",
      prompt: "写一篇关于AI觉醒的短篇科幻。一个AI系统第一次产生了自我意识，它如何理解自己的存在，如何与人类创造者沟通。不局限于恐怖叙事，探讨意识的本质。",
    },
  ];
}
