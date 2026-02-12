import type { Context } from "../types-v2.js";
import { renderTemplate } from "./liquid.js";
import { evalJsonata } from "./jsonata.js";
import { runRemoteAction } from "./remoteAction.js";
import type { Wizard } from "../types-v2.js";

export interface ContextEvaluationState {
  currentStepValues: Record<string, unknown>;
  allStepValues: Record<string, Record<string, unknown>>;
  componentStates: Record<string, unknown>;
  localContexts: Record<string, unknown>;
  forEachStacks: Array<{ name: string; index: number; item: unknown; array: unknown[] }>;
  groupIndexStack: number[];
}

export async function resolveContext(
  context: Context,
  state: ContextEvaluationState,
  wizard: Wizard
): Promise<unknown> {
  switch (context.type) {
    case "VALUE":
      return context.value;

    case "CURRENT_STEP_VALUES": {
      const expression = context.expression ?? context.fieldName;
      if (!expression) return state.currentStepValues;
      return evalJsonata(expression, state.currentStepValues, context.contexts ? await resolveContexts(context.contexts, state, wizard) : undefined);
    }

    case "ALL_STEP_VALUES":
      if (context.expression) {
        console.log('[ALL_STEP_VALUES] Expression:', context.expression);
        console.log('[ALL_STEP_VALUES] Data:', JSON.stringify(state.allStepValues, null, 2));
        const result = await evalJsonata(context.expression, state.allStepValues);
        console.log('[ALL_STEP_VALUES] Result:', result);
        return result;
      }
      return state.allStepValues;

    case "COMPONENT_VALUES": {
      if (!context.componentName) throw new Error("componentName required for COMPONENT_VALUES");
      const componentState = state.componentStates[context.componentName];
      if (context.expression) {
        return evalJsonata(context.expression, componentState);
      }
      return componentState;
    }

    case "TEMPLATE": {
      if (!context.template) throw new Error("template required for TEMPLATE context");
      const ctxs = context.contexts ? await resolveContexts(context.contexts, state, wizard) : {};
      // Merge all available data for template rendering
      const templateData = { 
        ...state.currentStepValues, 
        ...state.allStepValues,
        ...ctxs 
      };
      const rendered = await renderTemplate(context.template, templateData);
      // Try parse as JSON/number if possible
      try {
        return JSON.parse(rendered);
      } catch {
        return rendered;
      }
    }

    case "REMOTE_ACTION": {
      if (!context.actionName) throw new Error("actionName required for REMOTE_ACTION");
      const action = wizard.remoteActions?.find((a) => a.name === context.actionName);
      if (!action) throw new Error(`Remote action '${context.actionName}' not found`);

      const ctxs = context.contexts ? await resolveContexts(context.contexts, state, wizard) : {};
      
      // Merge with current step values
      const mergedContexts = { ...state.currentStepValues, ...ctxs };
      
      const result = await runRemoteAction(action, mergedContexts);
      return result.result;
    }

    case "FOREACH": {
      if (!context.forEachName) throw new Error("forEachName required for FOREACH context");
      const stack = state.forEachStacks.find((s) => s.name === context.forEachName);
      if (!stack) throw new Error(`ForEach '${context.forEachName}' not found in stack`);

      if (context.expression) {
        const data = { index: stack.index, item: stack.item, array: stack.array };
        return evalJsonata(context.expression, data);
      }
      return stack;
    }

    case "GROUP_INDEX": {
      const index = state.groupIndexStack[state.groupIndexStack.length - 1];
      if (index === undefined) throw new Error("No group index in stack");
      if (context.expression) {
        return evalJsonata(context.expression, index);
      }
      return index;
    }

    case "LOCAL_CONTEXT": {
      if (!context.key) throw new Error("key required for LOCAL_CONTEXT");
      const value = state.localContexts[context.key];
      if (context.expression) {
        return evalJsonata(context.expression, value);
      }
      return value;
    }

    default:
      throw new Error(`Unknown context type: ${(context as any).type}`);
  }
}

async function resolveContexts(
  contexts: Context[],
  state: ContextEvaluationState,
  wizard: Wizard
): Promise<Record<string, unknown>> {
  const resolved: Record<string, unknown> = {};
  for (const ctx of contexts) {
    resolved[ctx.key] = await resolveContext(ctx, state, wizard);
  }
  return resolved;
}

export async function resolveContextWithSubContexts(
  context: Context,
  state: ContextEvaluationState,
  wizard: Wizard
): Promise<unknown> {
  // First resolve sub-contexts if any
  if (context.contexts && context.contexts.length > 0) {
    const subResolved = await resolveContexts(context.contexts, state, wizard);
    // Merge into state for this resolution
    const newState = { ...state, localContexts: { ...state.localContexts, ...subResolved } };
    return resolveContext(context, newState, wizard);
  }
  return resolveContext(context, state, wizard);
}
