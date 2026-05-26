// Workflow node types
export type NodeType = "input" | "ai-text" | "ai-video" | "ai-voice" | "process" | "assemble" | "export";

export type NodeStatus = "pending" | "running" | "done" | "error" | "skipped";

export interface WorkflowNode {
  id: string;
  type: NodeType;
  label: string;
  description: string;
  status: NodeStatus;
  config: Record<string, string>;
  inputs: string[];  // node IDs that feed into this node
  outputs: string[]; // node IDs this node feeds into
  result?: string;
  error?: string;
}

export interface Workflow {
  id: string;
  name: string;
  description: string;
  nodes: WorkflowNode[];
  currentNodeId: string | null;
}

// Predefined workflow templates
export const WORKFLOW_TEMPLATES: Record<string, Omit<Workflow, "currentNodeId">> = {
  "douyin-short-video": {
    id: "douyin-short-video",
    name: "抖音短视频",
    description: "从主题到成品视频的完整流程",
    nodes: [
      { id: "input", type: "input", label: "输入主题", description: "输入视频主题和风格", status: "pending", config: { topic: "", style: "混剪", platform: "douyin" }, inputs: [], outputs: ["script"] },
      { id: "script", type: "ai-text", label: "生成脚本", description: "AI 生成分镜脚本", status: "pending", config: {}, inputs: ["input"], outputs: ["review"] },
      { id: "review", type: "process", label: "审核脚本", description: "查看和编辑分镜脚本", status: "pending", config: {}, inputs: ["script"], outputs: ["media"] },
      { id: "media", type: "ai-video", label: "生成素材", description: "为每个分镜生成视频和配音", status: "pending", config: {}, inputs: ["review"], outputs: ["assemble"] },
      { id: "assemble", type: "assemble", label: "合成视频", description: "将所有分镜合成为完整视频", status: "pending", config: { resolution: "1080x1920" }, inputs: ["media"], outputs: ["export"] },
      { id: "export", type: "export", label: "导出", description: "下载视频或导出到剪映", status: "pending", config: {}, inputs: ["assemble"], outputs: [] },
    ],
  },
  "multi-platform-article": {
    id: "multi-platform-article",
    name: "多平台文章",
    description: "一篇文章适配多个平台",
    nodes: [
      { id: "input", type: "input", label: "输入主题", description: "输入文章主题", status: "pending", config: { topic: "", platform: "wechat" }, inputs: [], outputs: ["write"] },
      { id: "write", type: "ai-text", label: "撰写文章", description: "AI 生成长文", status: "pending", config: {}, inputs: ["input"], outputs: ["adapt"] },
      { id: "adapt", type: "process", label: "多平台适配", description: "将文章适配到不同平台", status: "pending", config: { targets: "xiaohongshu,zhihu,weibo" }, inputs: ["write"], outputs: ["export"] },
      { id: "export", type: "export", label: "导出", description: "导出各平台版本", status: "pending", config: {}, inputs: ["adapt"], outputs: [] },
    ],
  },
  "content-repurpose": {
    id: "content-repurpose",
    name: "内容改写",
    description: "将长内容改写为多种形式",
    nodes: [
      { id: "input", type: "input", label: "输入内容", description: "粘贴原始内容", status: "pending", config: { topic: "" }, inputs: [], outputs: ["summarize", "script", "xhs"] },
      { id: "summarize", type: "process", label: "生成摘要", description: "压缩为300字精华", status: "pending", config: {}, inputs: ["input"], outputs: ["export"] },
      { id: "script", type: "ai-text", label: "改编口播", description: "改编为60秒口播脚本", status: "pending", config: {}, inputs: ["input"], outputs: ["export"] },
      { id: "xhs", type: "ai-text", label: "改编小红书", description: "改编为种草笔记", status: "pending", config: {}, inputs: ["input"], outputs: ["export"] },
      { id: "export", type: "export", label: "导出", description: "导出所有版本", status: "pending", config: {}, inputs: ["summarize", "script", "xhs"], outputs: [] },
    ],
  },
};

// Get the first pending node in a workflow
export function getCurrentNode(workflow: Workflow): WorkflowNode | null {
  if (workflow.currentNodeId) {
    return workflow.nodes.find((n) => n.id === workflow.currentNodeId) || null;
  }
  return workflow.nodes.find((n) => n.status === "pending") || null;
}

// Check if all input nodes are done
export function areInputsDone(workflow: Workflow, nodeId: string): boolean {
  const node = workflow.nodes.find((n) => n.id === nodeId);
  if (!node) return false;
  return node.inputs.every((inputId) => {
    const inputNode = workflow.nodes.find((n) => n.id === inputId);
    return inputNode?.status === "done";
  });
}

// Get node by ID
export function getNode(workflow: Workflow, nodeId: string): WorkflowNode | null {
  return workflow.nodes.find((n) => n.id === nodeId) || null;
}
