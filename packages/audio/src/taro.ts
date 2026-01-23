import Taro from '@tarojs/taro';
import { AudioRecorder, AudioPlayer } from '@toffee/core';
import { AudioAdapter } from './interface';

class TaroAudioRecorder implements AudioRecorder {
  private recorderManager: Taro.RecorderManager | null = null;
  private isRecordingFlag: boolean = false;
  private resolveStop: ((value: Blob) => void) | null = null;
  private rejectStop: ((error: Error) => void) | null = null;

  async start(): Promise<void> {
    try {
      // 请求录音权限
      await Taro.authorize({ scope: 'scope.record' });
    } catch (error) {
      // 如果用户拒绝，尝试打开设置
      try {
        await Taro.openSetting();
      } catch (e) {
        // 忽略设置打开错误
      }
      throw new Error('录音权限被拒绝');
    }

    this.recorderManager = Taro.getRecorderManager();
    this.isRecordingFlag = false;

    return new Promise((resolve, reject) => {
      if (!this.recorderManager) {
        reject(new Error('Recorder manager not initialized'));
        return;
      }

      this.recorderManager.onStart(() => {
        this.isRecordingFlag = true;
        resolve();
      });

      this.recorderManager.onError((error) => {
        this.isRecordingFlag = false;
        reject(new Error(`Recording error: ${error.errMsg}`));
      });

      // 小程序录音格式：mp3 或 aac
      this.recorderManager.start({
        duration: 60000, // 最长60秒
        sampleRate: 16000,
        numberOfChannels: 1,
        encodeBitRate: 96000,
        format: 'mp3', // 或 'aac'
        frameSize: 50
      });
    });
  }

  async stop(): Promise<Blob> {
    return new Promise((resolve, reject) => {
      if (!this.recorderManager || !this.isRecordingFlag) {
        reject(new Error('Recorder not started'));
        return;
      }

      this.resolveStop = resolve;
      this.rejectStop = reject;

      this.recorderManager.onStop((res) => {
        this.isRecordingFlag = false;
        
        // 小程序返回的是临时文件路径，需要读取为 Blob
        const fs = Taro.getFileSystemManager();
        fs.readFile({
          filePath: res.tempFilePath,
          success: (readRes) => {
            // 将 ArrayBuffer 转换为 Blob
            const blob = new Blob([readRes.data as ArrayBuffer], { type: 'audio/mp3' });
            if (this.resolveStop) {
              this.resolveStop(blob);
            }
          },
          fail: (readError) => {
            if (this.rejectStop) {
              this.rejectStop(new Error(`Failed to read file: ${readError.errMsg}`));
            }
          }
        });
      });

      this.recorderManager.stop();
    });
  }

  isRecording(): boolean {
    return this.isRecordingFlag;
  }
}

class TaroAudioPlayer implements AudioPlayer {
  private audioContext: Taro.InnerAudioContext | null = null;

  async play(blob: Blob): Promise<void> {
    return new Promise((resolve, reject) => {
      // 将 Blob 转换为临时文件路径
      // 小程序需要先写入到临时目录
      const arrayBufferPromise = blob.arrayBuffer();
      
      arrayBufferPromise.then((arrayBuffer) => {
        const fs = Taro.getFileSystemManager();
        // 使用临时文件路径（小程序会自动管理）
        // 使用 wx.env.USER_DATA_PATH 或直接使用临时目录
        const userDataPath = (Taro.env && (Taro.env as any).USER_DATA_PATH) || '';
        const tempFilePath = userDataPath 
          ? `${userDataPath}/temp_audio_${Date.now()}.mp3`
          : `temp_audio_${Date.now()}.mp3`;
        
        // 写入临时文件
        fs.writeFile({
          filePath: tempFilePath,
          data: arrayBuffer,
          success: () => {
            // 创建音频上下文并播放
            this.audioContext = Taro.createInnerAudioContext();
            this.audioContext.src = tempFilePath;
            this.audioContext.autoplay = true;
            
            this.audioContext.onPlay(() => {
              // 播放开始
            });
            
            this.audioContext.onEnded(() => {
              // 播放结束，清理
              if (this.audioContext) {
                this.audioContext.destroy();
                this.audioContext = null;
              }
              // 删除临时文件
              try {
                fs.unlinkSync(tempFilePath);
              } catch (e) {
                // 忽略删除错误
              }
              resolve();
            });
            
            this.audioContext.onError((error) => {
              if (this.audioContext) {
                this.audioContext.destroy();
                this.audioContext = null;
              }
              try {
                fs.unlinkSync(tempFilePath);
              } catch (e) {
                // 忽略删除错误
              }
              reject(new Error(`Playback error: ${error.errMsg}`));
            });
          },
          fail: (writeError) => {
            reject(new Error(`Failed to write file: ${writeError.errMsg}`));
          }
        });
      }).catch((error) => {
        reject(new Error(`Failed to read blob: ${error}`));
      });
    });
  }

  async getDuration(blob: Blob): Promise<number> {
    return new Promise((resolve, reject) => {
      const arrayBufferPromise = blob.arrayBuffer();
      
      arrayBufferPromise.then((arrayBuffer) => {
        const fs = Taro.getFileSystemManager();
        const userDataPath = (Taro.env && (Taro.env as any).USER_DATA_PATH) || '';
        const tempFilePath = userDataPath 
          ? `${userDataPath}/temp_audio_${Date.now()}.mp3`
          : `temp_audio_${Date.now()}.mp3`;
        
        fs.writeFile({
          filePath: tempFilePath,
          data: arrayBuffer,
          success: () => {
            const audioContext = Taro.createInnerAudioContext();
            audioContext.src = tempFilePath;
            
            audioContext.onCanplay(() => {
              const duration = audioContext.duration;
              audioContext.destroy();
              
              // 删除临时文件
              try {
                fs.unlinkSync(tempFilePath);
              } catch (e) {
                // 忽略删除错误
              }
              
              if (duration && duration > 0) {
                resolve(duration);
              } else {
                reject(new Error('Failed to get audio duration'));
              }
            });
            
            audioContext.onError((error) => {
              audioContext.destroy();
              try {
                fs.unlinkSync(tempFilePath);
              } catch (e) {
                // 忽略删除错误
              }
              reject(new Error(`Failed to load audio: ${error.errMsg}`));
            });
          },
          fail: (writeError) => {
            reject(new Error(`Failed to write file: ${writeError.errMsg}`));
          }
        });
      }).catch((error) => {
        reject(new Error(`Failed to read blob: ${error}`));
      });
    });
  }
}

export const taroAudioAdapter: AudioAdapter = {
  createRecorder: () => new TaroAudioRecorder(),
  createPlayer: () => new TaroAudioPlayer(),
};

