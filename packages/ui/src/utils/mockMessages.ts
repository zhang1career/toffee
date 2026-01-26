/**
   '随机mock文案工具函数
   '用于生成随机的"有n人在听"类型的文案
 */
import {logger} from "@zhang1career/logger";

const STARRY_MESSAGES = [
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
  '这一刻，有 {count} 颗星辰为你同频闪烁',
  '你的声音已化作波长，正掠过 {count} 光年外的星系',
  '此时此刻，宇宙中有 {count} 个人正与你共享这份寂静',
  '刚才那阵涟漪，惊动了 {count} 位远方的守夜人',
  '你的独白，已存入这片永恒的暗物质里',
  '此时，银河系有 {count} 颗星星为你亮起',
  '刚才那颗流星，是你心声的回响',
  '茫茫黑夜中，有 {count} 个人正和你呼吸同一频率',
  '刚才的波动，已被距离你最近的 {count} 颗恒星捕捉',
  '这一秒，星空收录了你的频率'
];

const PSYCHOLOGICAL_ENERGY_MESSAGES = [
  '每一句话语，都是心灵的震动',
  '每一个音符，都是心灵的共鸣',
  '你的声音，连接了 {count} 颗心',
  '每一句话语，都是爱的传递',
  '每一个音符，都是情感的释放',
  '刚才有 {count} 束微光感受到了你的存在',
  '你的心事已化作星尘，飘向虚空',
  '这一刻，你不是唯一的发光体',
  '此时有 {count} 人和你一样，正对着星空舒了一口气',
  '你的频率已穿越云层，抵达静谧之地',
  '星轨改变了 0.001 毫米，因为你的开口',
  '黑暗中，有 {count} 颗光点感应到了你的共振',
  '你发送的波动，正在 {count} 位同频者的屏幕上泛起微澜',
  '宇宙听见了，并决定为你保留这个秘密',
  '此时有 {count} 个灵魂，正在这片黑屏下静静陪你',
  '刚才的独白，让这片星空亮了一点点',
  '涟漪散去，你已与 {count} 个孤独的信号重逢',
  '你的波段，已被标记为“温柔的震荡”',
  '这一刻，宇宙接收到了你的电波',
  '在这 0.01 秒里，有 {count} 个人想对你说“我懂”',
  '说出来的那一刻，你的能量已重新流动',
  '听，那是你内在力量觉醒的声音',
  '释放掉它，腾出空间给接下来的光',
  '承认脆弱，是你变得强大的第一步',
  '阴影已经外化，你正走向属于自己的光亮',
  '这一次叙说，重构了你内心的故事',
  '感受这阵轻松，这是自愈力在萌芽',
  '你拥有克服这一切的潜在资源，就在此刻',
  '这是一个微小的出口，也是一个巨大的开始',
  '情绪已流动，内心的平衡正在找回',
  '每一个字，都是你在找回遗失的自己',
  '刚才的勇气，足以照亮一段漫长的路',
  '别怀疑，你内在的微光从未熄灭',
  '接纳此时的自己，就是最好的疗愈',
  '所有的压抑，都已随刚才的涟漪消解',
  '你并不需要完美，你只需要像现在这样真实',
  '听见了，那个正变得坚韧的自己',
  '每一个发出的音节，都是自我拯救的练习',
  '放下了，那些不属于你的重担',
  '此时的平静，是你给自己的奖赏',
  '你比你想象中更有韧性',
  '黑暗不是终点，而是孕育光的温床',
  '这一刻的坦诚，是你最锋利的武器',
  '你的心跳，正在恢复它原本的节奏',
  '刚才的释放，让你的精神世界完成了一次深呼吸',
];

const ZEN_MESSAGES = [
  '声音如水，流淌过心灵的每一个角落',
  '在寂静中，聆听内心的回响',
  '每一次呼吸，都是与宇宙的连接',
  '让声音带你进入内在的宁静',
  '在声音的波动中，找到内心的平衡',
  '让心灵随着声音起舞，感受当下的存在',
  '声音是通往内心世界的桥梁',
  '在声音的流动中，释放所有的紧张与压力',
  '让声音引导你进入深度的放松状态',
  '每一个音符，都是心灵的疗愈之旅',
  '在声音的海洋中，找到属于自己的宁静港湾',
  '让声音成为你冥想的伴侣，带你走向内在的觉醒',
  '声音是心灵的语言，倾听它，你会发现新的自己',
  '在声音的律动中，感受生命的脉搏',
  '让声音带你穿越时间与空间的界限',
  '每一次声音的震动，都是心灵的一次洗礼',
  '在声音的怀抱中，找到内心的安宁与喜悦',
  '让声音成为你心灵的导师，引导你走向光明',
  '声音是宇宙的共鸣，与你的内在频率相连',
  '在声音的流淌中，感受生命的无限可能',
  '说出来的那一刻，你的能量已重新流动',
  '听，那是你内在力量觉醒的声音',
  '释放掉它，腾出空间给接下来的光',
  '承认脆弱，是你变得强大的第一步',
  '阴影已经外化，你正走向属于自己的光亮',
  '这一次叙说，重构了你内心的故事',
  '感受这阵轻松，这是自愈力在萌芽',
  '你拥有克服这一切的潜在资源，就在此刻',
  '这是一个微小的出口，也是一个巨大的开始',
  '情绪已流动，内心的平衡正在找回',
  '每一个字，都是你在找回遗失的自己',
  '刚才的勇气，足以照亮一段漫长的路',
  '别怀疑，你内在的微光从未熄灭',
  '接纳此时的自己，就是最好的疗愈',
  '所有的压抑，都已随刚才的涟漪消解',
  '你并不需要完美，你只需要像现在这样真实',
  '听见了，那个正变得坚韧的自己',
  '每一个发出的音节，都是自我拯救的练习',
  '放下了，那些不属于你的重担',
  '此时的平静，是你给自己的奖赏',
  '你比你想象中更有韧性',
  '黑暗不是终点，而是孕育光的温床',
  '这一刻的坦诚，是你最锋利的武器',
  '你的心跳，正在恢复它原本的节奏',
  '刚才的释放，让你的精神世界完成了一次深呼吸',
];

