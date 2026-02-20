/**
 * 规则执行器：按 task._rules.steps 顺序执行；执行到 ui 时打断顺序，等待提交后按 buttons 中 type=submit 的 action 跳转
 * 当步骤为 post_display 且 task.post_display 为空时，跳过该步
 * ui 步骤不使用 durationSec，不设定时器，仅通过提交按钮的 action 跳转
 */

import type {
  RuleCallbacks,
  RuleCompleteReason,
  RulePhase,
  RuleStep,
  RuleStepAction,
  RuleTask,
} from './types';

function hasPostDisplayContent(task: RuleTask): boolean {
  const pd = task.post_display;
  if (pd == null) return false;
  if (pd.type === 'interactive_graph') return true;
  if (pd.type === 'text')
    return (typeof pd.value === 'string' ? pd.value : '').trim() !== '';
  return false;
}

/** 获取实际会执行的步骤列表（跳过 post_display 且 post_display 为空的步骤） */
export function getEffectiveSteps(task: RuleTask): RuleStep[] {
  const steps = task._rules.steps ?? [];
  return steps.filter(
    (s) => s.action !== 'post_display' || hasPostDisplayContent(task)
  );
}

export interface RuleRunner {
  start: () => void;
  submit: () => void;
  cancel: () => void;
  /** 从当前步按按钮 action 跳转；若当前为 start 且 content 为 init 会先调用 callbacks.init */
  advanceToAction: (action: RuleStepAction) => void;
  close: () => void;
  /** 后退到指定步骤并重新计时 */
  goBackToStep: (stepIndex: number) => void;
}

function isStepSkipped(task: RuleTask, step: RuleStep): boolean {
  return step.action === 'post_display' && !hasPostDisplayContent(task);
}

export function createRuleRunner(
  task: RuleTask,
  callbacks: RuleCallbacks
): RuleRunner {
  const { _rules } = task;
  const steps = _rules.steps ?? [];
  let stepIndex = 0;
  let currentTimer: ReturnType<typeof setTimeout> | null = null;
  let completed = false;
  let completedRightAfterSubmit = false;

  const deactivate = () => {
    callbacks.deactivateKeepAwake();
  };

  const clearTimer = () => {
    if (currentTimer !== null) {
      clearTimeout(currentTimer);
      currentTimer = null;
    }
  };

  const finish = (reason: RuleCompleteReason) => {
    if (completed) return;
    completed = true;
    clearTimer();
    deactivate();
    callbacks.onComplete(reason);
  };

  const runCurrentStep = () => {
    if (completed) return;

    const step = steps[stepIndex];
    if (!step) {
      finish('timeout');
      return;
    }
    if (isStepSkipped(task, step)) {
      stepIndex += 1;
      runNextStep();
      return;
    }

    const phase: RulePhase = step.action;
    completedRightAfterSubmit = false;
    callbacks.onPhase(phase, stepIndex);

    const durationSec = step.durationSec;
    if (durationSec === undefined) return;
    if (durationSec === 0) {
      stepIndex += 1;
      runNextStep();
      return;
    }

    currentTimer = setTimeout(() => {
      currentTimer = null;
      stepIndex += 1;
      runNextStep();
    }, durationSec * 1000);
  };

  const runNextStep = () => {
    if (completed) return;

    while (stepIndex < steps.length && isStepSkipped(task, steps[stepIndex])) {
      stepIndex += 1;
    }

    if (stepIndex >= steps.length) {
      finish(completedRightAfterSubmit ? 'submit' : 'timeout');
      return;
    }

    runCurrentStep();
  };

  const findStepIndexByAction = (action: RuleStepAction): number => {
    for (let i = 0; i < steps.length; i++) {
      const s = steps[i];
      if (s.action !== action) continue;
      if (isStepSkipped(task, s)) continue;
      return i;
    }
    return -1;
  };

  return {
    start() {
      completed = false;
      stepIndex = 0;
      clearTimer();
      callbacks.activateKeepAwake();
      runNextStep();
    },

    submit() {
      if (completed) return;
      const step = steps[stepIndex];
      if (step?.action !== 'ui') return;

      const targetAction = task.ui?.buttons?.find(
        (b) => b.type === 'submit'
      )?.action;
      if (!targetAction) {
        clearTimer();
        finish('submit');
        return;
      }

      const targetIndex = findStepIndexByAction(targetAction);
      if (targetIndex < 0) {
        clearTimer();
        finish('submit');
        return;
      }

      completedRightAfterSubmit = true;
      stepIndex = targetIndex;
      runCurrentStep();
    },

    cancel() {
      clearTimer();
      deactivate();
      completed = true;
    },

    advanceToAction(action: RuleStepAction) {
      if (completed) return;
      const step = steps[stepIndex];
      if (step?.action === 'start' && task.start?.type === 'init') {
        callbacks.init?.();
      }
      const targetIndex = findStepIndexByAction(action);
      if (targetIndex < 0) return;
      stepIndex = targetIndex;
      runCurrentStep();
    },

    close() {
      callbacks.close?.();
    },

    goBackToStep(targetIndex: number) {
      if (completed) return;
      if (targetIndex < 0 || targetIndex >= steps.length) return;

      clearTimer();
      stepIndex = targetIndex;

      const step = steps[stepIndex];
      if (!step || isStepSkipped(task, step)) {
        runNextStep();
        return;
      }

      const durationSec = step.durationSec;
      if (durationSec === undefined) return;
      if (durationSec === 0) {
        stepIndex += 1;
        runNextStep();
        return;
      }

      callbacks.activateKeepAwake();
      currentTimer = setTimeout(() => {
        currentTimer = null;
        stepIndex += 1;
        runNextStep();
      }, durationSec * 1000);
    },
  };
}
