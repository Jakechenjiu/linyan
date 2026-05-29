// 万象推演引擎 — 基于 AI API 的多智能体模拟

import { getAiConfig, callAi } from "@/lib/ai";

export interface Agent {
  name: string;
  role: string;
  memory: string[]; // 该角色的记忆（之前的观点）
}

export interface SimulationRound {
  round: number;
  opinions: { agent: string; opinion: string }[];
  summary: string;
}

export interface SimulationResult {
  topic: string;
  agents: Agent[];
  rounds: SimulationRound[];
  conclusion: string;
}

// 生成初始观点
async function generateInitialOpinions(
  topic: string,
  seedMaterial: string,
  agents: Agent[],
  config: { apiKey: string; baseUrl: string; model: string; provider: string }
): Promise<{ agent: string; opinion: string }[]> {
  // 并行生成每个角色的初始观点
  const promises = agents.map(async (agent) => {
    const systemPrompt = `你是${agent.name}，一位${agent.role}。

你正在参与一场关于以下主题的多角色推演：
${topic}

${seedMaterial ? `背景材料：\n${seedMaterial}` : ""}

请从你的角色视角出发，给出你对这个主题的初始观点。
要求：
- 从你的专业角度出发
- 观点要具体，不要泛泛而谈
- 200字以内
- 直接输出观点，不要其他内容`;

    try {
      const opinion = await callAi({
        ...config,
        system: systemPrompt,
        messages: [{ role: "user", content: `请对以下主题发表你的初始观点：\n${topic}` }],
        max_tokens: 500,
        temperature: 0.8,
      });
      return { agent: agent.name, opinion: opinion.trim() };
    } catch {
      return { agent: agent.name, opinion: "（无法生成观点）" };
    }
  });

  return Promise.all(promises);
}

// 生成后续轮次观点
async function generateRoundOpinions(
  topic: string,
  agents: Agent[],
  previousRounds: SimulationRound[],
  config: { apiKey: string; baseUrl: string; model: string; provider: string }
): Promise<{ agent: string; opinion: string }[]> {
  // 构建上下文：其他角色的观点
  const otherOpinions = previousRounds
    .map((r) => r.opinions.map((o) => `${o.agent}: ${o.opinion}`).join("\n"))
    .join("\n\n");

  const promises = agents.map(async (agent) => {
    const memoryContext = agent.memory.length > 0
      ? `\n你之前的观点：\n${agent.memory.join("\n")}`
      : "";

    const systemPrompt = `你是${agent.name}，一位${agent.role}。

你正在参与一场关于以下主题的多角色推演：
${topic}
${memoryContext}

其他角色的观点：
${otherOpinions}

请基于以上信息，给出你本轮的观点。
要求：
- 回应其他角色的观点（同意/反对/补充）
- 从你的专业角度提出新的见解
- 200字以内
- 直接输出观点，不要其他内容`;

    try {
      const opinion = await callAi({
        ...config,
        system: systemPrompt,
        messages: [{ role: "user", content: "请发表你本轮的观点。" }],
        max_tokens: 500,
        temperature: 0.8,
      });
      return { agent: agent.name, opinion: opinion.trim() };
    } catch {
      return { agent: agent.name, opinion: "（无法生成观点）" };
    }
  });

  return Promise.all(promises);
}

// 生成总结
async function generateConclusion(
  topic: string,
  agents: Agent[],
  rounds: SimulationRound[],
  config: { apiKey: string; baseUrl: string; model: string; provider: string }
): Promise<string> {
  const allOpinions = rounds
    .map((r) => `第${r.round}轮：\n${r.opinions.map((o) => `${o.agent}: ${o.opinion}`).join("\n")}`)
    .join("\n\n");

  const systemPrompt = `你是一位资深的分析师。请综合以下多角色推演的结果，给出最终的推演结论。

主题：${topic}

参与角色：${agents.map((a) => `${a.name}(${a.role})`).join("、")}

推演过程：
${allOpinions}

请给出：
1. 主要共识（大家一致认同的观点）
2. 主要分歧（观点冲突的地方）
3. 关键洞察（最重要的发现）
4. 风险提示（需要注意的问题）
5. 行动建议（基于推演的建议）

要求：
- 综合所有角色的观点
- 突出关键洞察
- 300-500字`;

  try {
    return await callAi({
      ...config,
      system: systemPrompt,
      messages: [{ role: "user", content: "请给出推演结论。" }],
      max_tokens: 1000,
      temperature: 0.5,
    });
  } catch {
    return "无法生成结论";
  }
}

// 主推演函数
export async function runSimulation(
  topic: string,
  seedMaterial: string,
  agentConfigs: { name: string; role: string }[],
  rounds: number,
  userId: string,
  onProgress?: (round: number, total: number, message: string) => void
): Promise<SimulationResult> {
  const config = await getAiConfig(userId);
  if (!config.hasKey) {
    throw new Error("请先配置 AI API Key");
  }

  // 初始化智能体
  const agents: Agent[] = agentConfigs.map((a) => ({
    name: a.name,
    role: a.role,
    memory: [],
  }));

  const simulationRounds: SimulationRound[] = [];

  // 第一轮：初始观点
  onProgress?.(0, rounds, "正在生成初始观点…");
  const initialOpinions = await generateInitialOpinions(topic, seedMaterial, agents, config);

  // 更新智能体记忆
  initialOpinions.forEach((op) => {
    const agent = agents.find((a) => a.name === op.agent);
    if (agent) agent.memory.push(op.opinion);
  });

  simulationRounds.push({
    round: 1,
    opinions: initialOpinions,
    summary: "初始观点",
  });

  // 后续轮次
  for (let i = 1; i < rounds; i++) {
    onProgress?.(i, rounds, `正在推演第 ${i + 1} 轮…`);

    const roundOpinions = await generateRoundOpinions(topic, agents, simulationRounds, config);

    // 更新智能体记忆
    roundOpinions.forEach((op) => {
      const agent = agents.find((a) => a.name === op.agent);
      if (agent) agent.memory.push(op.opinion);
    });

    simulationRounds.push({
      round: i + 1,
      opinions: roundOpinions,
      summary: `第 ${i + 1} 轮`,
    });
  }

  // 生成总结
  onProgress?.(rounds, rounds, "正在生成推演结论…");
  const conclusion = await generateConclusion(topic, agents, simulationRounds, config);

  return {
    topic,
    agents,
    rounds: simulationRounds,
    conclusion,
  };
}
