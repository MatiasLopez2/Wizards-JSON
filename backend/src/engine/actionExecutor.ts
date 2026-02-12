import type { Action, Block, Wizard } from "../types-v2.js";
import type { ContextEvaluationState } from "./contextResolver.js";
import { resolveContext, resolveContextWithSubContexts } from "./contextResolver.js";
import { evaluateCondition } from "./conditionEvaluator.js";
import { renderTemplate } from "./liquid.js";

export interface ActionExecutionResult {
  type: string;
  payload?: unknown;
  error?: string;
}

export async function executeAction(
  action: Action,
  state: ContextEvaluationState,
  wizard: Wizard
): Promise<ActionExecutionResult> {
  try {
    switch (action.type) {
      case "GO_TO_STEP": {
        let stepName: string;
        if (typeof action.stepName === "string") {
          stepName = action.stepName;
        } else if (action.stepName && typeof action.stepName === "object") {
          stepName = String(await resolveContext(action.stepName as any, state, wizard));
        } else {
          throw new Error("stepName is required for GO_TO_STEP");
        }
        return { type: "GO_TO_STEP", payload: { stepName } };
      }

      case "SAVE_STEP_VALUES":
        return { type: "SAVE_STEP_VALUES", payload: { values: state.currentStepValues } };

      case "INIT_STEP_VALUES":
        return { type: "INIT_STEP_VALUES" };

      case "FINISH_WIZARD":
        return { type: "FINISH_WIZARD", payload: { allValues: state.allStepValues } };

      case "UPDATE_COMPONENT": {
        if (!action.targetName) throw new Error("targetName required for UPDATE_COMPONENT");
        if (!action.targetProp) throw new Error("targetProp required for UPDATE_COMPONENT");

        // Resolve targetName with contexts if provided
        let targetName = action.targetName;
        if (action.targetContexts && action.targetContexts.length > 0) {
          const resolved: Record<string, unknown> = {};
          for (const ctx of action.targetContexts) {
            resolved[ctx.key] = await resolveContext(ctx, state, wizard);
          }
          targetName = await renderTemplate(action.targetName, resolved);
        }

        const value = action.context
          ? await resolveContextWithSubContexts(action.context, state, wizard)
          : action.value;

        return {
          type: "UPDATE_COMPONENT",
          payload: { targetName, targetProp: action.targetProp, value }
        };
      }

      case "SET_VALUE": {
        if (!action.targetName) throw new Error("targetName required for SET_VALUE");

        let targetName = action.targetName;
        if (action.targetContexts && action.targetContexts.length > 0) {
          const resolved: Record<string, unknown> = {};
          for (const ctx of action.targetContexts) {
            resolved[ctx.key] = await resolveContext(ctx, state, wizard);
          }
          targetName = await renderTemplate(action.targetName, resolved);
        }

        const value = action.context
          ? await resolveContextWithSubContexts(action.context, state, wizard)
          : action.value;

        return { type: "SET_VALUE", payload: { targetName, value } };
      }

      case "ADD_ERROR": {
        if (!action.fieldName) throw new Error("fieldName required for ADD_ERROR");

        let fieldName = action.fieldName;
        if (action.fieldContexts && action.fieldContexts.length > 0) {
          const resolved: Record<string, unknown> = {};
          for (const ctx of action.fieldContexts) {
            resolved[ctx.key] = await resolveContext(ctx, state, wizard);
          }
          fieldName = await renderTemplate(action.fieldName, resolved);
        }

        let errorMessage = action.errorMessage ?? "Validation error";
        if (action.contexts && action.contexts.length > 0) {
          const resolved: Record<string, unknown> = {};
          for (const ctx of action.contexts) {
            resolved[ctx.key] = await resolveContext(ctx, state, wizard);
          }
          errorMessage = await renderTemplate(errorMessage, resolved);
        }

        return { type: "ADD_ERROR", payload: { fieldName, errorMessage } };
      }

      case "CLEAR_ERRORS": {
        if (!action.fieldName) throw new Error("fieldName required for CLEAR_ERRORS");

        let fieldName = action.fieldName;
        if (action.fieldContexts && action.fieldContexts.length > 0) {
          const resolved: Record<string, unknown> = {};
          for (const ctx of action.fieldContexts) {
            resolved[ctx.key] = await resolveContext(ctx, state, wizard);
          }
          fieldName = await renderTemplate(action.fieldName, resolved);
        }

        return { type: "CLEAR_ERRORS", payload: { fieldName } };
      }

      case "CONSOLE_LOG": {
        let message = action.message ?? "";
        if (action.contexts && action.contexts.length > 0) {
          const resolved: Record<string, unknown> = {};
          for (const ctx of action.contexts) {
            resolved[ctx.key] = await resolveContext(ctx, state, wizard);
          }
          message = await renderTemplate(message, resolved);
        }
        console.log(`[WIZARD LOG] ${message}`);
        return { type: "CONSOLE_LOG", payload: { message } };
      }

      case "REMOTE_UPDATE_COMPONENT": {
        if (!action.targetName) throw new Error("targetName required for REMOTE_UPDATE_COMPONENT");
        if (!action.targetProp) throw new Error("targetProp required for REMOTE_UPDATE_COMPONENT");
        if (!action.name) throw new Error("name (actionName) required for REMOTE_UPDATE_COMPONENT");

        const remoteAction = wizard.remoteActions?.find((a) => a.name === action.name);
        if (!remoteAction) throw new Error(`Remote action '${action.name}' not found`);

        // This action is typically resolved client-side or requires remote action execution
        return {
          type: "REMOTE_UPDATE_COMPONENT",
          payload: {
            targetName: action.targetName,
            targetProp: action.targetProp,
            actionName: action.name
          }
        };
      }

      case "ADD_GROUP": {
        if (!action.groupName) throw new Error("groupName required for ADD_GROUP");
        return { type: "ADD_GROUP", payload: { groupName: action.groupName } };
      }

      case "REMOVE_GROUP": {
        if (!action.groupName) throw new Error("groupName required for REMOVE_GROUP");
        const groupIndex = action.groupIndex
          ? await resolveContext(action.groupIndex, state, wizard)
          : undefined;
        return { type: "REMOVE_GROUP", payload: { groupName: action.groupName, groupIndex } };
      }

      case "TAKE_PHOTO": {
        if (!action.fieldName) throw new Error("fieldName required for TAKE_PHOTO");
        return { type: "TAKE_PHOTO", payload: { fieldName: action.fieldName } };
      }

      case "KILL_TASK": {
        if (!action.name) throw new Error("name required for KILL_TASK");
        return { type: "KILL_TASK", payload: { taskName: action.name } };
      }

      case "SET_LOCAL_CONTEXT": {
        if (!action.contextName) throw new Error("contextName required for SET_LOCAL_CONTEXT");
        const value = action.context
          ? await resolveContextWithSubContexts(action.context, state, wizard)
          : action.value;

        // Update local context in state
        state.localContexts[action.contextName] = value;

        return {
          type: "SET_LOCAL_CONTEXT",
          payload: { contextName: action.contextName, value }
        };
      }

      case "CONFIRM_LEAVE_PAGE":
        return { type: "CONFIRM_LEAVE_PAGE" };

      default:
        return { type: "UNKNOWN", error: `Unknown action type: ${(action as any).type}` };
    }
  } catch (err: any) {
    return { type: action.type, error: err?.message ?? String(err) };
  }
}

