interface Template {
  id: string;
  name: string;
  description: string;
  platforms: string[];
  prompt: string;
  variables: string[];
}

export function loadBuiltInTemplates(): Template[] {
  return [
    {
      id: "headline-hook",
      name: "标题钩子",
      description: "生成高点击率的爆款标题，适用于各大平台",
      platforms: ["wechat", "xiaohongshu", "zhihu"],
      prompt: "为主题「{topic}」生成5个高点击率标题，要求有悬念感、数字或对比",
      variables: ["topic"],
    },
    {
      id: "wechat-article",
      name: "公众号长文",
      description: "深度观点文章，适合公众号深度阅读场景",
      platforms: ["wechat"],
      prompt: "以「{topic}」为主题写一篇公众号深度文章，1500-2000字，结构清晰有观点",
      variables: ["topic"],
    },
    {
      id: "xiaohongshu-note",
      name: "小红书种草",
      description: "小红书风格的种草笔记，轻松有吸引力",
      platforms: ["xiaohongshu"],
      prompt: "以小红书风格写一篇关于「{topic}」的种草笔记，活泼口语化，带emoji，3-5个要点",
      variables: ["topic"],
    },
    {
      id: "douyin-script",
      name: "抖音口播脚本",
      description: "短视频口播脚本，节奏快、有爆点",
      platforms: ["douyin"],
      prompt: "为「{topic}」写一份60秒抖音口播脚本，开头3秒抓眼球，有节奏感，有行动号召",
      variables: ["topic"],
    },
    {
      id: "zhihu-answer",
      name: "知乎回答",
      description: "知乎高赞回答格式，专业有深度",
      platforms: ["zhihu"],
      prompt: "以知乎高赞风格回答「{topic}」，专业有深度，分点论述，配上案例",
      variables: ["topic"],
    },
    {
      id: "weibo-thread",
      name: "微博话题串",
      description: "微博话题讨论串，简短有力",
      platforms: ["weibo"],
      prompt: "为「{topic}」写3-5条微博话题串，每条140字以内，观点犀利有传播力",
      variables: ["topic"],
    },
    {
      id: "bilibili-video",
      name: "B站视频文案",
      description: "B站中视频脚本，有趣有料",
      platforms: ["bilibili"],
      prompt: "为「{topic}」写一份B站视频文案大纲，包含开场白、主体分段、结尾互动",
      variables: ["topic"],
    },
    {
      id: "multi-platform",
      name: "多平台一键分发",
      description: "同一主题适配多个平台的版本",
      platforms: ["wechat", "xiaohongshu", "douyin", "weibo"],
      prompt: "为「{topic}」分别生成公众号、小红书、抖音、微博四个平台的版本",
      variables: ["topic"],
    },
  ];
}
