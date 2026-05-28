import { prisma } from "@/lib/db";

// Auto-ingest novel data into notes
export async function ingestNovelToNotes(novelId: string, userId: string) {
  const novel = await prisma.novel.findUnique({
    where: { id: novelId },
    include: {
      characters: true,
      worldSetting: true,
      chapters: { orderBy: { order: "asc" }, select: { id: true, title: true, body: true, wordCount: true, order: true } },
    },
  });

  if (!novel) return;

  const results = { created: 0, updated: 0, links: 0 };

  // 1. Create/update novel overview note
  const overviewTitle = `📖 ${novel.title} — 作品概览`;
  const overviewBody = [
    `# ${novel.title}`,
    "",
    `**类型**: ${novel.genre || "未分类"}`,
    `**状态**: ${novel.status}`,
    `**简介**: ${novel.synopsis || "暂无"}`,
    `**总字数**: ${novel.chapters.reduce((s, c) => s + c.wordCount, 0)}`,
    `**章节数**: ${novel.chapters.length}`,
    "",
    "## 章节目录",
    ...novel.chapters.map((ch, i) => `${i + 1}. ${ch.title} (${ch.wordCount}字)`),
    "",
    `> 由灵砚自动归纳 · ${new Date().toLocaleDateString("zh-CN")}`,
  ].join("\n");

  const overviewNote = await upsertNote(overviewTitle, overviewBody, ["小说", "自动归纳", novel.genre || ""], userId, `novel:${novelId}:overview`);
  if (overviewNote.created) results.created++;
  else results.updated++;

  // 2. Create/update character notes
  for (const char of novel.characters) {
    const charTitle = `👤 ${char.name}`;
    const roleLabels: Record<string, string> = {
      protagonist: "主角", antagonist: "反派", love_interest: "感情线",
      mentor: "导师", supporting: "配角",
    };
    const charBody = [
      `# ${char.name}`,
      "",
      `**角色**: ${roleLabels[char.role] || char.role}`,
      char.tagline ? `**称号**: ${char.tagline}` : "",
      char.personality ? `**性格**: ${char.personality}` : "",
      char.desire ? `**欲望**: ${char.desire}` : "",
      char.flaw ? `**缺陷**: ${char.flaw}` : "",
      char.goldenFinger ? `**金手指**: ${char.goldenFinger}` : "",
      "",
      `出自: [[${overviewTitle}]]`,
      "",
      `> 由灵砚自动归纳 · ${new Date().toLocaleDateString("zh-CN")}`,
    ].filter(Boolean).join("\n");

    const charNote = await upsertNote(charTitle, charBody, ["角色", "自动归纳", novel.title], userId, `character:${novelId}:${char.id}`);
    if (charNote.created) results.created++;
    else results.updated++;

    // Link character to overview
    if (overviewNote.note && charNote.note) {
      await ensureLink(overviewNote.note.id, charNote.note.id);
      results.links++;
    }
  }

  // 3. Create world setting note
  if (novel.worldSetting) {
    const ws = novel.worldSetting;
    const wsTitle = `🌍 ${novel.title} — 世界观`;
    const wsBody = [
      `# ${novel.title} 世界观`,
      "",
      ws.worldType ? `**世界类型**: ${ws.worldType}` : "",
      ws.scale ? `**规模**: ${ws.scale}` : "",
      ws.powerSystem ? `## 力量体系\n${ws.powerSystem}` : "",
      ws.geography ? `## 地理\n${ws.geography}` : "",
      ws.factions ? `## 势力\n${ws.factions}` : "",
      ws.rules ? `## 世界规则\n${ws.rules}` : "",
      "",
      `出自: [[${overviewTitle}]]`,
      "",
      `> 由灵砚自动归纳 · ${new Date().toLocaleDateString("zh-CN")}`,
    ].filter(Boolean).join("\n");

    const wsNote = await upsertNote(wsTitle, wsBody, ["世界观", "自动归纳", novel.title], userId, `worldsetting:${novelId}`);
    if (wsNote.created) results.created++;
    else results.updated++;

    if (overviewNote.note && wsNote.note) {
      await ensureLink(overviewNote.note.id, wsNote.note.id);
      results.links++;
    }
  }

  // 4. Create chapter summary notes (only for chapters with significant content)
  for (const ch of novel.chapters) {
    if (ch.body.length < 200) continue; // Skip very short chapters

    const chTitle = `📝 ${novel.title} · ${ch.title}`;
    const chBody = [
      `# ${ch.title}`,
      "",
      `**字数**: ${ch.wordCount}`,
      `**位置**: 第${ch.order}章`,
      "",
      "## 内容摘要",
      ch.body.slice(0, 500) + (ch.body.length > 500 ? "…" : ""),
      "",
      `出自: [[${overviewTitle}]]`,
      "",
      `> 由灵砚自动归纳 · ${new Date().toLocaleDateString("zh-CN")}`,
    ].join("\n");

    const chNote = await upsertNote(chTitle, chBody, ["章节", "自动归纳", novel.title], userId, `chapter:${novelId}:${ch.id}`);
    if (chNote.created) results.created++;
    else results.updated++;

    if (overviewNote.note && chNote.note) {
      await ensureLink(overviewNote.note.id, chNote.note.id);
      results.links++;
    }
  }

  return results;
}

// Auto-ingest content to notes
export async function ingestContentToNotes(contentId: string, userId: string) {
  const content = await prisma.content.findUnique({
    where: { id: contentId },
  });

  if (!content) return;

  const platformLabels: Record<string, string> = {
    wechat: "公众号", xiaohongshu: "小红书", douyin: "抖音",
    weibo: "微博", zhihu: "知乎", bilibili: "B站",
  };

  const noteTitle = `📄 ${content.title || "无标题"} (${platformLabels[content.platform] || content.platform})`;
  const noteBody = [
    `# ${content.title || "无标题"}`,
    "",
    `**平台**: ${platformLabels[content.platform] || content.platform}`,
    `**字数**: ${content.wordCount}`,
    `**状态**: ${content.status === "published" ? "已发布" : "草稿"}`,
    "",
    "## 内容",
    content.body.slice(0, 1000) + (content.body.length > 1000 ? "…" : ""),
    "",
    `> 由灵砚自动归纳 · ${new Date().toLocaleDateString("zh-CN")}`,
  ].join("\n");

  const result = await upsertNote(noteTitle, noteBody, ["内容", "自动归纳", content.platform], userId, `content:${contentId}`);
  return { created: result.created ? 1 : 0, updated: result.created ? 0 : 1 };
}

// Helper: upsert note by external key (stored in tags)
async function upsertNote(
  title: string,
  body: string,
  tags: string[],
  userId: string,
  externalKey: string
): Promise<{ note: { id: string } | null; created: boolean }> {
  const cleanTags = tags.filter(Boolean);
  const tagJson = JSON.stringify(cleanTags);

  // Check if note with this external key exists
  const existing = await prisma.note.findFirst({
    where: {
      userId,
      tags: { contains: externalKey },
    },
    select: { id: true },
  });

  if (existing) {
    await prisma.note.update({
      where: { id: existing.id },
      data: { title, body, tags: tagJson },
    });
    return { note: existing, created: false };
  }

  const note = await prisma.note.create({
    data: { title, body, tags: tagJson, userId },
  });
  return { note, created: true };
}

// Helper: ensure bidirectional link exists
async function ensureLink(fromId: string, toId: string) {
  const existing = await prisma.noteLink.findFirst({
    where: { fromId, toId },
  });

  if (!existing) {
    await prisma.noteLink.create({
      data: { fromId, toId },
    });
  }
}
