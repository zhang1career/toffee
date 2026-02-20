/**
 * 规则引擎通用类型：步骤内容、控件、规则配置
 * 通用窗口抽象：页面类型（init / text / photo / interactive_graph）+ 控件（buttons）
 */

/** 提交按钮配置；action 表示点击提交后跳转到的步骤 */
export interface SubmitButtonConfig {
  type: 'submit';
  label: string;
  /** 点击提交后跳转到的步骤（如 "post_display"），在 steps 中查找对应 action 并执行 */
  action?: RuleStepAction;
}

/** 普通按钮配置；由宿主根据 action 处理（如 clear_roadmap） */
export interface NormalButtonConfig {
  type: 'normal' | 'danger';
  label: string;
  action?: string;
}

/** 关闭按钮配置；点击后调用宿主 close 回调（可空实现） */
export interface CloseButtonConfig {
  type: 'close';
  label: string;
  action?: RuleStepAction;
}

/** 步骤内按钮：提交、普通或关闭（pre_display / ui / post_display 共用） */
export type StepButtonConfig =
  | SubmitButtonConfig
  | NormalButtonConfig
  | CloseButtonConfig;

/** 规则步骤动作：做什么 */
export type RuleStepAction =
  | 'start'
  | 'pre_display'
  | 'ui'
  | 'post_display';

export interface RuleStep {
  /** 做什么：展示 pre_display、展示 UI 组件、展示 post_display */
  action: RuleStepAction;
  /** 做多久（秒）；ui 步骤不使用此字段，仅 pre_display / post_display 使用 */
  durationSec?: number;
}

/** 交互规则：按步骤顺序执行 */
export interface RuleConfig {
  /** 执行步骤列表 */
  steps: RuleStep[];
  /** 用户点击提交后，多少秒后进入下一个随机任务（仅在与 ui 步骤相关时使用） */
  submitDelaySec?: number;
}

/** 交互图节点：id 唯一；label 为文案，可由宿主用用户输入覆盖 */
export interface RouteMapNode {
  id: string;
  label?: string;
  updatedAt?: number;
  thumbnailUri?: string;
  fullPhotoUri?: string;
}

/** 交互图有向边 */
export interface RouteMapEdge {
  from: string;
  to: string;
}

/** 交互图：节点 + 有向边 */
export interface RouteMapGraph {
  nodes: RouteMapNode[];
  edges: RouteMapEdge[];
  startNodeId: string;
}

/** 步骤内容类型 */
export type StepContentType =
  | 'init'
  | 'text'
  | 'photo'
  | 'interactive_graph';

/**
 * 步骤内容统一类：pre_display、ui、post_display 共用
 * type 区分页面类型，value 可为空，buttons 可选
 */
export class StepContent {
  type: StepContentType;
  value?: string | RouteMapGraph;
  buttons?: StepButtonConfig[];

  constructor(data: {
    type: StepContent['type'];
    value?: string | RouteMapGraph;
    buttons?: StepButtonConfig[];
  }) {
    this.type = data.type;
    this.value = data.value;
    this.buttons = data.buttons;
  }
}

/** 类型守卫：是否为交互图步骤内容 */
export function isInteractiveGraphContent(
  c: StepContent | undefined
): c is StepContent & { type: 'interactive_graph' } {
  return c != null && typeof c === 'object' && c.type === 'interactive_graph';
}

/**
 * 带规则的通用任务接口：content 的 key 与 RuleStepAction 一致
 * SerendipityTask 等业务任务实现此接口
 */
export interface RuleTask {
  _id: string;
  start?: StepContent;
  pre_display: StepContent;
  ui: StepContent;
  post_display?: StepContent;
  _rules: RuleConfig;
}

/** 规则执行阶段 */
export type RulePhase =
  | 'start'
  | 'pre_display'
  | 'ui'
  | 'post_display';

/** 规则结束原因 */
export type RuleCompleteReason = 'timeout' | 'submit';

/** 规则执行回调：由宿主实现 keep-awake、步骤/页面切换等 */
export interface RuleCallbacks {
  activateKeepAwake: () => void;
  deactivateKeepAwake: () => void;
  /** 起始步 type 为 init 时，用户点击提交按钮后、进入 pre_display 前调用 */
  init?: () => void;
  /** 用户点击 close 按钮时调用；默认空实现 */
  close?: () => void;
  /** 进入某一步（每步对应一页） */
  onPhase: (phase: RulePhase, stepIndex: number) => void;
  onComplete: (reason: RuleCompleteReason) => void;
}
