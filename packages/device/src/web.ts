import { DeviceService } from '@toffee/core';
import { DeviceAdapter } from './interface';

class WebDeviceService implements DeviceService {
  private readonly STORAGE_KEY = 'echo_device_id';
  private readonly FIRST_LAUNCH_KEY = 'echo_first_launch';

  async getDeviceId(): Promise<string> {
    // 尝试从 localStorage 获取
    const stored = localStorage.getItem(this.STORAGE_KEY);
    if (stored) {
      return stored;
    }

    // 生成新的设备ID（使用时间戳 + 随机数）
    const deviceId = `web_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    localStorage.setItem(this.STORAGE_KEY, deviceId);
    return deviceId;
  }

  async isFirstLaunch(): Promise<boolean> {
    const hasLaunched = localStorage.getItem(this.FIRST_LAUNCH_KEY);
    if (!hasLaunched) {
      localStorage.setItem(this.FIRST_LAUNCH_KEY, 'true');
      return true;
    }
    return false;
  }
}

export const webDeviceAdapter: DeviceAdapter = {
  createService: () => new WebDeviceService(),
};