export async function executeBlock(
  block: Block,
  state: ContextEvaluationState,
  wizard: Wizard
): Promise<ActionExecutionResult[]> {
  const results: ActionExecutionResult[] = [];

  // Handle ACTIONS block
  if (block.type === "ACTIONS" && block.actions) {
    for (const action of block.actions.sort((a, b) => a.order - b.order)) {
      const result = await executeAction(action, state, wizard);
      results.push(result);
    }
    return results;
  }

  // Handle CONDITIONAL block
  if (block.type === "CONDITIONAL" || block.conditions !== undefined) {
    const conditionResult = block.conditions
      ? await evaluateCondition(block.conditions, state, wizard)
      : true;

    // Execute pre-conditional actions if any
    if (block.actions) {
      for (const action of block.actions.sort((a, b) => a.order - b.order)) {
        const result = await executeAction(action, state, wizard);
        results.push(result);
      }
    }

    // Execute then/else blocks
    const branchBlocks = conditionResult ? block.then : block.else;
    if (branchBlocks) {
      for (const subBlock of branchBlocks.sort((a, b) => a.order - b.order)) {
        const subResults = await executeBlock(subBlock, state, wizard);
        results.push(...subResults);
      }
    }

    return results;
  }

  // Handle FOREACH block
  if (block.type === "FOREACH") {
    if (!block.name) throw new Error("name required for FOREACH block");
    if (!block.context) throw new Error("context required for FOREACH block");

    const arrayValue = await resolveContextWithSubContexts(block.context, state, wizard);
    const array = Array.isArray(arrayValue) ? arrayValue : [];

    for (let i = 0; i < array.length; i++) {
      const item = array[i];
      state.forEachStacks.push({ name: block.name, index: i, item, array });

      // Execute actions
      if (block.actions) {
        for (const action of block.actions.sort((a, b) => a.order - b.order)) {
          const result = await executeAction(action, state, wizard);
          results.push(result);
        }
      }

      // Execute nested blocks
      if (block.blocks) {
        for (const subBlock of block.blocks.sort((a, b) => a.order - b.order)) {
          const subResults = await executeBlock(subBlock, state, wizard);
          results.push(...subResults);
        }
      }

      state.forEachStacks.pop();
    }

    return results;
  }

  // Handle SCHEDULE_TASK (simplified: just execute actions immediately in this MVP)
  if (block.type === "SCHEDULE_TASK") {
    if (block.blocks) {
      for (const subBlock of block.blocks.sort((a, b) => a.order - b.order)) {
        const subResults = await executeBlock(subBlock, state, wizard);
        results.push(...subResults);
      }
    }
    return results;
  }

  // Fallback: execute actions if present
  if (block.actions) {
    for (const action of block.actions.sort((a, b) => a.order - b.order)) {
      const result = await executeAction(action, state, wizard);
      results.push(result);
    }
  }

  return results;
}
