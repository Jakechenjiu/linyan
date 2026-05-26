#!/bin/bash
OUTDIR="E:/lingyan/public/tmp/tts"
mkdir -p "$OUTDIR"

# Clean old files
rm -f "$OUTDIR"/*.mp3 "$OUTDIR"/files.txt

# Generate TTS for each line
echo "=== 第1句 ==="
edge-tts --voice zh-CN-XiaoxiaoNeural --text "灵砚。四个AI模块，全栈自研。" --write-media "$OUTDIR/01.mp3"

echo "=== 第2句 ==="
edge-tts --voice zh-CN-XiaoxiaoNeural --text "先说星图写作。Four-Stage Pipeline：Director Engine 出任务书，Constraint Kernel 锁设定，Human Voice Filter 去AI味，Continuity Memory 管连载。写完一章，AI自动结算事实和伏笔。" --write-media "$OUTDIR/02.mp3"

echo "=== 第3句 ==="
edge-tts --voice zh-CN-XiaoxiaoNeural --text "光子发布。接入通义万相 wan2.6-t2v，异步生成加 Qwen-TTS 配音，一句话变脚本变画面变成片。" --write-media "$OUTDIR/03.mp3"

echo "=== 第4句 ==="
edge-tts --voice zh-CN-XiaoxiaoNeural --text "灵思笔记。双向链接图谱，知识自动关联。" --write-media "$OUTDIR/04.mp3"

echo "=== 第5句 ==="
edge-tts --voice zh-CN-XiaoxiaoNeural --text "万象推演。多Agent辩论框架，交叉验证预测。" --write-media "$OUTDIR/05.mp3"

echo "=== 第6句 ==="
edge-tts --voice zh-CN-XiaoxiaoNeural --text "Next.js 16 加 Prisma 7 加 Three.js R3F，全免费，Closed Beta 内测中。" --write-media "$OUTDIR/06.mp3"

echo "=== 第7句 ==="
edge-tts --voice zh-CN-XiaoxiaoNeural --text "灵砚。你的AI创作引擎。" --write-media "$OUTDIR/07.mp3"

echo "=== 完成 ==="
ls -la "$OUTDIR"/*.mp3
