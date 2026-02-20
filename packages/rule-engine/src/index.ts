/**
 * 规则引擎：通用步骤内容、规则配置与执行器
 */

export type {
  RuleCallbacks,
  RuleCompleteReason,
  RuleConfig,
  RulePhase,
  RuleStep,
  RuleStepAction,
  RuleTask,
  RouteMapEdge,
  RouteMapGraph,
  RouteMapNode,
  StepButtonConfig,
  StepContentType,
  SubmitButtonConfig,
  NormalButtonConfig,
  CloseButtonConfig,
} from './types';
export type { RuleRunner } from './runner';
export { StepContent, isInteractiveGraphContent } from './types';
export { createRuleRunner, getEffectiveSteps } from './runner';
