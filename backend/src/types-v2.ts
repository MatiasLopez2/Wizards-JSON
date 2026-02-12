import { z } from "zod";

// ======================
// Nomenclature validation
// ======================
export const nameRegex = /^[A-Za-z_][A-Za-z0-9_]*$/;

const uniqueBy = <T>(items: T[], getKey: (item: T) => string) => {
  const seen = new Set<string>();
  for (const item of items) {
    const key = getKey(item);
    if (seen.has(key)) return false;
    seen.add(key);
  }
  return true;
};

// ======================
// Context Types
// ======================
export const ContextTypeSchema = z.enum([
  "VALUE",
  "CURRENT_STEP_VALUES",
  "ALL_STEP_VALUES",
  "COMPONENT_VALUES",
  "TEMPLATE",
  "REMOTE_ACTION",
  "FOREACH",
  "GROUP_INDEX",
  "LOCAL_CONTEXT",
  "LOCAL",  // Alias para LOCAL_CONTEXT
  "EXTERNAL_METADATA"  // Metadata externa
]);
export type ContextType = z.infer<typeof ContextTypeSchema>;

export const ContextSchema: z.ZodType<any> = z.lazy(() =>
  z.object({
    key: z.string(),
    type: ContextTypeSchema,
    value: z.unknown().optional(),
    expression: z.string().optional(),
    fieldName: z.string().optional(),
    componentName: z.string().optional(),
    actionName: z.string().optional(),
    forEachName: z.string().optional(),
    template: z.string().optional(),
    contexts: z.array(ContextSchema).optional(),
    encodingType: z.enum(["BASE64", "UTF8"]).optional()
  })
);
export type Context = z.infer<typeof ContextSchema>;

// ======================
// Conditions
// ======================
export const ConditionSchema: z.ZodType<any> = z.lazy(() =>
  z.union([
    z.boolean(),
    z.object({
      isEmpty: z.object({ path: z.string().optional(), context: ContextSchema.optional() }).optional(),
      matchesRegex: z
        .object({ path: z.string().optional(), value: z.string(), context: ContextSchema.optional() })
        .optional(),
      equals: z
        .object({
          context: ContextSchema.optional(),
          value: z.union([ContextSchema, z.unknown()]).optional()
        })
        .optional(),
      lessThan: z
        .object({ context: ContextSchema.optional(), value: z.union([ContextSchema, z.number()]) })
        .optional(),
      moreThan: z
        .object({ context: ContextSchema.optional(), value: z.union([ContextSchema, z.number()]) })
        .optional(),
      and: z.array(z.lazy(() => ConditionSchema)).optional(),
      or: z.array(z.lazy(() => ConditionSchema)).optional(),
      not: z.lazy(() => ConditionSchema).optional(),
      remote: z
        .object({
          name: z.string(),
          context: z.array(ContextSchema).optional(),
          contexts: z.array(ContextSchema).optional()
        })
        .optional(),
      context: ContextSchema.optional()
    })
  ])
);
export type Condition = z.infer<typeof ConditionSchema>;

// ======================
// Actions
// ======================
export const ActionTypeSchema = z.enum([
  "GO_TO_STEP",
  "SAVE_STEP_VALUES",
  "INIT_STEP_VALUES",
  "FINISH_WIZARD",
  "UPDATE_COMPONENT",
  "SET_VALUE",
  "ADD_ERROR",
  "CLEAR_ERRORS",
  "CONSOLE_LOG",
  "REMOTE_UPDATE_COMPONENT",
  "ADD_GROUP",
  "REMOVE_GROUP",
  "TAKE_PHOTO",
  "KILL_TASK",
  "SET_LOCAL_CONTEXT",
  "CONFIRM_LEAVE_PAGE",
  "EXECUTE_FORM",  // Ejecutar formulario
  "SCHEDULE_TASK",  // Programar tarea
  "REDIRECT"  // Redirección
]);
export type ActionType = z.infer<typeof ActionTypeSchema>;

export const ActionSchema: z.ZodType<any> = z.lazy(() =>
  z.object({
    type: ActionTypeSchema,
    order: z.number(),
    stepName: z.union([z.string(), ContextSchema]).optional(),
    targetName: z.string().optional(),
    targetProp: z.string().optional(),
    targetContexts: z.array(ContextSchema).optional(),
    fieldName: z.string().optional(),
    fieldContexts: z.array(ContextSchema).optional(),
    errorMessage: z.string().optional(),
    message: z.string().optional(),
    name: z.string().optional(),
    value: z.unknown().optional(),
    context: ContextSchema.optional(),
    contexts: z.array(ContextSchema).optional(),
    groupName: z.string().optional(),
    groupIndex: ContextSchema.optional(),
    contextName: z.string().optional()
  })
);
export type Action = z.infer<typeof ActionSchema>;

