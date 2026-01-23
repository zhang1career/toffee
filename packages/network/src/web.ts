import { NetworkService } from '@zhang1career/core';
import { NetworkAdapter } from './interface';

class WebNetworkService implements NetworkService {
  private baseUrl: string;

  constructor(baseUrl: string = '') {
    this.baseUrl = baseUrl;
  }

  async sendVoice(blob: Blob, deviceId: string): Promise<{ listenerCount: number }> {
    // 如果baseUrl为空，说明是开发模式，直接返回模拟数据
    if (!this.baseUrl) {
      console.log('No baseUrl configured, returning mock data');
      return { listenerCount: Math.floor(Math.random() * 2000) + 500 };
    }

    try {
      const formData = new FormData();
      formData.append('audio', blob, 'voice.webm');
      formData.append('deviceId', deviceId);

      const response = await fetch(`${this.baseUrl}/api/voice/send`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Failed to send voice: ${response.statusText}`);
      }

      const data = await response.json();
      return { listenerCount: data.listenerCount || 0 };
    } catch (error) {
      // 网络错误时返回模拟数据，不抛出异常
      console.log('Network request failed, using mock data:', error);
      return { listenerCount: Math.floor(Math.random() * 2000) + 500 };
    }
  }

  async receiveRandomVoice(deviceId: string): Promise<Blob | null> {
    try {
      const response = await fetch(`${this.baseUrl}/api/voice/receive?deviceId=${deviceId}`, {
        method: 'GET',
      });

      if (response.status === 204) {
        // 没有可用的语音
        return null;
      }

      if (!response.ok) {
        return null;
      }

      return await response.blob();
    } catch (error) {
      // 静默失败，不影响主流程
      return null;
    }
  }

  async getOnlineCount(): Promise<number> {
    try {
      const response = await fetch(`${this.baseUrl}/api/stats/online`, {
        method: 'GET',
      });

      if (!response.ok) {
        return 0;
      }

      const data = await response.json();
      return data.count || 0;
    } catch (error) {
      return 0;
    }
  }
}

export const webNetworkAdapter: NetworkAdapter = {
  createService: (baseUrl?: string) => new WebNetworkService(baseUrl),
};

