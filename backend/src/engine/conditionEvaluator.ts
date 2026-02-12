import type { Condition } from "../types-v2.js";
import type { ContextEvaluationState } from "./contextResolver.js";
import { resolveContext, resolveContextWithSubContexts } from "./contextResolver.js";
import type { Wizard } from "../types-v2.js";
import { evalJsonata } from "./jsonata.js";
import { runRemoteAction } from "./remoteAction.js";

export async function evaluateCondition(
  condition: Condition,
  state: ContextEvaluationState,
  wizard: Wizard
): Promise<boolean> {
  // Handle boolean literal
  if (typeof condition === "boolean") {
    return condition;
  }

  // isEmpty
  if (condition.isEmpty) {
    let value: unknown;
    if (condition.isEmpty.context) {
      value = await resolveContextWithSubContexts(condition.isEmpty.context, state, wizard);
    } else if (condition.isEmpty.path) {
      value = await evalJsonata(condition.isEmpty.path, state.currentStepValues);
    } else {
      return true;
    }

    if (value === null || value === undefined || value === "") return true;
    if (Array.isArray(value) && value.length === 0) return true;
    if (typeof value === "object" && Object.keys(value).length === 0) return true;
    return false;
  }

  // matchesRegex
  if (condition.matchesRegex) {
    let value: unknown;
    if (condition.matchesRegex.context) {
      value = await resolveContextWithSubContexts(condition.matchesRegex.context, state, wizard);
    } else if (condition.matchesRegex.path) {
      value = await evalJsonata(condition.matchesRegex.path, state.currentStepValues);
    } else {
      return false;
    }

    const strValue = String(value ?? "");
    const regex = new RegExp(condition.matchesRegex.value);
    return regex.test(strValue);
  }

  // equals
  if (condition.equals) {
    const leftValue = condition.equals.context
      ? await resolveContextWithSubContexts(condition.equals.context, state, wizard)
      : undefined;

    let rightValue: unknown;
    if (condition.equals.value && typeof condition.equals.value === "object" && "type" in condition.equals.value) {
      rightValue = await resolveContext(condition.equals.value as any, state, wizard);
    } else {
      rightValue = condition.equals.value;
    }

    return leftValue === rightValue;
  }

  // lessThan
  if (condition.lessThan) {
    const leftValue = condition.lessThan.context
      ? await resolveContextWithSubContexts(condition.lessThan.context, state, wizard)
      : 0;

    let rightValue: unknown;
    if (typeof condition.lessThan.value === "object" && "type" in condition.lessThan.value) {
      rightValue = await resolveContext(condition.lessThan.value as any, state, wizard);
    } else {
      rightValue = condition.lessThan.value;
    }

    return Number(leftValue) < Number(rightValue);
  }

  // moreThan
  if (condition.moreThan) {
    const leftValue = condition.moreThan.context
      ? await resolveContextWithSubContexts(condition.moreThan.context, state, wizard)
      : 0;

    let rightValue: unknown;
    if (typeof condition.moreThan.value === "object" && "type" in condition.moreThan.value) {
      rightValue = await resolveContext(condition.moreThan.value as any, state, wizard);
    } else {
      rightValue = condition.moreThan.value;
    }

    return Number(leftValue) > Number(rightValue);
  }

  // and
  if (condition.and) {
    for (const subCondition of condition.and) {
      const result = await evaluateCondition(subCondition, state, wizard);
      if (!result) return false;
    }
    return true;
  }

  // or
  if (condition.or) {
    for (const subCondition of condition.or) {
      const result = await evaluateCondition(subCondition, state, wizard);
      if (result) return true;
    }
    return false;
  }

  // not
  if (condition.not) {
    const result = await evaluateCondition(condition.not, state, wizard);
    return !result;
  }

  // remote
  if (condition.remote) {
    const action = wizard.remoteActions?.find((a) => a.name === condition.remote!.name);
    if (!action) throw new Error(`Remote action '${condition.remote.name}' not found`);

    // Resolve contexts for the remote action
    const contexts = condition.remote.context ?? condition.remote.contexts ?? [];
    const resolvedContexts: Record<string, unknown> = {};
    for (const ctx of contexts) {
      resolvedContexts[ctx.key] = await resolveContext(ctx, state, wizard);
    }

    const mergedContexts = { ...state.currentStepValues, ...resolvedContexts };
    const result = await runRemoteAction(action, mergedContexts);

    // Remote condition returns true if action succeeds and result is truthy
    return result.ok && Boolean(result.result);
  }

  // context (generic JSONata or template evaluation)
  if (condition.context) {
    const value = await resolveContextWithSubContexts(condition.context, state, wizard);
    return Boolean(value);
  }

  return false;
}
