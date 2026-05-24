export interface VideoGenerateParams {
  prompt: string;
  duration: number;
  style?: string;
  resolution?: string;
}

export interface TaskResult {
  taskId: string;
}

export interface TaskStatus {
  status: "pending" | "running" | "completed" | "failed";
  videoUrl?: string;
  error?: string;
}

export interface VoiceResult {
  voiceUrl: string;
}

export interface VideoProvider {
  name: string;
  generateVideo(params: VideoGenerateParams): Promise<TaskResult>;
  pollTask(taskId: string): Promise<TaskStatus>;
  generateVoice(text: string, options?: { voice?: string; rate?: number }): Promise<VoiceResult>;
  isAvailable(): Promise<boolean>;
}
