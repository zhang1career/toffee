import { AudioRecorder, AudioPlayer } from '@zhang1career/core';
import { AudioAdapter } from './interface';

class WebAudioRecorder implements AudioRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private stream: MediaStream | null = null;
  private chunks: Blob[] = [];

  async start(): Promise<void> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.stream = stream;
      
      // 尝试使用支持的 MIME 类型
      const mimeTypes = ['audio/webm', 'audio/webm;codecs=opus', 'audio/ogg;codecs=opus', 'audio/mp4'];
      let selectedMimeType = '';
      
      for (const mimeType of mimeTypes) {
        if (MediaRecorder.isTypeSupported(mimeType)) {
          selectedMimeType = mimeType;
          break;
        }
      }

      this.mediaRecorder = new MediaRecorder(stream, {
        mimeType: selectedMimeType || undefined,
      });

      this.chunks = [];
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.chunks.push(event.data);
        }
      };

      this.mediaRecorder.start();
    } catch (error) {
      throw new Error(`Failed to start recording: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async stop(): Promise<Blob> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder) {
        reject(new Error('Recorder not started'));
        return;
      }

      this.mediaRecorder.onstop = () => {
        const blob = new Blob(this.chunks, { type: this.mediaRecorder?.mimeType || 'audio/webm' });
        this.cleanup();
        resolve(blob);
      };

      this.mediaRecorder.onerror = (_event) => {
        this.cleanup();
        reject(new Error('Recording error'));
      };

      this.mediaRecorder.stop();
    });
  }

  isRecording(): boolean {
    return this.mediaRecorder?.state === 'recording';
  }

  private cleanup(): void {
    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());
      this.stream = null;
    }
    this.mediaRecorder = null;
    this.chunks = [];
  }
}

class WebAudioPlayer implements AudioPlayer {
  private currentAudio: HTMLAudioElement | null = null;
  private isPlayingState: boolean = false;

  async play(blob: Blob): Promise<void> {
    return new Promise((resolve, reject) => {
      // 如果正在播放，先停止当前播放
      if (this.currentAudio && !this.currentAudio.paused) {
        this.currentAudio.pause();
        this.currentAudio.currentTime = 0;
      }

      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      this.currentAudio = audio;
      this.isPlayingState = true;

      audio.onended = () => {
        URL.revokeObjectURL(url);
        this.isPlayingState = false;
        this.currentAudio = null;
        resolve();
      };

      audio.onerror = () => {
        URL.revokeObjectURL(url);
        this.isPlayingState = false;
        this.currentAudio = null;
        reject(new Error('Failed to play audio'));
      };

      audio.play().catch((error) => {
        URL.revokeObjectURL(url);
        this.isPlayingState = false;
        this.currentAudio = null;
        reject(error);
      });
    });
  }

  async getDuration(blob: Blob): Promise<number> {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);

      audio.onloadedmetadata = () => {
        const duration = audio.duration;
        URL.revokeObjectURL(url);
        resolve(duration);
      };

      audio.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Failed to load audio metadata'));
      };
    });
  }

  isPlaying(): boolean {
    return this.isPlayingState && this.currentAudio !== null && !this.currentAudio.paused;
  }

  async stop(): Promise<void> {
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.currentTime = 0;
      this.isPlayingState = false;
      this.currentAudio = null;
    }
  }
}

export const webAudioAdapter: AudioAdapter = {
  createRecorder: () => new WebAudioRecorder(),
  createPlayer: () => new WebAudioPlayer(),
};

