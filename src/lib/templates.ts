interface Template {
  id: string;
  name: string;
  description: string;
  platforms: string[];
}

export function loadBuiltInTemplates(): Template[] {
  return [
    { id: "headline-hook", name: "标题钩子", description: "生成高点击率的爆款标题", platforms: ["wechat", "xiaohongshu", "zhihu"] },
    { id: "wechat-article", name: "公众号长文", description: "深度观点文章，适合深度阅读", platforms: ["wechat"] },
    { id: "xiaohongshu-note", name: "小红书种草", description: "小红书风格的种草笔记", platforms: ["xiaohongshu"] },
    { id: "douyin-script", name: "抖音口播脚本", description: "短视频口播脚本，节奏快", platforms: ["douyin"] },
    { id: "zhihu-answer", name: "知乎回答", description: "知乎高赞回答格式", platforms: ["zhihu"] },
    { id: "weibo-thread", name: "微博话题串", description: "微博话题讨论串", platforms: ["weibo"] },
    { id: "bilibili-video", name: "B站视频文案", description: "B站中视频脚本", platforms: ["bilibili"] },
    { id: "multi-platform", name: "多平台分发", description: "同一主题适配多个平台", platforms: ["wechat", "xiaohongshu", "douyin", "weibo"] },
  ];
}
