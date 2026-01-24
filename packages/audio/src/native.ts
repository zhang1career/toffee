import { AudioRecorder, AudioPlayer } from '@zhang1career/core';
import { AudioAdapter } from './interface';
import AudioRecorderPlayer from 'react-native-audio-recorder-player';
import RNFS from 'react-native-fs';
import Sound from 'react-native-sound';

// React Native 兼容的 base64 解码函数（替代 atob）
function base64Decode(base64: string): Uint8Array {
  // 移除可能存在的 data URL 前缀
  const base64Data = base64.replace(/^data:[^;]*;base64,/, '').replace(/\s/g, '');
  
  // Base64 字符表
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  const lookup = new Uint8Array(256);
  for (let i = 0; i < chars.length; i++) {
    lookup[chars.charCodeAt(i)] = i;
  }
  
  // 计算输出缓冲区大小（考虑填充）
  let padding = 0;
  if (base64Data.length > 0) {
    if (base64Data[base64Data.length - 1] === '=') padding++;
    if (base64Data[base64Data.length - 2] === '=') padding++;
  }
  const bufferLength = Math.floor((base64Data.length * 3) / 4) - padding;
  const bytes = new Uint8Array(bufferLength);
  
  let p = 0;
  for (let i = 0; i < base64Data.length; i += 4) {
    const encoded1 = lookup[base64Data.charCodeAt(i)] ?? 0;
    const encoded2 = lookup[base64Data.charCodeAt(i + 1)] ?? 0;
    const encoded3 = lookup[base64Data.charCodeAt(i + 2)] ?? 0;
    const encoded4 = lookup[base64Data.charCodeAt(i + 3)] ?? 0;
    
    if (p < bytes.length) bytes[p++] = (encoded1 << 2) | (encoded2 >> 4);
    if (p < bytes.length) bytes[p++] = ((encoded2 & 15) << 4) | (encoded3 >> 2);
    if (p < bytes.length) bytes[p++] = ((encoded3 & 3) << 6) | (encoded4 & 63);
  }
  
  return bytes;
}

// React Native 兼容的 base64 编码函数（替代 btoa）
function base64Encode(bytes: Uint8Array): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  let result = '';
  
  for (let i = 0; i < bytes.length; i += 3) {
    const byte1 = bytes[i];
    const byte2 = bytes[i + 1] || 0;
    const byte3 = bytes[i + 2] || 0;
    
    const bitmap = (byte1 << 16) | (byte2 << 8) | byte3;
    
    result += chars.charAt((bitmap >> 18) & 63);
    result += chars.charAt((bitmap >> 12) & 63);
    result += i + 1 < bytes.length ? chars.charAt((bitmap >> 6) & 63) : '=';
    result += i + 2 < bytes.length ? chars.charAt(bitmap & 63) : '=';
  }
  
  return result;
}

class NativeAudioRecorder implements AudioRecorder {
  private audioRecorderPlayer: AudioRecorderPlayer;
  private recordingPath: string | null = null;
  private isRecordingState: boolean = false;
  private recordListener: ((e: any) => void) | null = null;
  static lastRecordingFilePath: string | null = null; // 静态属性：保存最后一次录音的文件路径
  static shouldUseFilePath: boolean = false; // 静态标志：是否应该使用文件路径（检测到 Blob bug）

  constructor() {
    this.audioRecorderPlayer = new AudioRecorderPlayer();
  }