const COMPANION_MESSAGES = [
  '在这片刻的陪伴中，你并不孤单',
  '每一个声音，都是心灵的共鸣',
  '让我们一起走过这段旅程',
  '在陪伴中，找到内心的力量',
  '你的声音，温暖了我的心',
  '让我们共同创造美好的回忆',
  '在陪伴中，感受生命的美好',
  '你的存在，让这个世界更加丰富',
  '让我们一起探索内心的世界',
  '在陪伴中，找到属于自己的光芒',
  '你的声音，是我最珍贵的礼物',
  '让我们共同书写生命的篇章',
  '在陪伴中，感受爱的力量',
  '你的存在，让我感到安心',
  '让我们一起迎接未来的挑战',
  '在陪伴中，找到内心的平静',
  '你的声音，是我前行的动力',
  '让我们共同创造美好的未来',
  '在陪伴中，感受生命的奇迹',
  '你的存在，让我感到幸福',
  '让我们一起走向光明的彼岸',
  '辛苦了，今天也坚持到了现在',
  '说完这句，就闭上眼休息一会儿吧',
  '别担心，所有的黑夜都会过去',
  '这里永远是你的避风港',
  '刚才那口气叹出来，是不是舒服多了？',
  '没关系的，一切都会好起来',
  '你的声音很好听，谢谢你愿意分享',
  '别急，慢慢来，星光一直在',
  '此时，全世界都为你安静了下来',
  '这不是软弱，这是在给自己加油',
  '嘿，你的心情刚才被一颗小行星收藏了',
  '把烦恼丢给星空，你只管负责好梦',
  '这片黑屏，会帮你守住所有的秘密',
  '刚才那一秒，我感觉到你轻松了一点',
  '不管明天如何，至少此刻你很勇敢',
  '深呼吸，跟着涟漪一起放松',
  '你的独白，已化作一盏暖色的小灯',
  '谢谢你，把这份信任交给微光',
  '所有的委屈，都在星空里稀释了',
  '早点休息，明天又是新的一天',
  '抱抱那个在黑暗中开口的自己',
  '你的心事，星空已经帮你分类收好了',
  '此时的你，比任何星辰都夺目',
  '晚安，勇敢的灵魂',
  '愿这片星空，能带给你今晚的安稳',
];

const STRATEGY_DEFAULT = {
  25: STARRY_MESSAGES,
  50: PSYCHOLOGICAL_ENERGY_MESSAGES,
  75: ZEN_MESSAGES,
  100: COMPANION_MESSAGES,
}

const STRATEGY_LONG_TIME = {
  20: STARRY_MESSAGES,
  60: PSYCHOLOGICAL_ENERGY_MESSAGES,
  80: ZEN_MESSAGES,
  100: COMPANION_MESSAGES,
}

const STRATEGY_SHORT_TIME = {
  20: STARRY_MESSAGES,
  40: PSYCHOLOGICAL_ENERGY_MESSAGES,
  80: ZEN_MESSAGES,
  100: COMPANION_MESSAGES,
}

const STRATEGY_DEEP_NIGHT = {
  20: STARRY_MESSAGES,
  40: PSYCHOLOGICAL_ENERGY_MESSAGES,
  60: ZEN_MESSAGES,
  100: COMPANION_MESSAGES,
}

/**
 * 获取随机mock文案
 * @param count 人数
 * @param recordingDuration 按压屏幕的时间（毫秒）
 * @returns 格式化后的随机文案
 */
export function getRandomMessage(count: number, recordingDuration: number): string {
  // 策略选择逻辑
  const currentHour = new Date().getHours();
  const isDeepNight = currentHour >= 2 && currentHour < 6;
  
  let strategy: Record<number, readonly string[]>;
  if (recordingDuration > 10000) {
    // 按压时间 > 10秒
    strategy = STRATEGY_LONG_TIME;
    logger.debug('[msg] Using LONG_TIME strategy');
  } else if (recordingDuration < 2000) {
    // 按压时间 < 2秒
    strategy = STRATEGY_SHORT_TIME;
    logger.debug('[msg] Using SHORT_TIME strategy');
  } else if (isDeepNight) {
    // 深夜（2点-6点）
    strategy = STRATEGY_DEEP_NIGHT;
    logger.debug('[msg] Using DEEP_NIGHT strategy');
  } else {
    // 默认策略
    strategy = STRATEGY_DEFAULT;
    logger.debug('[msg] Using DEFAULT strategy');
  }

  // 策略应用逻辑
  // 生成 0-100（不含）的随机数
  const random = Math.random() * 100;
  
  // 获取策略字典的所有 key，按升序排序
  const sortedKeys = Object.keys(strategy)
    .map(Number)
    .sort((a, b) => a - b);
  
  // 找到第一个大于随机数的 key
  const selectedKey = sortedKeys.find(key => random < key) || sortedKeys[sortedKeys.length - 1];
  
  // 获取对应的文案库
  const messagePool = strategy[selectedKey];
  
  // 从文案库中随机选择一个文案
  const randomIndex = Math.floor(Math.random() * messagePool.length);
  const message = messagePool[randomIndex];
  
  // 替换文案中的 {count} 占位符为格式化后的 count
  return message.replace('{count}', count.toLocaleString());
}