// ======================
// Blocks (IF/FOREACH/SCHEDULE)
// ======================
export const BlockTypeSchema = z.enum(["ACTIONS", "CONDITIONAL", "FOREACH", "SCHEDULE_TASK"]);
export type BlockType = z.infer<typeof BlockTypeSchema>;

export const BlockSchema: z.ZodType<any> = z.lazy(() =>
  z.object({
    type: BlockTypeSchema.optional(),
    order: z.number(),
    conditions: ConditionSchema.optional(),
    then: z.array(z.lazy(() => BlockSchema)).optional(),
    else: z.array(z.lazy(() => BlockSchema)).optional(),
    actions: z.array(ActionSchema).optional(),
    name: z.string().optional(),
    context: ContextSchema.optional(),
    blocks: z.array(z.lazy(() => BlockSchema)).optional(),
    delays: z.array(z.number()).optional()
  })
);
export type Block = z.infer<typeof BlockSchema>;

// ======================
// Events
// ======================
export const EventTypeSchema = z.enum([
  "ON_CLICK",
  "ON_CHANGE",
  "ON_MOUNTED",
  "ON_BLUR",
  "ON_FOCUS",
  "RESTRICTION_FAILED",
  "ON_WINDOW_BEFORE_UNLOAD"
]);
export type EventType = z.infer<typeof EventTypeSchema>;

export const EventsSchema = z.record(EventTypeSchema, z.array(BlockSchema));
export type Events = z.infer<typeof EventsSchema>;

// ======================
// Components
// ======================
export const ComponentTypeSchema = z.enum([
  "TEXT",
  "FIELD",
  "BUTTON",
  "ALERT",
  "SPINNER",
  "LABEL"
]);
export type ComponentType = z.infer<typeof ComponentTypeSchema>;

export const FieldTypeSchema = z.enum([
  "TEXT",
  "NUMBER",
  "SELECT",
  "DATE",
  "FILE",
  "CHECKBOX",
  "OTP",
  "VIDEO_CAMERA",
  "MAP",
  "REPEATABLE_GROUP"
]);
export type FieldType = z.infer<typeof FieldTypeSchema>;

export const PositionSchema = z.object({
  className: z.string().optional(),
  components: z.array(z.lazy(() => ComponentSchema)).optional()
});
export type Position = z.infer<typeof PositionSchema>;

export const ComponentSchema: z.ZodType<any> = z.lazy(() =>
  z.object({
    order: z.number(),
    name: z.string(),  // Removida validación regex para permitir cualquier nombre
    componentType: ComponentTypeSchema,
    component: z.any(),
    className: z.string().optional(),
    events: EventsSchema.optional(),
    top: PositionSchema.optional(),
    left: PositionSchema.optional(),
    right: PositionSchema.optional(),
    bottom: PositionSchema.optional()
  })
);
export type Component = z.infer<typeof ComponentSchema>;

// ======================
// Steps
// ======================
export const StepSchema = z.object({
  name: z.string(),  // Removida validación regex para permitir cualquier nombre
  title: z.string().optional(),
  description: z.string().optional(),
  className: z.string().optional(),
  components: z.array(ComponentSchema),
  events: EventsSchema.optional()
});
export type Step = z.infer<typeof StepSchema>;

// ======================
// Remote Actions
// ======================
export const HttpMethodSchema = z.enum(["GET", "POST", "PUT", "DELETE", "PATCH"]);
export type HttpMethod = z.infer<typeof HttpMethodSchema>;

export const ContentTypeSchema = z.enum(["JSON", "URL_ENCODING", "FORM_DATA", "TEXT"]);
export type ContentType = z.infer<typeof ContentTypeSchema>;

export const RemoteActionSchema = z.object({
  name: z.string().regex(nameRegex),
  method: HttpMethodSchema,
  url: z.string().min(1),
  contentType: ContentTypeSchema,
  body: z.string().optional(),
  params: z.string().optional(),
  headers: z.string().optional(),
  expression: z.string().optional(),
  certificateName: z.string().optional()
});
export type RemoteAction = z.infer<typeof RemoteActionSchema>;

// ======================
// Wizard
// ======================
export const WizardSchema = z
  .object({
    name: z.string(),
    description: z.string().optional(),
    initialStep: z.string(),
    isActive: z.boolean().optional(),  // Campo adicional del wizard original
    steps: z.array(StepSchema),
    remoteActions: z.array(RemoteActionSchema).optional()
  })
  .passthrough()  // Cambio de strict() a passthrough() para permitir campos adicionales
  .superRefine((wizard, ctx) => {
    if (!uniqueBy(wizard.steps, (s) => s.name)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Duplicate step names" });
      return;
    }

    const actions = wizard.remoteActions ?? [];
    if (!uniqueBy(actions, (a) => a.name)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Duplicate action names" });
    }

    if (!wizard.steps.some((s) => s.name === wizard.initialStep)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `initialStep '${wizard.initialStep}' not found in steps`
      });
    }
  });

export type Wizard = z.infer<typeof WizardSchema>;