  async start(): Promise<void> {
    // 重置标志，准备新的录音
    NativeAudioRecorder.shouldUseFilePath = false;
    NativeAudioRecorder.lastRecordingFilePath = null;
    try {
      const fileName = `recording_${Date.now()}.m4a`;
      // 注意：react-native-audio-recorder-player 在 iOS 上可能将文件保存到 Library/Caches
      // 而不是指定的 Documents 路径，所以使用相对路径让库决定实际保存位置
      const relativePath = fileName;
      
      // 不预设路径，使用库返回的实际路径
      this.recordingPath = null;
      
      // 检查 Documents 目录是否存在
      try {
        const dirExists = await RNFS.exists(RNFS.DocumentDirectoryPath);
        if (!dirExists) {
          await RNFS.mkdir(RNFS.DocumentDirectoryPath);
        }
      } catch (dirError) {
        // 忽略
      }
      
      // 如果之前有录音在进行，先停止它并等待清理完成
      if (this.isRecordingState) {
        try {
          if (this.recordListener) {
            try {
              this.audioRecorderPlayer.removeRecordBackListener();
            } catch (removeError) {
              // 忽略
            }
            this.recordListener = null;
          }
          try {
            await this.audioRecorderPlayer.stopRecorder();
            // 增加等待时间，确保音频会话完全释放（iOS 需要更多时间）
            await new Promise(resolve => setTimeout(resolve, 400));
          } catch (stopError) {
            // 忽略停止错误，但等待更长的清理时间
            await new Promise(resolve => setTimeout(resolve, 400));
          }
        } catch (cleanupError) {
          // 忽略清理错误，但仍等待清理
          await new Promise(resolve => setTimeout(resolve, 400));
        }
        this.isRecordingState = false;
        this.recordingPath = null;
      }
      
      // 即使没有正在进行的录音，也等待一小段时间，确保音频会话处于稳定状态
      // 这对于频繁操作特别重要
      // 优化：从 100ms 减少到 50ms，提升响应速度
      await new Promise(resolve => setTimeout(resolve, 50));
      
      try {
        // 配置录音设置
        try {
          if (typeof (this.audioRecorderPlayer as any).setSubscriptionDuration === 'function') {
            (this.audioRecorderPlayer as any).setSubscriptionDuration(250);
          }
        } catch (configError) {
          // 忽略
        }
        
        // 使用相对路径，让库决定实际保存位置
        // react-native-audio-recorder-player 在 iOS 上通常会将文件保存到 Library/Caches
        // 而不是 Documents，这是库的内部行为，我们需要接受库返回的实际路径
        let result: string | null = null;
        let lastError: Error | null = null;
        
        // 尝试多种路径格式，增加成功率
        const pathAttempts = [
          relativePath, // 尝试1: 相对路径
          `${RNFS.CachesDirectoryPath}/${fileName}`, // 尝试2: Cache 目录
          `${RNFS.DocumentDirectoryPath}/${fileName}`, // 尝试3: Document 目录
        ];
        
        // 添加重试机制，最多重试3次，每次重试前等待更长时间
        const maxRetries = 3;
        
        for (let i = 0; i < pathAttempts.length; i++) {
          let attemptSuccess = false;
          
          for (let retry = 0; retry < maxRetries; retry++) {
            try {
              const attemptPath = pathAttempts[i];
              result = await this.audioRecorderPlayer.startRecorder(attemptPath);
              
              if (result && result !== '') {
                // 成功，跳出所有循环
                attemptSuccess = true;
                break;
              } else {
                throw new Error('Recorder returned empty result');
              }
            } catch (attemptError) {
              lastError = attemptError instanceof Error ? attemptError : new Error(String(attemptError));
              
              const errorMsg = lastError.message.toLowerCase();
              const isStateConflict = 
                errorMsg.includes('audio session') ||
                errorMsg.includes('initiating recorder') ||
                errorMsg.includes('could not start') ||
                errorMsg.includes('failed to start') ||
                errorMsg.includes('busy') ||
                errorMsg.includes('in use');
              
              // 如果是状态冲突错误且还有重试机会，等待后重试
              if (isStateConflict && retry < maxRetries - 1) {
                const waitTime = 200 * (retry + 1); // 递增等待时间：200ms, 400ms, 600ms
                console.log(`   ⚠️  Recording start attempt ${i + 1} failed (retry ${retry + 1}/${maxRetries}), waiting ${waitTime}ms...`);
                await new Promise(resolve => setTimeout(resolve, waitTime));
                continue;
              }
              
              // 如果不是状态冲突，或者已经重试多次，跳出重试循环，尝试下一个路径
              break;
            }
          }
          
          if (attemptSuccess) {
            // 成功，跳出路径尝试循环
            break;
          }
          
          // 如果所有重试都失败，尝试下一个路径
          if (i < pathAttempts.length - 1) {
            console.log(`   ⚠️  Recording path attempt ${i + 1} failed after ${maxRetries} retries, trying next path...`);
            await new Promise(resolve => setTimeout(resolve, 200));
          }
        }
        
        // 如果所有路径和重试都失败，抛出最后一个错误
        if (!result || result === '') {
          if (lastError) {
            throw lastError;
          }
          throw new Error('Recorder returned empty result after all attempts and retries');
        }
        
        // TypeScript 类型保护：确保 result 不为 null
        if (result === null) {
          throw new Error('Recorder failed to start: result is null');
        }
        
        if (!result || result === '') {
          throw new Error('Recorder returned empty result after all attempts');
        }
        
        // 规范化返回的路径，移除重复的分隔符
        result = result.replace(/\/+/g, '/').replace(/^file:\/\/+/, 'file://');
        
        // 使用库返回的实际路径（可能是 Library/Caches 而不是 Documents）
        // 这是正常的，因为库在 iOS 上更倾向于使用 Cache 目录
        this.recordingPath = result;
        this.isRecordingState = true;
        
        // 添加录音监听器以消除警告
        this.recordListener = (_e: any) => {
          // 静默处理
        };
        this.audioRecorderPlayer.addRecordBackListener(this.recordListener);
      } catch (recorderError) {
        this.isRecordingState = false;
        this.recordingPath = null;
        
        const errorMsg = recorderError instanceof Error ? recorderError.message : String(recorderError);
        const errorMsgLower = errorMsg.toLowerCase();
        
        // 权限相关错误 - 优先检查权限问题
        if (errorMsgLower.includes('permission') || 
            errorMsgLower.includes('denied') || 
            errorMsgLower.includes('not authorized') ||
            errorMsgLower.includes('unauthorized') ||
            errorMsgLower.includes('access denied') ||
            errorMsgLower.includes('权限')) {
          throw new Error('麦克风权限被拒绝。请在 iOS 设置 → EchoNative → 麦克风中允许访问。');
        }
        
        // 音频会话错误 - 可能是权限、其他应用占用、系统问题或状态冲突
        if (errorMsgLower.includes('audio session') || 
            errorMsgLower.includes('initiating recorder') ||
            errorMsgLower.includes('error occured during initiating') ||
            errorMsgLower.includes('could not start recording') ||
            errorMsgLower.includes('failed to start')) {
          // 检查是否是状态冲突（频繁操作导致）
          const isStateConflict = 
            errorMsgLower.includes('already') ||
            errorMsgLower.includes('busy') ||
            errorMsgLower.includes('in use') ||
            errorMsgLower.includes('active');
          
          if (isStateConflict) {
            throw new Error('录音器正在使用中，请稍等片刻后重试。如果问题持续，请尝试重启应用。');
          }
          
          // 检查是否可能是权限问题（某些情况下权限错误会表现为初始化错误）
          const isLikelyPermissionIssue = 
            errorMsgLower.includes('cannot') ||
            errorMsgLower.includes('unable') ||
            errorMsgLower.includes('denied') ||
            errorMsgLower.includes('permission');
          
          if (isLikelyPermissionIssue) {
            throw new Error('无法初始化录音器。可能原因：1) 麦克风权限未授予（请前往：设置 → EchoNative → 麦克风） 2) 其他应用正在使用麦克风 3) 系统音频会话问题（请尝试重启应用）');
          } else {
            throw new Error('无法初始化录音器。请检查：1) 麦克风权限是否已授予 2) 是否有其他应用正在使用麦克风 3) 如果使用模拟器，请在真机上测试 4) 尝试重启应用');
          }
        }
        
        throw recorderError;
      }
    } catch (error) {
      this.isRecordingState = false;
      this.recordingPath = null;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to start recording: ${errorMessage}`);
    }
  }

  async stop(): Promise<Blob> {
    if (!this.recordingPath || !this.isRecordingState) {
      return new Blob([], { type: 'audio/m4a' });
    }

    try {
      // 移除录音监听器
      if (this.recordListener) {
        try {
          this.audioRecorderPlayer.removeRecordBackListener();
          this.recordListener = null;
        } catch (removeError) {
          // 忽略
        }
      }
      
      const result = await this.audioRecorderPlayer.stopRecorder();
      this.isRecordingState = false;
      
      let actualFilePath: string | null = null;
      
      // 检查返回值是否是状态消息而不是文件路径
      const statusMessages = ['Already stopped', 'already stopped', 'ALREADY STOPPED', 'stopped', 'STOPPED'];
      if (statusMessages.includes(result) || !result || result.trim() === '') {
        // 录音器已经停止（可能是被之前的取消操作停止的）
        console.warn('[AudioRecorder] Recorder already stopped, result:', result);
        
        // 尝试使用 recordingPath（如果存在）
        if (this.recordingPath) {
          actualFilePath = this.recordingPath.replace(/^file:\/\//, '').replace(/\/+/g, '/');
          console.log('[AudioRecorder] Trying to use recordingPath:', actualFilePath);
          const fileExists = await RNFS.exists(actualFilePath);
          if (!fileExists) {
            // recordingPath 也不存在，返回空 Blob
            console.warn('[AudioRecorder] RecordingPath also does not exist, returning empty blob');
            return new Blob([], { type: 'audio/m4a' });
          }
          // 使用 recordingPath 继续处理
          console.log('[AudioRecorder] Using recordingPath:', actualFilePath);
        } else {
          // 没有 recordingPath，返回空 Blob
          console.warn('[AudioRecorder] No recordingPath available, returning empty blob');
          return new Blob([], { type: 'audio/m4a' });
        }
      } else {
        // 处理返回的路径，移除 file:// 前缀
        actualFilePath = result.replace(/^file:\/\//, '');
      
        // 规范化路径：移除重复的分隔符和多余的路径部分
        // 如果路径看起来像是绝对路径被错误拼接，尝试提取正确的部分
        actualFilePath = actualFilePath.replace(/\/+/g, '/'); // 移除重复的分隔符
        
        // 检查路径是否包含重复的绝对路径（例如：/path/to/Library/Caches//path/to/Documents/file.m4a）
        const pathParts = actualFilePath.split('/');
        const duplicateAbsolutePathIndex = pathParts.findIndex((part, index) => {
          // 查找可能的重复绝对路径开始位置（通常在 Library/Caches 或 Documents 之后）
          return index > 0 && 
                 (part === 'Library' || part === 'Documents' || part === 'Caches') &&
                 pathParts[index - 1] === '';
        });
        
        if (duplicateAbsolutePathIndex > 0) {
          // 发现重复的绝对路径，使用后面的部分（通常是正确的）
          console.warn('[AudioRecorder] Detected duplicate absolute path, using correct part');
          actualFilePath = '/' + pathParts.slice(duplicateAbsolutePathIndex).join('/');
        }
        
        // 再次规范化路径
        actualFilePath = actualFilePath.replace(/\/+/g, '/');
        
        console.log('[AudioRecorder] Normalized file path:', actualFilePath);
        
        const fileExists = await RNFS.exists(actualFilePath);
        if (!fileExists) {
          // 如果文件不存在，尝试使用 recordingPath（如果存在）
          if (this.recordingPath) {
            const altPath = this.recordingPath.replace(/^file:\/\//, '').replace(/\/+/g, '/');
            console.log('[AudioRecorder] Trying alternative path:', altPath);
            const altExists = await RNFS.exists(altPath);
            if (altExists) {
              actualFilePath = altPath;
              console.log('[AudioRecorder] Using alternative path:', actualFilePath);
            } else {
              // 两个路径都不存在，返回空 Blob 而不是抛出错误（频繁点击时的正常情况）
              console.warn('[AudioRecorder] Both paths do not exist, returning empty blob:', {
                resultPath: actualFilePath,
                altPath: altPath
              });
              return new Blob([], { type: 'audio/m4a' });
            }
          } else {
            // 没有 recordingPath，返回空 Blob 而不是抛出错误
            console.warn('[AudioRecorder] File does not exist and no recordingPath, returning empty blob:', actualFilePath);
            return new Blob([], { type: 'audio/m4a' });
          }
        }
      }
      
      // 此时 actualFilePath 应该已经确定
      if (!actualFilePath) {
        console.warn('[AudioRecorder] No valid file path, returning empty blob');
        return new Blob([], { type: 'audio/m4a' });
      }
      
      const fileInfo = await RNFS.stat(actualFilePath);
      if (fileInfo.size === 0) {
        throw new Error('Recorded file is empty (0 bytes) - recording may have failed');
      }
      
      const fileData = await RNFS.readFile(actualFilePath, 'base64');
      if (!fileData || fileData.length === 0) {
        throw new Error('Failed to read file data - file may be corrupted');
      }
      
      const byteArray = base64Decode(fileData);
      
      if (byteArray.length !== fileInfo.size) {
        throw new Error(`Base64 decoding failed: decoded size (${byteArray.length}) does not match file size (${fileInfo.size})`);
      }
      
      // 保存文件路径到静态属性，供播放时使用
      NativeAudioRecorder.lastRecordingFilePath = actualFilePath;
      
      const arrayBuffer = new ArrayBuffer(byteArray.length);
      const view = new Uint8Array(arrayBuffer);
      view.set(byteArray);
      
      let blob: Blob;
      try {
        blob = new Blob([arrayBuffer], { type: 'audio/m4a' });
      } catch (e) {
        // 如果 ArrayBuffer 失败，创建新的 Uint8Array
        const newArray = new Uint8Array(byteArray.length);
        newArray.set(byteArray);
        blob = new Blob([newArray.buffer], { type: 'audio/m4a' });
      }
      
      // 验证 Blob 大小，如果无效则使用文件路径
      if (blob.size !== fileInfo.size) {
        if (blob.size === fileData.length) {
          // React Native Blob bug: 包含 base64 字符串而不是二进制数据
          NativeAudioRecorder.shouldUseFilePath = true;
        } else {
          NativeAudioRecorder.shouldUseFilePath = true;
        }
      }
      
      this.recordingPath = null;
      return blob;
    } catch (error) {
      this.isRecordingState = false;
      this.recordingPath = null;
      throw new Error(`Failed to stop recording: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  isRecording(): boolean {
    return this.isRecordingState;
  }
}

class NativeAudioPlayer implements AudioPlayer {
  private audioRecorderPlayer: AudioRecorderPlayer;
  private playbackListener: ((e: any) => void) | null = null;
  private isPlayingState: boolean = false;

  constructor() {
    // 使用独立的播放器实例，避免与录音器冲突
    this.audioRecorderPlayer = new AudioRecorderPlayer();
    // 设置订阅间隔，确保监听器能正常工作
    try {
      if (typeof (this.audioRecorderPlayer as any).setSubscriptionDuration === 'function') {
        (this.audioRecorderPlayer as any).setSubscriptionDuration(250);
      }
    } catch (e) {
      // 忽略，某些版本可能不支持
    }
  }

  async play(blob: Blob): Promise<void> {
    return new Promise(async (resolve, reject) => {
      let tempPath: string | null = null;
      
      try {
        const lastRecordingFilePath = NativeAudioRecorder.lastRecordingFilePath;
        const shouldUseFilePath = NativeAudioRecorder.shouldUseFilePath;
        const useFilePath = shouldUseFilePath && lastRecordingFilePath;
        
        if (useFilePath) {
          // 使用文件路径播放
          await this.playFromFilePath(lastRecordingFilePath);
          resolve();
          return;
        } else if (lastRecordingFilePath) {
          // 文件路径存在但标志未设置，也尝试使用文件路径
          try {
            await this.playFromFilePath(lastRecordingFilePath);
            resolve();
            return;
          } catch (fallbackError) {
            // 继续使用 Blob 方式
          }
        }
        
        // 将 Blob 转换为 base64
        let base64Data: string;
        
        if (typeof FileReader !== 'undefined') {
          base64Data = await new Promise<string>((resolveReader, rejectReader) => {
            const reader = new FileReader();
            reader.onloadend = () => {
              const result = reader.result as string;
              const data = result.split(',')[1] || result;
              resolveReader(data);
            };
            reader.onerror = () => {
              const lastRecordingFilePath = NativeAudioRecorder.lastRecordingFilePath;
              if (lastRecordingFilePath) {
                this.playFromFilePath(lastRecordingFilePath).then(resolve).catch(reject);
                return;
              }
              rejectReader(new Error('Failed to read audio blob'));
            };
            reader.readAsDataURL(blob);
          });
        } else {
          const buffer = await blob.arrayBuffer();
          const bytes = new Uint8Array(buffer);
          base64Data = base64Encode(bytes);
        }
        
        // 验证 Blob 数据有效性
        if (!blob || blob.size === 0) {
          console.error('   ❌ [AudioPlayer] Invalid blob: null or empty');
          // 尝试使用文件路径回退方案
          const lastRecordingFilePath = NativeAudioRecorder.lastRecordingFilePath;
          if (lastRecordingFilePath) {
            console.log('   🔄 [AudioPlayer] Attempting fallback to file path:', lastRecordingFilePath);
            try {
              await this.playFromFilePath(lastRecordingFilePath);
              resolve();
              return;
            } catch (filePathError) {
              console.error('   ❌ [AudioPlayer] File path fallback also failed:', filePathError);
              throw new Error(`Invalid blob and file path fallback failed: ${filePathError instanceof Error ? filePathError.message : 'Unknown error'}`);
            }
          }
          throw new Error('Invalid blob: null or empty, and no file path available');
        }
        
        console.log('   📦 [AudioPlayer] Blob validation passed:', {
          size: blob.size,
          type: blob.type
        });
        
        // 创建临时文件
        tempPath = `${RNFS.DocumentDirectoryPath}/playback_${Date.now()}.m4a`;
        console.log('   📁 [AudioPlayer] Creating temporary file:', tempPath);
        
        try {
          await RNFS.writeFile(tempPath, base64Data, 'base64');
        } catch (writeError) {
          console.error('   ❌ [AudioPlayer] Failed to write temporary file:', writeError);
          throw new Error(`Failed to write temporary file: ${writeError instanceof Error ? writeError.message : 'Unknown error'}`);
        }
        
        // 验证文件是否存在
        const fileExists = await RNFS.exists(tempPath);
        if (!fileExists) {
          console.error('   ❌ [AudioPlayer] Temporary file was not created at:', tempPath);
          throw new Error('Temporary file was not created');
        }
        
        // 检查文件大小和详细信息（必须成功，否则抛出错误）
        let fileStats;
        try {
          fileStats = await RNFS.stat(tempPath);
          console.log('   📊 [AudioPlayer] File stats:', {
            size: fileStats.size,
            isFile: fileStats.isFile(),
            path: fileStats.path
          });
          
          if (fileStats.size === 0) {
            console.error('   ❌ [AudioPlayer] Temporary file is empty (0 bytes)');
            // 尝试使用文件路径回退方案
            const lastRecordingFilePath = NativeAudioRecorder.lastRecordingFilePath;
            if (lastRecordingFilePath) {
              console.log('   🔄 [AudioPlayer] Attempting fallback to file path:', lastRecordingFilePath);
              try {
                // 清理空的临时文件
                await RNFS.unlink(tempPath).catch(() => {});
                tempPath = null;
                await this.playFromFilePath(lastRecordingFilePath);
                resolve();
                return;
              } catch (filePathError) {
                console.error('   ❌ [AudioPlayer] File path fallback also failed:', filePathError);
                throw new Error('Temporary file is empty and file path fallback failed');
              }
            }
            throw new Error('Temporary file is empty (0 bytes)');
          }
          
          // 验证文件大小与 Blob 大小是否匹配（允许一定误差）
          const sizeDifference = Math.abs(fileStats.size - blob.size);
          const sizeTolerance = Math.max(blob.size * 0.1, 100); // 10% 或 100 字节的容差
          if (sizeDifference > sizeTolerance) {
            console.warn('   ⚠️  [AudioPlayer] File size mismatch:', {
              blobSize: blob.size,
              fileSize: fileStats.size,
              difference: sizeDifference
            });
            // 不抛出错误，因为可能是编码差异导致的
          }
          
          console.log('   ✅ [AudioPlayer] File exists and is not empty:', fileStats.size, 'bytes');
        } catch (statError) {
          console.error('   ❌ [AudioPlayer] Failed to get file stats:', statError);
          // 如果无法获取文件统计信息，尝试使用文件路径回退方案
          const lastRecordingFilePath = NativeAudioRecorder.lastRecordingFilePath;
          if (lastRecordingFilePath) {
            console.log('   🔄 [AudioPlayer] Attempting fallback to file path due to stat error');
            try {
              // 清理可能有问题的临时文件
              await RNFS.unlink(tempPath).catch(() => {});
              tempPath = null;
              await this.playFromFilePath(lastRecordingFilePath);
              resolve();
              return;
            } catch (filePathError) {
              console.error('   ❌ [AudioPlayer] File path fallback also failed:', filePathError);
              throw new Error(`Failed to get file stats and file path fallback failed: ${statError instanceof Error ? statError.message : 'Unknown error'}`);
            }
          }
          throw new Error(`Failed to get file stats: ${statError instanceof Error ? statError.message : 'Unknown error'}`);
        }
        
        // 尝试读取文件的前几个字节，确认文件可读
        try {
          const testRead = await RNFS.readFile(tempPath, 'base64', 0, 100);
          if (!testRead || testRead.length === 0) {
            console.error('   ❌ [AudioPlayer] File is not readable (empty read result)');
            throw new Error('File is not readable');
          }
          console.log('   ✅ [AudioPlayer] File is readable, first 100 bytes (base64):', testRead.substring(0, 50) + '...');
        } catch (readError) {
          console.error('   ❌ [AudioPlayer] Failed to read file:', readError);
          // 如果读取失败，尝试使用文件路径回退方案
          const lastRecordingFilePath = NativeAudioRecorder.lastRecordingFilePath;
          if (lastRecordingFilePath) {
            console.log('   🔄 [AudioPlayer] Attempting fallback to file path due to read error');
            try {
              // 清理可能有问题的临时文件
              await RNFS.unlink(tempPath).catch(() => {});
              tempPath = null;
              await this.playFromFilePath(lastRecordingFilePath);
              resolve();
              return;
            } catch (filePathError) {
              console.error('   ❌ [AudioPlayer] File path fallback also failed:', filePathError);
              throw new Error(`Failed to read file and file path fallback failed: ${readError instanceof Error ? readError.message : 'Unknown error'}`);
            }
          }
          throw new Error(`Failed to read file: ${readError instanceof Error ? readError.message : 'Unknown error'}`);
        }
        
        // 使用 react-native-audio-recorder-player 播放
        console.log('   🎵 Starting player with audioRecorderPlayer...');
        
        // 简化实现：使用基于时长的超时机制
        // 先估算播放时长，然后设置相应的超时
        const estimatedDuration = Math.max(blob.size / 10000, 0.5);
        const playbackTimeout = Math.ceil(estimatedDuration * 1000) + 2000; // 估算时长 + 2秒缓冲
        
        console.log('   ⏱️  Estimated playback duration:', estimatedDuration.toFixed(2), 'seconds');
        console.log('   ⏱️  Playback timeout set to:', playbackTimeout, 'ms');
        
        // 确保路径格式正确（移除 file:// 前缀如果存在，库会自动添加）
        // 同时规范化路径，移除重复的分隔符
        let cleanPath = tempPath.replace(/^file:\/\//, '');
        cleanPath = cleanPath.replace(/\/+/g, '/'); // 移除重复的分隔符
        console.log('   📁 Using cleaned path:', cleanPath);
        
        // 确保没有正在进行的播放
        if (this.isPlayingState) {
          console.log('   ⚠️  Stopping previous playback...');
          try {
            await this.audioRecorderPlayer.stopPlayer();
            this.audioRecorderPlayer.removePlayBackListener();
            this.playbackListener = null;
          } catch (e) {
            // 忽略错误
          }
          this.isPlayingState = false;
          await new Promise(resolve => setTimeout(resolve, 200));
        }
        
        // 配置音频会话为播放模式（iOS需要）
        // 尝试多种方法配置音频会话
        let audioSessionConfigured = false;
        
        // 方法1: 尝试使用 AudioSessionManager（如果可用）
        try {
          const { NativeModules } = require('react-native');
          console.log('   🔍 Checking NativeModules:', Object.keys(NativeModules));
          const { AudioSessionManager } = NativeModules;
          console.log('   🔍 AudioSessionManager:', AudioSessionManager ? 'found' : 'not found');
          if (AudioSessionManager) {
            console.log('   🔍 AudioSessionManager methods:', Object.keys(AudioSessionManager));
          }
          
          if (AudioSessionManager && AudioSessionManager.configureAudioSessionForPlayback) {
            console.log('   🎵 Configuring audio session via AudioSessionManager...');
            try {
              await AudioSessionManager.configureAudioSessionForPlayback();
              console.log('   ✅ Audio session configured via AudioSessionManager');
              audioSessionConfigured = true;
            } catch (configError) {
              console.error('   ❌ AudioSessionManager configuration failed:', configError);
            }
          } else {
            console.warn('   ⚠️  AudioSessionManager.configureAudioSessionForPlayback not available');
            console.warn('   💡 Make sure AudioSessionManager is properly linked in iOS project');
          }
        } catch (sessionError) {
          console.warn('   ⚠️  AudioSessionManager not available:', sessionError);
        }
        
        // 方法2: 使用 react-native-audio-recorder-player 的 setSubscriptionDuration
        // 这可能会触发音频会话配置
        try {
          console.log('   🎵 Configuring player subscription...');
          if (typeof (this.audioRecorderPlayer as any).setSubscriptionDuration === 'function') {
            (this.audioRecorderPlayer as any).setSubscriptionDuration(250); // 250ms 更新间隔
            console.log('   ✅ Player subscription configured');
          }
        } catch (subError) {
          console.warn('   ⚠️  Failed to set subscription duration:', subError);
        }
        
        if (!audioSessionConfigured) {
          console.warn('   ⚠️  Audio session may not be configured - playback might fail');
          console.warn('   💡 The library should handle audio session, but if playback fails,');
          console.warn('      check device settings (silent mode, volume)');
        }
        
        // 等待音频会话配置生效
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // 设置订阅持续时间（重要：让监听器能够工作）
        try {
          if (typeof (this.audioRecorderPlayer as any).setSubscriptionDuration === 'function') {
            console.log('   ⚙️  Setting subscription duration to 250ms...');
            (this.audioRecorderPlayer as any).setSubscriptionDuration(250);
            console.log('   ✅ Subscription duration set');
          } else {
            console.warn('   ⚠️  setSubscriptionDuration not available - listeners may not work');
          }
        } catch (subError) {
          console.warn('   ⚠️  Failed to set subscription duration:', subError);
        }
        
        // 先添加播放监听器，再启动播放器
        let fallbackTimeoutRef: NodeJS.Timeout | null = null;
        this.playbackListener = (e: any) => {
          console.log('   📊 Playback listener called:', JSON.stringify(e));
          const currentPosition = (e.currentPosition || e.current_position || 0) / 1000;
          const duration = (e.duration || 0) / 1000;
          if (duration > 0) {
            console.log('   📊 Playback progress:', currentPosition.toFixed(2), '/', duration.toFixed(2), 'seconds');
          } else {
            console.log('   📊 Playback event (no duration yet):', currentPosition.toFixed(2), 'seconds');
          }
          // 如果监听器被触发，取消备选方案的超时
          if (fallbackTimeoutRef) {
            clearTimeout(fallbackTimeoutRef);
            fallbackTimeoutRef = null;
          }
        };
        this.audioRecorderPlayer.addPlayBackListener(this.playbackListener);
        console.log('   ✅ Playback listener added');
        
        // 开始播放
        console.log('   ▶️  Starting playback with path:', cleanPath);
        try {
          // 尝试不同的路径格式
          // 有些版本可能需要 file:// 前缀，有些不需要
          let playPath = cleanPath;
          
          // 尝试不同的路径格式
          console.log('   🔄 Attempting playback...');
          console.log('   📁 Original path:', playPath);
          
          let msg: string;
          let playbackStarted = false;
          
          // 尝试1: 不带 file:// 前缀的路径（当前方式）
          try {
            console.log('   🔄 Try 1: Path without file:// prefix');
            msg = await this.audioRecorderPlayer.startPlayer(playPath);
            console.log('   ✅ startPlayer() returned:', msg);
            playbackStarted = true;
          } catch (error1) {
            console.warn('   ⚠️  Try 1 failed:', error1);
            
            // 尝试2: 带 file:// 前缀的路径
            try {
              const pathWithPrefix = `file://${playPath}`;
              console.log('   🔄 Try 2: Path with file:// prefix:', pathWithPrefix);
              msg = await this.audioRecorderPlayer.startPlayer(pathWithPrefix);
              console.log('   ✅ startPlayer() returned:', msg);
              playbackStarted = true;
            } catch (error2) {
              console.warn('   ⚠️  Try 2 failed:', error2);
              throw new Error(`Both path formats failed. Error 1: ${error1}, Error 2: ${error2}`);
            }
          }
          
          if (!playbackStarted) {
            throw new Error('Failed to start playback with any path format');
          }
          
          console.log('   ✅ Playback started successfully');
          this.isPlayingState = true;
          
          // 设置音量（确保音量不是0）
          try {
            if (typeof (this.audioRecorderPlayer as any).setVolume === 'function') {
              console.log('   🔊 Setting volume to 1.0...');
              await (this.audioRecorderPlayer as any).setVolume(1.0);
              console.log('   ✅ Volume set to 1.0');
            } else {
              console.warn('   ⚠️  setVolume not available');
            }
          } catch (volumeError) {
            console.warn('   ⚠️  Failed to set volume:', volumeError);
          }
          
          // 检查返回的路径
          if (msg && msg !== playPath) {
            // 规范化返回的路径，移除重复的分隔符
            let normalizedPath = msg.replace(/\/+/g, '/'); // 将多个连续的 / 替换为单个 /
            normalizedPath = normalizedPath.replace(/^file:\/\/+/, 'file://'); // 规范化 file:// 前缀
            
            // 如果路径被规范化了，记录但不重新启动（避免中断播放）
            if (normalizedPath !== msg) {
              console.log('   ⚠️  Library returned path with duplicate separators');
              console.log('   📁 Original path:', playPath);
              console.log('   📁 Returned path (raw):', msg);
              console.log('   📁 Normalized path:', normalizedPath);
              console.log('   💡 Using normalized path - this is a library quirk, playback should continue');
              // 不重新启动，因为播放可能已经成功开始
            } else {
              console.log('   📁 Library returned different path (normal):', msg);
            }
          }
          
          // 等待播放器初始化
          await new Promise(resolve => setTimeout(resolve, 500));
          console.log('   ✅ Waited 500ms for player initialization');
          
          // 再次验证音频会话配置（在播放开始后）
          try {
            const { NativeModules } = require('react-native');
            const { AudioSessionManager } = NativeModules;
            if (AudioSessionManager && AudioSessionManager.configureAudioSessionForPlayback) {
              console.log('   🔄 Re-configuring audio session after playback start...');
              await AudioSessionManager.configureAudioSessionForPlayback();
              console.log('   ✅ Audio session re-configured');
            }
          } catch (reconfigError) {
            console.warn('   ⚠️  Failed to re-configure audio session:', reconfigError);
          }
          
          // 强制触发一次检查 - 通过设置一个短暂的轮询来检查监听器是否工作
          let listenerCalled = false;
          let listenerCallCount = 0;
          
          // 更新监听器以标记它被调用了
          const originalListener = this.playbackListener;
          this.playbackListener = (e: any) => {
            listenerCalled = true;
            listenerCallCount++;
            console.log(`   📊 Listener called (${listenerCallCount} times):`, JSON.stringify(e));
            if (originalListener) {
              originalListener(e);
            }
          };
          // 重新添加更新后的监听器（确保使用最新的）
          this.audioRecorderPlayer.removePlayBackListener();
          this.audioRecorderPlayer.addPlayBackListener(this.playbackListener);
          console.log('   ✅ Updated playback listener added');
          
          const checkInterval = setInterval(() => {
            if (listenerCalled) {
              clearInterval(checkInterval);
              console.log('   ✅ Listener is working!');
            } else {
              console.log('   ⏳ Waiting for playback listener to fire...');
            }
          }, 500);
          
          // 3秒后检查，如果监听器未触发，尝试其他方法
          let fallbackTriggered = false;
          fallbackTimeoutRef = setTimeout(async () => {
            clearInterval(checkInterval);
            if (!listenerCalled && !fallbackTriggered) {
              fallbackTriggered = true;
              // 降低日志级别：这可能是库的已知问题，播放可能仍在进行
              console.log('   ℹ️  Playback listener not fired after 3 seconds (this may be normal)');
              console.log('   💡 Checking if playback is actually working...');
              
              // 尝试多种方法检查播放器状态
              console.log('   🔍 Checking player status...');
              
              // 方法1: 检查播放器是否有 getCurrentPosition 方法
              try {
                if (typeof (this.audioRecorderPlayer as any).getCurrentPosition === 'function') {
                  const currentPosition = await (this.audioRecorderPlayer as any).getCurrentPosition();
                  console.log('   📊 Current playback position:', currentPosition, 'ms');
                  if (currentPosition > 0) {
                    console.log('   ✅ Player is actually playing (position > 0)');
                    console.log('   💡 Listener not firing is a known library quirk - playback is working');
                    // 播放正常，只是监听器没有触发，这是库的已知问题
                    return; // 提前返回，不需要进一步检查
                  } else {
                    console.log('   ℹ️  Player position is 0 - may still be initializing');
                    console.log('   💡 This is normal if playback just started');
                  }
                } else {
                  console.log('   ℹ️  getCurrentPosition not available - using fallback checks');
                }
              } catch (positionError) {
                console.log('   ℹ️  Could not get playback position (non-critical):', positionError);
              }
              
              // 方法2: 检查文件是否真的存在且可读
              try {
                const fileExists = await RNFS.exists(cleanPath);
                console.log('   📁 [AudioPlayer] File exists check:', fileExists);
                if (fileExists) {
                  const fileInfo = await RNFS.stat(cleanPath);
                  console.log('   📊 [AudioPlayer] File info:', {
                    size: fileInfo.size,
                    isFile: fileInfo.isFile(),
                    path: fileInfo.path
                  });
                  console.log('   📁 [AudioPlayer] Full file path:', cleanPath);
                  
                  if (fileInfo.size === 0) {
                    console.error('   ❌ [AudioPlayer] File exists but is empty (0 bytes)!');
                    console.error('   💡 [AudioPlayer] This indicates the file write operation failed or was incomplete');
                    console.error('   💡 [AudioPlayer] Possible causes:');
                    console.error('      - Insufficient disk space');
                    console.error('      - File system permissions issue');
                    console.error('      - Base64 encoding/decoding issue');
                    console.error('      - Blob data was corrupted');
                  } else {
                    console.log('   ✅ [AudioPlayer] File exists and has content:', fileInfo.size, 'bytes');
                  }
                  
                  console.log('   💡 [AudioPlayer] To debug this file:');
                  console.log('      1. Connect device to Mac');
                  console.log('      2. Open Xcode > Window > Devices and Simulators');
                  console.log('      3. Select your device > Select app > Download Container');
                  console.log('      4. Right-click container > Show Package Contents');
                  console.log('      5. Navigate to: AppData/Documents/');
                  console.log('      6. Find the playback_*.m4a file');
                  console.log('      7. Drag to Mac and open with QuickTime or VLC');
                } else {
                  console.error('   ❌ [AudioPlayer] File does not exist! This is the problem.');
                  console.error('   📁 [AudioPlayer] Expected path:', cleanPath);
                  console.error('   💡 [AudioPlayer] Possible causes:');
                  console.error('      - File write operation failed silently');
                  console.error('      - File was deleted before playback');
                  console.error('      - Path resolution issue');
                  console.error('      - File system permissions issue');
                  
                  // 尝试使用文件路径回退方案
                  const lastRecordingFilePath = NativeAudioRecorder.lastRecordingFilePath;
                  if (lastRecordingFilePath) {
                    console.log('   🔄 [AudioPlayer] Attempting fallback to original recording file path');
                    try {
                      const originalFileExists = await RNFS.exists(lastRecordingFilePath);
                      if (originalFileExists) {
                        const originalFileInfo = await RNFS.stat(lastRecordingFilePath);
                        console.log('   ✅ [AudioPlayer] Original recording file exists:', {
                          size: originalFileInfo.size,
                          path: lastRecordingFilePath
                        });
                        // 尝试使用原始文件播放
                        await this.playFromFilePath(lastRecordingFilePath);
                        resolve();
                        return;
                      } else {
                        console.error('   ❌ [AudioPlayer] Original recording file also does not exist');
                      }
                    } catch (fallbackError) {
                      console.error('   ❌ [AudioPlayer] Fallback to original file failed:', fallbackError);
                    }
                  }
                }
              } catch (fileCheckError) {
                console.error('   ❌ [AudioPlayer] Failed to check file:', fileCheckError);
                console.error('   📝 [AudioPlayer] Error details:', {
                  message: fileCheckError instanceof Error ? fileCheckError.message : String(fileCheckError),
                  stack: fileCheckError instanceof Error ? fileCheckError.stack : undefined
                });
              }
              
              // 方法3: 静默检查，不重新启动（避免中断可能正在进行的播放）
              // 如果文件存在且可读，播放很可能已经成功，只是监听器没有触发
              console.log('   ℹ️  Playback may be working despite listener not firing');
              console.log('   💡 This is a known issue with react-native-audio-recorder-player');
              console.log('   💡 If you can hear audio, the issue is non-critical');
            }
          }, 3000); // 3秒后检查
          
          // 注意：如果监听器在3秒内被触发，fallbackTimeout 中的检查会跳过
          // 因为 listenerCalled 会被设置为 true
          
        } catch (playError) {
          console.error('   ❌ startPlayer() failed:', playError);
          throw playError;
        }
        
        // 使用基于时长的超时机制（作为最后的保障）
        // 只有在备选方案也没有触发时才使用这个超时
        setTimeout(() => {
          // 只有在没有其他方案成功时才执行
          if (this.isPlayingState) {
            console.log('   ✅ Playback completed (final timeout-based)');
            this.isPlayingState = false;
            
            // 停止播放并清理
            this.audioRecorderPlayer.stopPlayer().catch(() => {});
            this.audioRecorderPlayer.removePlayBackListener();
            this.playbackListener = null;
            
            // 清理临时文件
            if (tempPath) {
              RNFS.unlink(tempPath).catch(() => {
                console.warn('   ⚠️  Failed to delete temporary file');
              });
            }
            
            resolve();
          }
        }, playbackTimeout);
        
      } catch (error) {
        console.error('❌ [AudioPlayer] Failed to process audio');
        console.error('   📝 [AudioPlayer] Error type:', typeof error);
        console.error('   📝 [AudioPlayer] Error:', error);
        if (error instanceof Error) {
          console.error('   📝 [AudioPlayer] Error message:', error.message);
          console.error('   📚 [AudioPlayer] Error stack:', error.stack);
        }
        
        // 记录上下文信息
        console.error('   📊 [AudioPlayer] Context:', {
          blobSize: blob?.size || 0,
          blobType: blob?.type || 'unknown',
          tempPath: tempPath || 'not created',
          lastRecordingFilePath: NativeAudioRecorder.lastRecordingFilePath || 'not available',
          shouldUseFilePath: NativeAudioRecorder.shouldUseFilePath
        });
        
        // 尝试使用文件路径回退方案（如果还没有尝试过）
        if (tempPath && NativeAudioRecorder.lastRecordingFilePath) {
          console.log('   🔄 [AudioPlayer] Attempting final fallback to original recording file');
          try {
            const originalFileExists = await RNFS.exists(NativeAudioRecorder.lastRecordingFilePath);
            if (originalFileExists) {
              const originalFileInfo = await RNFS.stat(NativeAudioRecorder.lastRecordingFilePath);
              console.log('   ✅ [AudioPlayer] Original file exists, attempting playback:', {
                size: originalFileInfo.size,
                path: NativeAudioRecorder.lastRecordingFilePath
              });
              // 清理临时文件
              if (tempPath) {
                await RNFS.unlink(tempPath).catch(() => {});
              }
              // 尝试使用原始文件播放
              await this.playFromFilePath(NativeAudioRecorder.lastRecordingFilePath);
              resolve();
              return;
            }
          } catch (fallbackError) {
            console.error('   ❌ [AudioPlayer] Final fallback also failed:', fallbackError);
          }
        }
        
        // 清理
        if (this.playbackListener) {
          try {
            this.audioRecorderPlayer.removePlayBackListener();
            this.playbackListener = null;
          } catch (e) {
            // 忽略
          }
        }
        if (tempPath) {
          try {
            await RNFS.unlink(tempPath);
          } catch (e) {
            // 忽略
          }
        }
        
        reject(new Error(`Failed to process audio: ${error instanceof Error ? error.message : 'Unknown error'}`));
      }
    });
  }

  // 使用 react-native-sound 播放
  private async playWithReactNativeSound(filePath: string): Promise<void> {
    // 配置音频会话
    try {
      const { NativeModules } = require('react-native');
      const { AudioSessionManager } = NativeModules;
      if (AudioSessionManager && AudioSessionManager.configureAudioSessionForPlayback) {
        await AudioSessionManager.configureAudioSessionForPlayback();
      }
    } catch (sessionError) {
      // 忽略
    }
    
    // 设置 react-native-sound 的 category
    try {
      try {
        Sound.setCategory('Playback', true);
      } catch (e1) {
        try {
          Sound.setCategory('Playback');
        } catch (e2) {
          // 忽略
        }
      }
    } catch (categoryError) {
      // 忽略
    }
    
    // 验证文件是否存在
    let cleanPath: string;
    try {
      cleanPath = filePath.replace(/^file:\/\//, '');
      const fileExists = await RNFS.exists(cleanPath);
      if (!fileExists) {
        throw new Error(`Audio file does not exist: ${cleanPath}`);
      }
      
      const fileInfo = await RNFS.stat(cleanPath);
      if (fileInfo.size === 0) {
        throw new Error('Audio file is empty');
      }
    } catch (fileError) {
      throw new Error(`Failed to verify audio file: ${fileError instanceof Error ? fileError.message : 'Unknown error'}`);
    }
    
    return new Promise((resolve, reject) => {
      const sound = new Sound(cleanPath, '', (error: Error | null) => {
          if (error) {
          reject(error);
            return;
          }
          
          const duration = sound.getDuration();
        if (duration <= 0) {
          sound.release();
          reject(new Error('Invalid audio duration'));
          return;
        }
        
        sound.setVolume(1.0);
        
        sound.play((success: boolean) => {
          sound.release();
          
          // 播放完成后删除录音文件
          const recordingFilePath = NativeAudioRecorder.lastRecordingFilePath;
          if (recordingFilePath) {
            RNFS.unlink(recordingFilePath).catch(() => {
              // 忽略删除错误
            });
            NativeAudioRecorder.lastRecordingFilePath = null;
            NativeAudioRecorder.shouldUseFilePath = false;
          }
          
          if (success) {
            resolve();
          } else {
            reject(new Error('react-native-sound playback failed'));
          }
        });
      });
    });
  }

  // 直接从文件路径播放（绕过 Blob 转换）
  private async playFromFilePath(filePath: string): Promise<void> {
    await this.playWithReactNativeSound(filePath);
  }

  async getDuration(blob: Blob): Promise<number> {
    // 简化实现：直接基于文件大小估算时长
    // m4a 格式通常：1KB ≈ 0.1秒（64kbps 编码）
    // 使用更保守的估算：1KB ≈ 0.08秒
    console.log('⏱️  [AudioPlayer] Getting duration (estimated)...');
    console.log('   📦 Blob size:', blob.size, 'bytes');
    
    // 基于文件大小的估算
    // 对于 m4a 格式，假设平均比特率约为 64kbps
    // 1KB = 1024 bytes, 64kbps = 8000 bytes/秒
    // 所以 1KB ≈ 0.128秒，我们使用 0.1秒作为估算值
    const estimatedDuration = Math.max(blob.size / 10000, 0.5);
    console.log('   ✅ Estimated duration:', estimatedDuration.toFixed(2), 'seconds');
    
    return estimatedDuration;
  }

  isPlaying(): boolean {
    return this.isPlayingState;
  }

  async stop(): Promise<void> {
    if (!this.isPlayingState) {
      return;
    }

    try {
      // 停止播放
      await this.audioRecorderPlayer.stopPlayer();
      
      // 移除监听器
      if (this.playbackListener) {
        try {
          this.audioRecorderPlayer.removePlayBackListener();
        } catch (e) {
          // 忽略错误
        }
        this.playbackListener = null;
      }
      
      // 更新状态
      this.isPlayingState = false;
      
      // 等待一小段时间确保清理完成
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      // 即使出错也要更新状态
      this.isPlayingState = false;
      console.debug('Error stopping playback:', error);
      // 不抛出错误，确保调用者可以继续
    }
  }
}

export const nativeAudioAdapter: AudioAdapter = {
  createRecorder: () => new NativeAudioRecorder(),
  createPlayer: () => new NativeAudioPlayer(),
};

