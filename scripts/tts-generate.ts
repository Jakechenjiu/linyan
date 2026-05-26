import { createDashscopeProvider } from "../src/lib/photon/video-providers/dashscope";
import * as fs from "fs/promises";
import * as path from "path";

const SCRIPT: { text: string; duration: number }[] = [
  { text: "灵砚。四个AI模块，全栈自研。", duration: 3 },
  { text: "先说星图写作。Four-Stage Pipeline：Director Engine 出任务书，Constraint Kernel 锁设定，Human Voice Filter 去AI味，Continuity Memory 管连载。写完一章，AI自动结算事实和伏笔。", duration: 8 },
  { text: "光子发布。接入通义万相 wan2.6-t2v，异步生成加 Qwen-TTS 配音，一句话变脚本变画面变成片。", duration: 6 },
  { text: "灵思笔记。双向链接图谱，知识自动关联。", duration: 3 },
  { text: "万象推演。多Agent辩论框架，交叉验证预测。", duration: 3 },
  { text: "Next.js 16 加 Prisma 7 加 Three.js R3F，全免费，Closed Beta 内测中。", duration: 4 },
  { text: "灵砚。你的AI创作引擎。", duration: 3 },
];

async function main() {
  const provider = createDashscopeProvider(process.env.DASHSCOPE_API_KEY);
  const outDir = path.join(process.cwd(), "public", "tmp", "tts");
  await fs.mkdir(outDir, { recursive: true });

  const audioFiles: string[] = [];

  for (let i = 0; i < SCRIPT.length; i++) {
    const { text } = SCRIPT[i];
    console.log(`[${i + 1}/${SCRIPT.length}] Generating TTS: ${text.slice(0, 30)}...`);

    try {
      const result = await provider.generateVoice(text, { voice: "longxiaoxia_v2" });

      if (result.voiceUrl) {
        // Download the audio
        const resp = await fetch(result.voiceUrl);
        const buffer = Buffer.from(await resp.arrayBuffer());
        const fileName = `tts-${String(i).padStart(2, "0")}.mp3`;
        const filePath = path.join(outDir, fileName);
        await fs.writeFile(filePath, buffer);
        audioFiles.push(filePath);
        console.log(`  -> saved: ${fileName}`);
      } else {
        console.error(`  -> no voiceUrl for line ${i}`);
      }
    } catch (err) {
      console.error(`  -> error: ${err}`);
    }

    // Small delay to avoid rate limiting
    await new Promise((r) => setTimeout(r, 500));
  }

  // Write the file list for ffmpeg concat
  const listContent = audioFiles.map((f) => `file '${f.replace(/\\/g, "/")}'`).join("\n");
  await fs.writeFile(path.join(outDir, "files.txt"), listContent);

  console.log(`\nDone! ${audioFiles.length} audio files generated.`);
  console.log(`Output dir: ${outDir}`);
  console.log(`Concat list: ${path.join(outDir, "files.txt")}`);
}

main().catch(console.error);
