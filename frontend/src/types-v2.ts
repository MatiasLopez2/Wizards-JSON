export type ContextType =
  | "VALUE"
  | "CURRENT_STEP_VALUES"
  | "ALL_STEP_VALUES"
  | "COMPONENT_VALUES"
  | "TEMPLATE"
  | "REMOTE_ACTION"
  | "FOREACH"
  | "GROUP_INDEX"
  | "LOCAL_CONTEXT";

export type Context = {
  key: string;
  type: ContextType;
  value?: unknown;
  expression?: string;
  fieldName?: string;
  componentName?: string;
  actionName?: string;
  forEachName?: string;
  template?: string;
  contexts?: Context[];
  encodingType?: "BASE64" | "UTF8";
};

export type Condition =
  | boolean
  | {
      isEmpty?: { path?: string; context?: Context };
      matchesRegex?: { path?: string; value: string; context?: Context };
      equals?: { context?: Context; value?: Context | unknown };
      lessThan?: { context?: Context; value: Context | number };
      moreThan?: { context?: Context; value: Context | number };
      and?: Condition[];
      or?: Condition[];
      not?: Condition;
      remote?: { name: string; context?: Context[]; contexts?: Context[] };
      context?: Context;
    };

export type ActionType =
  | "GO_TO_STEP"
  | "SAVE_STEP_VALUES"
  | "INIT_STEP_VALUES"
  | "FINISH_WIZARD"
  | "UPDATE_COMPONENT"
  | "SET_VALUE"
  | "ADD_ERROR"
  | "CLEAR_ERRORS"
  | "CONSOLE_LOG"
  | "REMOTE_UPDATE_COMPONENT"
  | "ADD_GROUP"
  | "REMOVE_GROUP"
  | "TAKE_PHOTO"
  | "KILL_TASK"
  | "SET_LOCAL_CONTEXT"
  | "CONFIRM_LEAVE_PAGE";

export type Action = {
  type: ActionType;
  order: number;
  stepName?: string | Context;
  targetName?: string;
  targetProp?: string;
  targetContexts?: Context[];
  fieldName?: string;
  fieldContexts?: Context[];
  errorMessage?: string;
  message?: string;
  name?: string;
  value?: unknown;
  context?: Context;
  contexts?: Context[];
  groupName?: string;
  groupIndex?: Context;
  contextName?: string;
};

export type BlockType = "ACTIONS" | "CONDITIONAL" | "FOREACH" | "SCHEDULE_TASK";

export type Block = {
  type?: BlockType;
  order: number;
  conditions?: Condition;
  then?: Block[];
  else?: Block[];
  actions?: Action[];
  name?: string;
  context?: Context;
  blocks?: Block[];
  delays?: number[];
};

export type EventType =
  | "ON_CLICK"
  | "ON_CHANGE"
  | "ON_MOUNTED"
  | "ON_BLUR"
  | "ON_FOCUS"
  | "RESTRICTION_FAILED"
  | "ON_WINDOW_BEFORE_UNLOAD";

export type Events = Partial<Record<EventType, Block[]>>;

export type ComponentType = "TEXT" | "FIELD" | "BUTTON" | "ALERT" | "SPINNER" | "LABEL";

export type FieldType =
  | "TEXT"
  | "NUMBER"
  | "SELECT"
  | "DATE"
  | "FILE"
  | "CHECKBOX"
  | "OTP"
  | "VIDEO_CAMERA"
  | "MAP"
  | "REPEATABLE_GROUP";

export type Position = {
  className?: string;
  components?: Component[];
};

export type Component = {
  order: number;
  name: string;
  componentType: ComponentType;
  component: any;
  className?: string;
  events?: Events;
  top?: Position;
  left?: Position;
  right?: Position;
  bottom?: Position;
};

export type Step = {
  name: string;
  title?: string;
  description?: string;
  className?: string;
  components: Component[];
  events?: Events;
};

export type HttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
export type ContentType = "JSON" | "URL_ENCODING" | "FORM_DATA" | "TEXT";

export type RemoteAction = {
  name: string;
  method: HttpMethod;
  url: string;
  contentType: ContentType;
  body?: string;
  params?: string;
  headers?: string;
  expression?: string;
  certificateName?: string;
};

export type Wizard = {
  name: string;
  description?: string;
  initialStep: string;
  steps: Step[];
  remoteActions?: RemoteAction[];
};

export type ContextEvaluationState = {
  currentStepValues: Record<string, unknown>;
  allStepValues: Record<string, Record<string, unknown>>;
  componentStates: Record<string, unknown>;
  localContexts: Record<string, unknown>;
  forEachStacks: Array<{ name: string; index: number; item: unknown; array: unknown[] }>;
  groupIndexStack: number[];
};

export type ActionExecutionResult = {
  type: string;
  payload?: unknown;
  error?: string;
};
