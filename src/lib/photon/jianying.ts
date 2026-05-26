import { randomUUID } from "crypto";

function uid(): string {
  return randomUUID();
}

function us(seconds: number): number {
  return Math.round(seconds * 1_000_000);
}

interface JYVideoMaterial {
  id: string;
  path: string;
  duration: number;
  width: number;
  height: number;
  fps: number;
  type: "video";
}

interface JYAudioMaterial {
  id: string;
  path: string;
  duration: number;
  type: "audio";
}

interface JYTransition {
  id: string;
  name: string;
  duration: number;
  type: "transition";
}

interface JYTextStyle {
  id: string;
  font: string;
  font_size: number;
  color: string;
  bold: boolean;
  align: number; // 0=left, 2=center
  position: { x: number; y: number };
  type: "text";
}

interface JYSegment {
  id: string;
  source_id: string;
  target_timerange: { start: number; duration: number };
  source_timerange: { start: number; duration: number };
  speed: number;
  volume: number;
  // video-specific
  clip?: { alpha: number; flip_horizontal: boolean };
  // text-specific
  content?: string;
  style_id?: string;
}

interface JYTrack {
  id: string;
  type: "video" | "audio" | "text";
  segments: JYSegment[];
  is_muted: boolean;
  is_visible: boolean;
}

interface DraftContent {
  platform: { os: "windows" | "mac" };
  tracks: JYTrack[];
  materials: {
    videos: JYVideoMaterial[];
    audios: JYAudioMaterial[];
    texts: JYTextStyle[];
    transitions: JYTransition[];
  };
}

interface DraftInfo {
  platform: { os: "windows" | "mac" };
  version: string;
  name: string;
  width: number;
  height: number;
  fps: number;
  is_auto_save: boolean;
}

export interface ClipInput {
  scriptText: string;
  visualPrompt: string;
  duration: number;
  clipUrl?: string | null;
  voiceUrl?: string | null;
}

export class JianyingDraftBuilder {
  private name: string;
  private width: number;
  private height: number;
  private fps: number;
  private videoSegments: JYSegment[] = [];
  private audioSegments: JYSegment[] = [];
  private textSegments: JYSegment[] = [];
  private videoMaterials: JYVideoMaterial[] = [];
  private audioMaterials: JYAudioMaterial[] = [];
  private textStyles: JYTextStyle[] = [];
  private transitions: JYTransition[] = [];
  private currentTime: number = 0; // microseconds
  private defaultTextStyleId: string;

  constructor(name: string, width = 1080, height = 1920, fps = 30) {
    this.name = name;
    this.width = width;
    this.height = height;
    this.fps = fps;

    this.defaultTextStyleId = uid();
    this.textStyles.push({
      id: this.defaultTextStyleId,
      font: "Microsoft YaHei",
      font_size: 48,
      color: "#ffffff",
      bold: true,
      align: 2, // center
      position: { x: 0.5, y: 0.85 },
      type: "text",
    });
  }

  addVideoClip(input: ClipInput, transitionUs = 500_000): this {
    const matId = uid();
    const durationUs = us(input.duration);

    if (input.clipUrl) {
      this.videoMaterials.push({
        id: matId,
        path: input.clipUrl.startsWith("file://") ? input.clipUrl : `file:///${input.clipUrl.replace(/\\/g, "/")}`,
        duration: durationUs,
        width: this.width,
        height: this.height,
        fps: this.fps,
        type: "video",
      });
    } else {
      // Placeholder: a black still "video" — user replaces in Jianying
      this.videoMaterials.push({
        id: matId,
        path: "placeholder",
        duration: durationUs,
        width: this.width,
        height: this.height,
        fps: this.fps,
        type: "video",
      });
    }

    this.videoSegments.push({
      id: uid(),
      source_id: matId,
      target_timerange: { start: this.currentTime, duration: durationUs },
      source_timerange: { start: 0, duration: durationUs },
      speed: 1.0,
      volume: 1.0,
    });

    this.currentTime += durationUs;

    // Add transition after this clip (except last)
    if (transitionUs > 0) {
      const trId = uid();
      this.transitions.push({
        id: trId,
        name: "fade",
        duration: transitionUs,
        type: "transition",
      });
      this.videoSegments.push({
        id: uid(),
        source_id: trId,
        target_timerange: { start: this.currentTime, duration: transitionUs },
        source_timerange: { start: 0, duration: transitionUs },
        speed: 1.0,
        volume: 0,
      });
      this.currentTime += transitionUs;
    }

    return this;
  }

  addAudioClip(input: ClipInput, startUs?: number): this {
    if (!input.voiceUrl) return this;

    const matId = uid();
    const durationUs = us(input.duration);

    this.audioMaterials.push({
      id: matId,
      path: input.voiceUrl.startsWith("file://") ? input.voiceUrl : `file:///${input.voiceUrl.replace(/\\/g, "/")}`,
      duration: durationUs,
      type: "audio",
    });

    const actualStart = startUs ?? 0;
    this.audioSegments.push({
      id: uid(),
      source_id: matId,
      target_timerange: { start: actualStart, duration: durationUs },
      source_timerange: { start: 0, duration: durationUs },
      speed: 1.0,
      volume: 1.0,
    });

    return this;
  }

  addSubtitle(text: string, startUs: number, durationUs: number): this {
    this.textSegments.push({
      id: uid(),
      source_id: this.defaultTextStyleId,
      target_timerange: { start: startUs, duration: durationUs },
      source_timerange: { start: 0, duration: durationUs },
      speed: 1.0,
      volume: 0,
      content: text,
      style_id: this.defaultTextStyleId,
    });
    return this;
  }

  addSubtitlesForClips(clips: ClipInput[]): this {
    let time = 0;
    for (const clip of clips) {
      const durUs = us(clip.duration);
      this.addSubtitle(clip.scriptText, time, durUs);
      time += durUs;
    }
    return this;
  }

  addAudioForClips(clips: ClipInput[]): this {
    let time = 0;
    for (const clip of clips) {
      if (clip.voiceUrl) {
        this.addAudioClip(clip, time);
      }
      time += us(clip.duration);
    }
    return this;
  }

  getDraftInfo(): DraftInfo {
    return {
      platform: { os: "windows" },
      version: "7.0.0",
      name: this.name,
      width: this.width,
      height: this.height,
      fps: this.fps,
      is_auto_save: false,
    };
  }

  getDraftContent(): DraftContent {
    const tracks: JYTrack[] = [];

    if (this.videoSegments.length > 0) {
      tracks.push({
        id: uid(),
        type: "video",
        segments: this.videoSegments,
        is_muted: false,
        is_visible: true,
      });
    }

    if (this.audioSegments.length > 0) {
      tracks.push({
        id: uid(),
        type: "audio",
        segments: this.audioSegments,
        is_muted: false,
        is_visible: true,
      });
    }

    if (this.textSegments.length > 0) {
      tracks.push({
        id: uid(),
        type: "text",
        segments: this.textSegments,
        is_muted: false,
        is_visible: true,
      });
    }

    return {
      platform: { os: "windows" },
      tracks,
      materials: {
        videos: this.videoMaterials,
        audios: this.audioMaterials,
        texts: this.textStyles,
        transitions: this.transitions,
      },
    };
  }

  build(): { draftInfo: DraftInfo; draftContent: DraftContent } {
    return {
      draftInfo: this.getDraftInfo(),
      draftContent: this.getDraftContent(),
    };
  }
}
