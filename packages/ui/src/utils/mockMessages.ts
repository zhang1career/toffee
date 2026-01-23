/**
 * 随机mock文案工具函数
 * 用于生成随机的"有n人在听"类型的文案
 */

const MOCK_MESSAGES = [
  '此刻，{count} 颗心与你共鸣',
  '远方，{count} 个声音在倾听',
  '{count} 个灵魂与你同在',
  '你的声音，传到了 {count} 个角落',
  '{count} 个人正在聆听你的心声',
  '这一刻，{count} 颗心为你跳动',
  '你的话语，触动了 {count} 个心灵',
  '{count} 个耳朵在等待你的声音',
  '你的声音，连接了 {count} 个世界',
  '{count} 个人与你同在',
  '你的话语，温暖了 {count} 颗心',
  '{count} 个声音在回应你',
  '这一刻，{count} 个灵魂与你相遇',
  '你的声音，点亮了 {count} 个夜晚',
  '{count} 个人正在感受你的存在',
];

/**
 * 获取随机mock文案
 * @param count 人数
 * @returns 格式化后的随机文案
 */
export function getRandomMessage(count: number): string {
  const randomIndex = Math.floor(Math.random() * MOCK_MESSAGES.length);
  const message = MOCK_MESSAGES[randomIndex];
  return message.replace('{count}', count.toLocaleString());
}
